import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { createServer as createViteServer } from 'vite';

const PHIVOLCS_FEED_URL = 'https://www.phivolcs.dost.gov.ph/feed/';
const NOMINATIM_SEARCH_URL = new URL(
  process.env.NOMINATIM_SEARCH_URL || 'https://nominatim.openstreetmap.org/search'
);
if (NOMINATIM_SEARCH_URL.protocol !== 'https:' || NOMINATIM_SEARCH_URL.username || NOMINATIM_SEARCH_URL.password) {
  throw new Error('NOMINATIM_SEARCH_URL must be an HTTPS URL without embedded credentials.');
}
const OPEN_METEO_API_URL = new URL('https://api.open-meteo.com/v1/forecast');
OPEN_METEO_API_URL.search = new URLSearchParams({
  latitude: '13.45',
  longitude: '121.95',
  current: 'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_gusts_10m,weather_code',
  timezone: 'Asia/Manila'
}).toString();
const FEED_CACHE_TTL_MS = 5 * 60 * 1000;
const WEATHER_CACHE_TTL_MS = 15 * 60 * 1000;
const UPSTREAM_TIMEOUT_MS = 8 * 1000;
const MAX_UPSTREAM_ATTEMPTS = 3;
const GEOCODING_CACHE_TTL_MS = 60 * 60 * 1000;
const GEOCODING_MIN_INTERVAL_MS = 1000;
const MAX_GEOCODING_CACHE_ENTRIES = 200;
const MAX_FEED_BYTES = 2 * 1024 * 1024;
const isDevelopment = process.argv.includes('--dev');
const port = Number(process.env.PORT || 5173);
const distDirectory = resolve('dist');

let feedCache;
let feedRefresh;
let weatherCache;
let weatherRefresh;
const geocodingCache = new Map();
let lastGeocodingRequestAt = 0;
let vite;

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp'
};

async function fetchUpstream(url, options, sourceName) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_UPSTREAM_ATTEMPTS; attempt += 1) {
    let upstream;
    try {
      upstream = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)
      });
    } catch (error) {
      lastError = error;
    }

    if (upstream?.ok) return upstream;
    if (upstream) {
      lastError = new Error(`${sourceName} returned HTTP ${upstream.status}`);
      if (upstream.status !== 429 && upstream.status < 500) throw lastError;
    }

    if (attempt < MAX_UPSTREAM_ATTEMPTS) {
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 500 * attempt));
    }
  }

  throw new Error(
    `${sourceName} could not be retrieved after ${MAX_UPSTREAM_ATTEMPTS} attempts: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`
  );
}

async function handlePhivolcsFeed(response) {
  const now = Date.now();
  if (feedCache && now - feedCache.fetchedAt < FEED_CACHE_TTL_MS) {
    response.writeHead(200, {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Feed-Fetched-At': new Date(feedCache.fetchedAt).toISOString(),
      'X-Feed-Stale': 'false'
    });
    response.end(feedCache.body);
    return;
  }

  try {
    if (!feedRefresh) {
      feedRefresh = (async () => {
        const upstream = await fetchUpstream(
          PHIVOLCS_FEED_URL,
          { headers: { Accept: 'application/rss+xml, application/xml, text/xml' } },
          'PHIVOLCS RSS'
        );

        const contentType = upstream.headers.get('content-type') || '';
        if (!/xml|rss/i.test(contentType)) {
          throw new Error(`Unexpected PHIVOLCS feed content type: ${contentType || 'missing'}`);
        }

        const body = await upstream.text();
        if (Buffer.byteLength(body, 'utf8') > MAX_FEED_BYTES || !/<rss\b/i.test(body)) {
          throw new Error('PHIVOLCS response is not a valid, supported RSS feed');
        }
        return { body, fetchedAt: Date.now() };
      })();
    }

    try {
      feedCache = await feedRefresh;
    } finally {
      feedRefresh = undefined;
    }
    response.writeHead(200, {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Feed-Fetched-At': new Date(feedCache.fetchedAt).toISOString(),
      'X-Feed-Stale': 'false'
    });
    response.end(feedCache.body);
  } catch (error) {
    console.error('Failed to retrieve official PHIVOLCS RSS feed', error);
    if (feedCache) {
      response.writeHead(200, {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Feed-Fetched-At': new Date(feedCache.fetchedAt).toISOString(),
        'X-Feed-Stale': 'true'
      });
      response.end(feedCache.body);
      return;
    }

    response.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify({ error: 'The official PHIVOLCS RSS feed is currently unavailable.' }));
  }
}

async function handleMarinduqueWeather(response) {
  if (weatherCache && Date.now() - weatherCache.fetchedAt < WEATHER_CACHE_TTL_MS) {
    response.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Data-Fetched-At': new Date(weatherCache.fetchedAt).toISOString(),
      'X-Data-Stale': 'false'
    });
    response.end(JSON.stringify(weatherCache));
    return;
  }

  try {
    if (!weatherRefresh) {
      weatherRefresh = (async () => {
        const upstream = await fetchUpstream(
          OPEN_METEO_API_URL,
          { headers: { Accept: 'application/json' } },
          'Open-Meteo API'
        );

        const contentType = upstream.headers.get('content-type') || '';
        if (!/application\/json/i.test(contentType)) {
          throw new Error(`Unexpected Open-Meteo response content type: ${contentType || 'missing'}`);
        }

        const body = await upstream.text();
        if (Buffer.byteLength(body, 'utf8') > 1024 * 1024) {
          throw new Error('Open-Meteo response exceeded the allowed size');
        }
        const data = JSON.parse(body);
        const current = data?.current;
        const requiredValues = [
          current?.temperature_2m,
          current?.relative_humidity_2m,
          current?.precipitation,
          current?.wind_speed_10m,
          current?.wind_gusts_10m,
          current?.weather_code
        ];
        if (
          typeof current?.time !== 'string' ||
          requiredValues.some((value) => typeof value !== 'number' || !Number.isFinite(value))
        ) {
          throw new Error('Open-Meteo returned an unexpected current-weather response');
        }

        return { data, fetchedAt: Date.now() };
      })();
    }

    try {
      weatherCache = await weatherRefresh;
    } finally {
      weatherRefresh = undefined;
    }
    response.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Data-Fetched-At': new Date(weatherCache.fetchedAt).toISOString(),
      'X-Data-Stale': 'false'
    });
    response.end(JSON.stringify(weatherCache));
  } catch (error) {
    console.error('Failed to retrieve supplemental Open-Meteo weather data', error);
    if (weatherCache) {
      response.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Data-Fetched-At': new Date(weatherCache.fetchedAt).toISOString(),
        'X-Data-Stale': 'true'
      });
      response.end(JSON.stringify(weatherCache));
      return;
    }

    response.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify({ error: 'Supplemental weather data is currently unavailable.' }));
  }
}

async function handleAddressSearch(requestUrl, response) {
  const query = (new URL(requestUrl, 'http://localhost').searchParams.get('q') || '').trim();
  if (query.length < 3 || query.length > 120) {
    response.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify({ error: 'Enter a place or address between 3 and 120 characters.' }));
    return;
  }

  const cacheKey = query.toLocaleLowerCase();
  const cached = geocodingCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < GEOCODING_CACHE_TTL_MS) {
    response.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Search-Cached': 'true'
    });
    response.end(JSON.stringify({ results: cached.results }));
    return;
  }

  const now = Date.now();
  const waitMs = GEOCODING_MIN_INTERVAL_MS - (now - lastGeocodingRequestAt);
  if (waitMs > 0) {
    response.writeHead(429, {
      'Content-Type': 'application/json; charset=utf-8',
      'Retry-After': String(Math.ceil(waitMs / 1000))
    });
    response.end(JSON.stringify({ error: 'Address search is rate limited. Please wait a moment and try again.' }));
    return;
  }
  lastGeocodingRequestAt = now;

  try {
    const searchUrl = new URL(NOMINATIM_SEARCH_URL);
    searchUrl.search = new URLSearchParams({
      q: query,
      format: 'jsonv2',
      limit: '5',
      countrycodes: 'ph',
      viewbox: '121.65,13.65,122.35,12.95',
      bounded: '1',
      addressdetails: '0'
    }).toString();
    const upstream = await fetch(searchUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'PULSO-Marinduque/1.0 (https://github.com/gelllooo/pulso)'
      },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)
    });
    if (!upstream.ok) {
      throw new Error(`OpenStreetMap Nominatim returned HTTP ${upstream.status}`);
    }
    const contentType = upstream.headers.get('content-type') || '';
    if (!/application\/json/i.test(contentType)) {
      throw new Error(`Unexpected Nominatim response content type: ${contentType || 'missing'}`);
    }

    const body = await upstream.text();
    if (Buffer.byteLength(body, 'utf8') > 512 * 1024) {
      throw new Error('Nominatim response exceeded the allowed size');
    }
    const data = JSON.parse(body);
    if (!Array.isArray(data)) throw new Error('Nominatim returned an unexpected search response');

    const results = data.flatMap((item) => {
      const lat = Number(item?.lat);
      const lon = Number(item?.lon);
      const displayName = typeof item?.display_name === 'string' ? item.display_name.trim() : '';
      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lon) ||
        lat < 12.95 ||
        lat > 13.65 ||
        lon < 121.65 ||
        lon > 122.35 ||
        !displayName
      ) return [];
      return [{ id: `${item.osm_type || 'place'}-${item.osm_id || `${lat}-${lon}`}`, lat, lon, displayName }];
    });
    geocodingCache.set(cacheKey, { results, fetchedAt: Date.now() });
    while (geocodingCache.size > MAX_GEOCODING_CACHE_ENTRIES) {
      geocodingCache.delete(geocodingCache.keys().next().value);
    }

    response.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Search-Cached': 'false'
    });
    response.end(JSON.stringify({ results }));
  } catch (error) {
    console.error('Failed to search OpenStreetMap Nominatim', error);
    response.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify({ error: 'Address search is temporarily unavailable. Please try again later.' }));
  }
}

async function serveStaticFile(requestUrl, response) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(requestUrl, 'http://localhost').pathname);
  } catch {
    response.writeHead(400).end('Invalid request path');
    return;
  }

  const requestedPath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  let filePath = resolve(distDirectory, requestedPath);
  if (!filePath.startsWith(`${distDirectory}${sep}`) && filePath !== resolve(distDirectory, 'index.html')) {
    response.writeHead(403).end('Forbidden');
    return;
  }

  try {
    if (!(await stat(filePath)).isFile()) throw new Error('Not a file');
  } catch {
    filePath = resolve(distDirectory, 'index.html');
  }

  try {
    const content = await readFile(filePath);
    response.writeHead(200, {
      'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream',
      'Cache-Control': extname(filePath) === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable'
    });
    response.end(content);
  } catch {
    response.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Production assets are unavailable. Run the production build first.');
  }
}

const server = createServer(async (request, response) => {
  if (request.method !== 'GET') {
    response.writeHead(405, { Allow: 'GET' }).end('Method not allowed');
    return;
  }

  const pathname = new URL(request.url, 'http://localhost').pathname;
  if (pathname === '/api/official/phivolcs/news') {
    await handlePhivolcsFeed(response);
    return;
  }
  if (pathname === '/api/supplemental/weather/marinduque') {
    await handleMarinduqueWeather(response);
    return;
  }
  if (pathname === '/api/map/search') {
    await handleAddressSearch(request.url, response);
    return;
  }

  if (vite) {
    vite.middlewares(request, response);
    return;
  }

  await serveStaticFile(request.url, response);
});

if (isDevelopment) {
  vite = await createViteServer({
    configFile: resolve('vite.config.ts'),
    server: { middlewareMode: true },
    appType: 'spa'
  });
}

function listenOnAvailablePort(candidatePort) {
  const onListening = () => {
    server.off('error', onError);
    console.log(`PULSO ${isDevelopment ? 'development' : 'production'} server listening on http://localhost:${server.address().port}`);
  };
  const onError = (error) => {
    server.off('listening', onListening);
    if (error.code === 'EADDRINUSE' && candidatePort < port + 20) {
      listenOnAvailablePort(candidatePort + 1);
      return;
    }
    console.error('Failed to start PULSO server', error);
    process.exitCode = 1;
  };
  server.once('listening', onListening);
  server.once('error', onError);
  server.listen(candidatePort, '0.0.0.0');
}

listenOnAvailablePort(port);

async function shutdown() {
  server.close();
  if (vite) await vite.close();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
