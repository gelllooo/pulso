# PULSO 🏝️

**Disaster Preparedness, Resilience, and Livelihood Intelligence System for Marinduque**

PULSO is an offline-first, community-centered disaster preparedness platform designed for Marinduque, Philippines. It helps barangay reporters, community volunteers, farmers, fisherfolk, and local officials collect, verify, visualize, and coordinate localized information before, during, and after disasters.

## Core Workflow

**Observe → Report → Store Offline → Synchronize → Verify → Visualize → Respond**

## Features

- 📊 **Dashboard Overview** — Real-time summary of active incidents, pending reports, and alert levels across municipalities
- 📝 **Incident Reporting** — Offline-capable structured report submission with severity, category, and geolocation
- 🗺️ **Risk Map** — Interactive Marinduque map with satellite or street basemaps, community reports, facilities, and indicative hazard overlays
- ✅ **Verification Dashboard** — Multi-stage report verification workflow (Pending → Verified / Flagged / Rejected)
- 🏥 **Facility Directory** — Searchable directory of evacuation centers, hospitals, fire stations, and emergency contacts
- 📢 **Advisory Board** — Official agency links, PHIVOLCS agency news, and separately labeled model-weather context
- 🌾 **Livelihood Module** — Agricultural and fisheries impact tracking with seasonal calendars and crop/catch monitoring
- 📋 **SitRep Generator** — Automated Situation Report generation from verified data with export capability
- 📜 **Audit Trail** — Immutable activity log for accountability and transparency

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS |
| Offline Storage | IndexedDB via Dexie.js |
| PWA | Service Worker + Web App Manifest |
| Map | Custom SVG (Marinduque municipalities) |

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Install & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run the production server after building
npm run preview
```

## Official Agency News

The app retrieves the publicly published PHIVOLCS RSS feed (`https://www.phivolcs.dost.gov.ph/feed/`) through the same-origin Node server endpoint `GET /api/official/phivolcs/news`. The Advisory Board requests it on load and every five minutes, prevents overlapping refreshes, and times out its own request after 30 seconds. The server caches successful responses for five minutes, retries upstream failures at most twice after the initial attempt (each attempt times out after eight seconds), and serves the last successful copy with a stale indicator if PHIVOLCS is temporarily unavailable. The Advisory Board labels these entries as general PHIVOLCS agency news, not warnings or advisories, and links each item to its original PHIVOLCS page. No explicit RSS reuse terms were found during this review; attribution and limited display do not constitute legal clearance for every deployment or reuse.

PAGASA portal links are provided for checking current warnings. The PAGASA PublicAlert landing page says “Google CAP Feeds by PAGASA-DOST” but does not publish a feed URL or integration documentation. No supported PAGASA machine-readable advisory feed was identified/configured, so PULSO does not scrape its portals or label sample PAGASA records as current.

The Advisory Board also retrieves current modeled weather values for central Marinduque from the documented Open-Meteo Forecast API through `GET /api/supplemental/weather/marinduque`. It refreshes every 15 minutes, prevents overlapping requests, and applies the same bounded upstream retries, timeouts, cache, and stale-response behavior as the PHIVOLCS feed. This is supplemental model output, not PAGASA observations, a government product, or an official warning. The display provides the required Open-Meteo and CC BY 4.0 attribution. Open-Meteo's free API is limited to non-commercial use and published request limits; commercial deployments must obtain the applicable paid license. Review [Open-Meteo Terms of Use](https://open-meteo.com/en/terms) and [licence conditions](https://open-meteo.com/en/licence) before deployment.

## Backend Data Proxy

The browser calls only the same-origin `/api/official/phivolcs/news` and `/api/supplemental/weather/marinduque` routes. The Node server owns the fixed upstream URLs, performs validation, retries, timeouts, and caching, and does not accept a caller-supplied URL; this addresses browser CORS without creating an open proxy. Neither current upstream requires an API credential. If a future documented integration requires one, keep it in a server-side environment variable or deployment secret, never in frontend code, Vite-exposed variables, or committed files. The service worker deliberately bypasses `/api/` routes so cached application-shell responses cannot mask proxy freshness or errors.

## Offline Storage and Synchronization Status

PULSO stores reports in IndexedDB and keeps unsent reports in a local outbox. The repository does not include a report-submission backend, so reports are **not transmitted to a server** and are never marked synchronized based only on browser connectivity. The sync control reports this limitation rather than simulating server acknowledgment. Connect a report API before relying on reports being visible to responders on other devices.

Service-worker caching supports offline app loading after the application shell and build assets have been precached. It does not replace server-side report delivery.

## Map Imagery and Freshness

The interactive map defaults to Esri World Imagery satellite/aerial tiles and offers OpenStreetMap streets as an alternate basemap. The map identifies the imagery source and attribution. Satellite imagery is not live; coverage and imagery dates vary by location and provider. Report markers reflect locally stored app data and update when that data changes. Because reports are not transmitted to a shared backend, markers are not a real-time view of reports from other devices. Offline map tiles are not guaranteed.

The map address search is explicitly user-triggered (no autocomplete), limited to Marinduque, and proxied through `GET /api/map/search`. It caches results in memory for one hour, limits successful upstream lookups to at most one per second per server process, and times out requests after eight seconds. The geocoder can be switched without a code change using the server-side `NOMINATIM_SEARCH_URL` environment variable, which must be an HTTPS URL. Search terms are sent to the configured geocoder; don't submit private or sensitive information. OpenStreetMap attribution is shown in the map UI. For production with multiple server instances or higher search volume, use shared caching and a centrally shared rate limit, or a geocoding provider whose terms suit the deployment.

## Design Principles

- **Offline-first**: Works without internet; syncs when connected
- **Community-centered**: Built for barangay-level reporters and responders
- **Complementary**: Enhances (not replaces) PAGASA, PHIVOLCS, NDRRMC, and LGU systems
- **Accountable**: Full audit trail for all actions and data changes
- **Accessible**: Designed for low-bandwidth, low-spec device environments

## Geographic Scope

Initial prototype focuses on Marinduque province with its six municipalities:
- Boac (capital)
- Mogpog
- Santa Cruz
- Torrijos
- Buenavista
- Gasan

## License

MIT
