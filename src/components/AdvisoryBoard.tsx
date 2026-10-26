import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Radio,
  ExternalLink,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Compass,
  FileCheck,
  CheckCircle2,
  Info,
  CloudSun,
  Droplets,
  Wind
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

const NEWS_REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const WEATHER_REFRESH_INTERVAL_MS = 15 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 30 * 1000;

const OFFICIAL_SOURCES = [
  { label: 'PAGASA', url: 'https://pagasa.dost.gov.ph/' },
  { label: 'PAGASA PANaHON', url: 'https://panahon.gov.ph/' },
  { label: 'DOST-PHIVOLCS', url: 'https://www.phivolcs.dost.gov.ph/' },
  { label: 'PHIVOLCS Official RSS', url: 'https://www.phivolcs.dost.gov.ph/feed/' },
  { label: 'PAGASA PublicAlert', url: 'https://publicalert.pagasa.dost.gov.ph/' },
  { label: 'PAGASA TenDay Forecast', url: 'https://tenday.pagasa.dost.gov.ph/' },
  { label: 'GeoRisk Philippines', url: 'https://georisk.gov.ph/' },
  { label: 'HazardHunterPH', url: 'https://hazardhunter.georisk.gov.ph/' }
];

interface AgencyNewsItem {
  title: string;
  url: string;
  publishedAt: string | null;
  categories: string[];
}

interface SupplementalWeather {
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    precipitation: number;
    wind_speed_10m: number;
    wind_gusts_10m: number;
    weather_code: number;
  };
}

interface WeatherProxyResponse {
  data: SupplementalWeather;
  fetchedAt: number;
}

function isWeatherProxyResponse(value: unknown): value is WeatherProxyResponse {
  if (!value || typeof value !== 'object' || !('data' in value) || !('fetchedAt' in value)) {
    return false;
  }
  const payload = value as { data?: unknown; fetchedAt?: unknown };
  if (typeof payload.fetchedAt !== 'number' || !payload.data || typeof payload.data !== 'object') {
    return false;
  }
  const data = payload.data as { current?: unknown };
  if (!data.current || typeof data.current !== 'object') return false;
  const current = data.current as Record<string, unknown>;
  return typeof current.time === 'string' &&
    ['temperature_2m', 'relative_humidity_2m', 'precipitation', 'wind_speed_10m', 'wind_gusts_10m', 'weather_code']
      .every((key) => typeof current[key] === 'number' && Number.isFinite(current[key]));
}

function describeWeatherCode(code: number) {
  if (code === 0) return 'Clear sky';
  if (code === 1) return 'Mainly clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code === 45 || code === 48) return 'Fog';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle';
  if ([61, 63, 65, 66, 67].includes(code)) return 'Rain';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Snow';
  if ([80, 81, 82].includes(code)) return 'Rain showers';
  if ([95, 96, 99].includes(code)) return 'Thunderstorm';
  return `Weather code ${code}`;
}

export const AdvisoryBoard: React.FC = () => {
  const { advisories, crisisMode, setCrisisMode } = useApp();
  const [agencyNews, setAgencyNews] = useState<AgencyNewsItem[]>([]);
  const [feedRetrievedAt, setFeedRetrievedAt] = useState<string | null>(null);
  const [feedIsStale, setFeedIsStale] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);
  const [weather, setWeather] = useState<SupplementalWeather | null>(null);
  const [weatherRetrievedAt, setWeatherRetrievedAt] = useState<string | null>(null);
  const [weatherIsStale, setWeatherIsStale] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const feedRequestRef = useRef<AbortController | null>(null);
  const weatherRequestRef = useRef<AbortController | null>(null);

  const retrievePhivolcsNews = useCallback(async () => {
    if (feedRequestRef.current) return;
    const controller = new AbortController();
    feedRequestRef.current = controller;
    const timeoutId = window.setTimeout(() => {
      controller.abort(new DOMException('PHIVOLCS feed request timed out.', 'TimeoutError'));
    }, REQUEST_TIMEOUT_MS);

    setIsLoadingFeed(true);
    setFeedError(null);
    try {
      const response = await fetch('/api/official/phivolcs/news', {
        cache: 'no-store',
        signal: controller.signal
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || `Official PHIVOLCS feed request failed (HTTP ${response.status}).`);
      }

      const xml = new DOMParser().parseFromString(await response.text(), 'application/xml');
      if (xml.querySelector('parsererror') || xml.documentElement.tagName.toLowerCase() !== 'rss') {
        throw new Error('The official PHIVOLCS feed returned invalid RSS data.');
      }

      const feedUrl = new URL('https://www.phivolcs.dost.gov.ph/');
      const items = Array.from(xml.querySelectorAll('channel > item')).flatMap((item) => {
        const title = item.querySelector('title')?.textContent?.trim();
        const link = item.querySelector('link')?.textContent?.trim();
        if (!title || !link) return [];
        const itemUrl = new URL(link, feedUrl);
        if (itemUrl.origin !== feedUrl.origin) return [];

        const publishedAt = item.querySelector('pubDate')?.textContent?.trim();
        const categories = Array.from(item.querySelectorAll('category'))
          .map((category) => category.textContent?.trim())
          .filter((category): category is string => Boolean(category));

        return [{
          title,
          url: itemUrl.toString(),
          publishedAt: publishedAt || null,
          categories
        }];
      });

      setAgencyNews(items);
      const retrievedAt = response.headers.get('X-Feed-Fetched-At');
      setFeedRetrievedAt(retrievedAt);
      setFeedIsStale(response.headers.get('X-Feed-Stale') === 'true');
    } catch (error) {
      if (controller.signal.reason?.name !== 'AbortError') {
        setFeedError(error instanceof Error ? error.message : 'Unable to retrieve the official PHIVOLCS feed.');
        setFeedIsStale(true);
      }
    } finally {
      window.clearTimeout(timeoutId);
      if (feedRequestRef.current === controller) feedRequestRef.current = null;
      if (controller.signal.reason?.name !== 'AbortError') setIsLoadingFeed(false);
    }
  }, []);

  const retrieveWeather = useCallback(async () => {
    if (weatherRequestRef.current) return;
    const controller = new AbortController();
    weatherRequestRef.current = controller;
    const timeoutId = window.setTimeout(() => {
      controller.abort(new DOMException('Weather request timed out.', 'TimeoutError'));
    }, REQUEST_TIMEOUT_MS);

    setIsLoadingWeather(true);
    setWeatherError(null);
    try {
      const response = await fetch('/api/supplemental/weather/marinduque', {
        cache: 'no-store',
        signal: controller.signal
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        const message = payload && typeof payload === 'object' && 'error' in payload &&
          typeof payload.error === 'string'
          ? payload.error
          : `Supplemental weather request failed (HTTP ${response.status}).`;
        throw new Error(message);
      }
      if (!isWeatherProxyResponse(payload)) {
        throw new Error('The weather service returned an unexpected response.');
      }

      setWeather(payload.data);
      setWeatherRetrievedAt(new Date(payload.fetchedAt).toISOString());
      setWeatherIsStale(response.headers.get('X-Data-Stale') === 'true');
    } catch (error) {
      if (controller.signal.reason?.name !== 'AbortError') {
        setWeatherIsStale(true);
        setWeatherError(error instanceof Error ? error.message : 'Unable to retrieve supplemental weather data.');
      }
    } finally {
      window.clearTimeout(timeoutId);
      if (weatherRequestRef.current === controller) weatherRequestRef.current = null;
      if (controller.signal.reason?.name !== 'AbortError') setIsLoadingWeather(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const initialId = window.setTimeout(() => {
      if (active) void retrievePhivolcsNews();
    }, 0);
    const intervalId = window.setInterval(() => {
      if (active) void retrievePhivolcsNews();
    }, NEWS_REFRESH_INTERVAL_MS);
    return () => {
      active = false;
      window.clearTimeout(initialId);
      window.clearInterval(intervalId);
      feedRequestRef.current?.abort();
    };
  }, [retrievePhivolcsNews]);

  useEffect(() => {
    let active = true;
    const initialId = window.setTimeout(() => {
      if (active) void retrieveWeather();
    }, 0);
    const intervalId = window.setInterval(() => {
      if (active) void retrieveWeather();
    }, WEATHER_REFRESH_INTERVAL_MS);
    return () => {
      active = false;
      window.clearTimeout(initialId);
      window.clearInterval(intervalId);
      weatherRequestRef.current?.abort();
    };
  }, [retrieveWeather]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2 text-coral-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Radio className="w-4 h-4" />
            <span>Official Information & Early Warning</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-marine-900">
            Mandated Agency Advisories & Bulletins
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-600 mt-0.5">
            Static reference entries are not a live agency feed. Check the issuing agency for current instructions.
          </p>
        </div>

        {/* Crisis Mode Toggle Card */}
        <div className="bg-sand-100 border border-sand-300 rounded-xl p-3 flex items-center space-x-3 text-xs">
          <div>
            <div className="font-bold text-marine-900">Crisis Mode Interface</div>
            <div className="text-[11px] text-charcoal-600">
              {crisisMode ? 'High-contrast emergency layout enabled' : 'Normal monitoring layout'}
            </div>
          </div>
          <button
            onClick={() => setCrisisMode(!crisisMode)}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors shadow-sm ${
              crisisMode
                ? 'bg-coral-600 text-white hover:bg-coral-700'
                : 'bg-marine-900 text-white hover:bg-marine-800'
            }`}
          >
            {crisisMode ? 'Deactivate Crisis' : 'Activate Crisis Mode'}
          </button>
        </div>
      </div>

      <nav aria-label="Official government information sources" className="mb-6 rounded-xl border border-sand-300 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-marine-900">
          Official Government Sources
        </h2>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {OFFICIAL_SOURCES.map((source) => (
            <a
              key={source.url}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-xs font-semibold text-marine-800 underline hover:text-marine-900"
            >
              <span>{source.label}</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ))}
        </div>
      </nav>

      <section aria-labelledby="weather-context-heading" className="mb-6 rounded-xl border border-sand-300 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="weather-context-heading" className="flex items-center gap-2 font-display text-lg font-bold text-marine-900">
              <CloudSun className="h-5 w-5" />
              Marinduque Weather Context
            </h2>
            <p className="mt-1 text-xs text-charcoal-600">
              Supplemental weather-model data, not a PAGASA observation or official warning.
            </p>
            <p className="mt-1 text-[11px] text-charcoal-500">
              Model time: {weather?.current.time || 'Not available'} · Retrieved: {weatherRetrievedAt ? new Date(weatherRetrievedAt).toLocaleString() : 'Not retrieved'}
              {weatherIsStale ? ' (data may be stale)' : ''}
            </p>
            <p className="mt-1 text-[11px] text-charcoal-500">
              Auto-refreshes every 15 minutes; upstream requests are limited to 3 attempts with an 8-second timeout each.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void retrieveWeather()}
            disabled={isLoadingWeather}
            className="rounded-lg bg-marine-900 px-3 py-2 text-xs font-semibold text-white hover:bg-marine-800 disabled:cursor-wait disabled:opacity-60"
          >
            {isLoadingWeather ? 'Refreshing…' : 'Refresh weather'}
          </button>
        </div>

        {weatherError && (
          <p role="alert" className="mb-3 rounded-lg border border-coral-200 bg-coral-50 p-3 text-xs text-coral-800">
            {weatherError}
          </p>
        )}

        {weather && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-sand-50 p-3">
              <div className="text-[11px] text-charcoal-500">Conditions</div>
              <div className="mt-1 font-semibold text-marine-900">{describeWeatherCode(weather.current.weather_code)}</div>
            </div>
            <div className="rounded-lg bg-sand-50 p-3">
              <div className="text-[11px] text-charcoal-500">Temperature / humidity</div>
              <div className="mt-1 font-semibold text-marine-900">
                {weather.current.temperature_2m}°C / {weather.current.relative_humidity_2m}%
              </div>
            </div>
            <div className="rounded-lg bg-sand-50 p-3">
              <div className="flex items-center gap-1 text-[11px] text-charcoal-500"><Droplets className="h-3.5 w-3.5" /> Precipitation (past hour)</div>
              <div className="mt-1 font-semibold text-marine-900">{weather.current.precipitation} mm</div>
            </div>
            <div className="rounded-lg bg-sand-50 p-3 sm:col-span-1">
              <div className="flex items-center gap-1 text-[11px] text-charcoal-500"><Wind className="h-3.5 w-3.5" /> Wind / gusts</div>
              <div className="mt-1 font-semibold text-marine-900">
                {weather.current.wind_speed_10m} / {weather.current.wind_gusts_10m} km/h
              </div>
            </div>
          </div>
        )}

        <p className="mt-3 text-[11px] text-charcoal-500">
          <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" className="font-semibold underline">
            Weather data by Open-Meteo.com
          </a>
          {' · '}
          Licensed under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className="underline">CC BY 4.0</a>.
          Forecasts are model estimates and must not replace official agency instructions.
        </p>
      </section>

      <section aria-labelledby="phivolcs-news-heading" className="mb-8 rounded-xl border border-sand-300 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="phivolcs-news-heading" className="font-display text-lg font-bold text-marine-900">
              PHIVOLCS Agency News
            </h2>
            <p className="mt-1 text-xs text-charcoal-600">
              Official general-purpose RSS feed. Entries may include news and notices; they are not represented as active warnings or advisories.
            </p>
            <p className="mt-1 text-[11px] text-charcoal-500">
              Last successful retrieval: {feedRetrievedAt ? new Date(feedRetrievedAt).toLocaleString() : 'Not retrieved'}
              {feedIsStale ? ' (showing cached feed; refresh failed)' : ''}
            </p>
            <p className="mt-1 text-[11px] text-charcoal-500">
              Auto-refreshes every 5 minutes; upstream requests are limited to 3 attempts with an 8-second timeout each.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void retrievePhivolcsNews()}
            disabled={isLoadingFeed}
            className="rounded-lg bg-marine-900 px-3 py-2 text-xs font-semibold text-white hover:bg-marine-800 disabled:cursor-wait disabled:opacity-60"
          >
            {isLoadingFeed ? 'Refreshing…' : 'Refresh PHIVOLCS News'}
          </button>
        </div>

        {feedError && (
          <p role="alert" className="mb-3 rounded-lg border border-coral-200 bg-coral-50 p-3 text-xs text-coral-800">
            {feedError}
          </p>
        )}

        {agencyNews.length > 0 ? (
          <ul className="divide-y divide-sand-200">
            {agencyNews.slice(0, 10).map((item) => (
              <li key={item.url} className="py-3 first:pt-0 last:pb-0">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-sm text-marine-800 underline hover:text-marine-900"
                >
                  {item.title}
                </a>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-charcoal-500">
                  <span>Published: {item.publishedAt || 'Not supplied'}</span>
                  {item.categories.length > 0 && <span>Category: {item.categories.join(', ')}</span>}
                </div>
              </li>
            ))}
          </ul>
        ) : !feedError && !isLoadingFeed ? (
          <p className="text-xs text-charcoal-500">The official feed contains no entries.</p>
        ) : null}
      </section>

      <div className="mb-3">
        <h2 className="font-display text-lg font-bold text-marine-900">
          Stored Sample Advisories
        </h2>
        <p className="text-xs text-charcoal-600">
          These legacy examples are unverified reference records, not current official alerts.
        </p>
      </div>

      {/* Advisory Feed Cards */}
      <div className="space-y-4">
        {advisories.map((adv) => {
          const isEmergency = adv.severity === 'emergency';
          const isWarning = adv.severity === 'warning';
          const freshnessClasses =
            adv.verificationStatus === 'current'
              ? 'bg-emerald-100 text-emerald-800'
              : adv.verificationStatus === 'expired'
              ? 'bg-slate-200 text-slate-700'
              : 'bg-amber-100 text-amber-800';

          return (
            <div
              key={adv.id}
              className={`rounded-xl border p-5 shadow-sm bg-white transition-all ${
                isEmergency
                  ? 'border-l-4 border-l-coral-600 border-sand-300'
                  : isWarning
                  ? 'border-l-4 border-l-amber-500 border-sand-300'
                  : 'border-l-4 border-l-sky-600 border-sand-300'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-marine-900 bg-sand-100 border border-sand-300 px-2 py-0.5 rounded">
                    {adv.issuer}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      isEmergency
                        ? 'bg-coral-100 text-coral-800'
                        : isWarning
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-sky-100 text-sky-800'
                    }`}
                  >
                    {adv.severity}
                  </span>
                  <span className="rounded bg-marine-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-marine-800">
                    {adv.category}
                  </span>
                  <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${freshnessClasses}`}>
                    {adv.verificationStatus}
                  </span>
                  <span className="text-[11px] text-charcoal-500 font-mono">
                    ID: {adv.id}
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-xs text-charcoal-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Issued: {adv.issuanceTime || 'Not supplied'}</span>
                </div>
              </div>

              <h3 className="font-display font-bold text-base sm:text-lg text-marine-900 mb-1">
                {adv.title}
              </h3>

              <div className="text-xs text-charcoal-600 mb-3">
                <strong>Issuing agency:</strong> {adv.issuer} &bull; <strong>Scope:</strong> {adv.scope}
              </div>

              {adv.validityPeriod && (
                <p className="mb-2 text-xs text-charcoal-600">
                  <strong>Validity:</strong> {adv.validityPeriod}
                </p>
              )}
              <p className="mb-3 text-xs text-charcoal-600">
                <strong>Last successful retrieval:</strong> {adv.lastRetrievedAt || 'Not recorded'}
              </p>

              <p className="text-xs sm:text-sm text-charcoal-800 leading-relaxed bg-sand-50/70 p-3 rounded-lg border border-sand-200 mb-4">
                {adv.content}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-sand-200 text-xs">
                <span className="text-[11px] text-charcoal-500">
                  Official source link, where available:
                </span>
                {adv.sourceUrl ? (
                  <a
                    href={adv.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-marine-800 hover:text-marine-900 underline flex items-center space-x-1"
                  >
                    <span>
                      {adv.issuer === 'PAGASA'
                        ? 'Open Official PAGASA Portal'
                        : 'Open Official HazardHunterPH Tool'}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <span className="text-charcoal-500" title="No verifiable original source URL is available for this sample advisory.">
                    Original source link unavailable
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Official Deference Safeguard Notice */}
      <div className="mt-8 bg-sand-100/80 border border-sand-300 rounded-xl p-4 text-xs text-charcoal-700 flex items-start space-x-3">
        <Info className="w-5 h-5 text-marine-700 shrink-0 mt-0.5" />
        <div>
          <strong className="text-marine-900">Legal & Warning Authority Safeguard:</strong> PULSO operates strictly as a localized community information layer and does NOT issue independent tropical cyclone warnings, tsunami alerts, or evacuation orders. All warnings originate from PAGASA, PHIVOLCS, NDRRMC, and authorized local chief executives.
        </div>
      </div>
    </div>
  );
};
