# PULSO 🏝️

**Disaster Preparedness, Resilience, and Livelihood Intelligence System for Marinduque**

PULSO is an offline-first, community-centered disaster preparedness platform designed for Marinduque, Philippines. It helps barangay reporters, community volunteers, farmers, fisherfolk, and local officials collect, verify, visualize, and coordinate localized information before, during, and after disasters.

## Core Workflow

**Observe → Report → Store Offline → Synchronize → Verify → Visualize → Respond**

## Features

- 📊 **Dashboard Overview** — Real-time summary of active incidents, pending reports, and alert levels across municipalities
- 📝 **Incident Reporting** — Offline-capable structured report submission with severity, category, and geolocation
- 🗺️ **Risk Map** — Leaflet/OpenStreetMap map constrained to the Marinduque province boundary, with municipality-level incidents, facilities, and hazard overlays
- ✅ **Verification Dashboard** — Multi-stage report verification workflow (Pending → Verified / Flagged / Rejected)
- 🏥 **Facility Directory** — Searchable directory of evacuation centers, hospitals, fire stations, and emergency contacts
- 📢 **Advisory Board** — Official weather and disaster advisory display with severity-coded alerts
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
| Map | Google Maps Hybrid 3D (when configured) with Leaflet/OpenStreetMap fallback |

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

# Preview production build
npm run preview
```

### Google Maps setup

The map uses Google Maps Hybrid imagery with 3D tilt when
`VITE_GOOGLE_MAPS_API_KEY` is configured. Copy `.env.example` to `.env.local`,
set a browser-restricted Google Maps Platform key, and enable the Maps JavaScript
API. Restriction to the Marinduque boundary remains enforced by the application.
Without a key, the app uses the existing Leaflet/OpenStreetMap map fallback.

PULSO intentionally uses this hybrid approach: Leaflet/OpenStreetMap remains the
offline-first default, while Google Maps is an optional online enhancement for
satellite imagery and 3D viewing. Google Maps is loaded with Google's official
[`@googlemaps/js-api-loader`](https://github.com/googlemaps/js-api-loader).

Required Google Cloud setup:

1. Create or select a project in [Google Cloud Console](https://console.cloud.google.com/).
2. Attach a billing account to the project. Google Maps Platform requires billing
   even when usage stays within the available monthly credit.
3. Enable **Maps JavaScript API** under **APIs & Services → Library**.
4. Create an API key under **APIs & Services → Credentials**.
5. Restrict the key to **Websites (HTTP referrers)** and add:
   `http://localhost:5173/*`, your deployed HTTPS origin, and any preview origin.
6. Restrict the key to **Maps JavaScript API** under API restrictions.
7. Copy `.env.example` to `.env.local` and replace the placeholder:

   ```env
   VITE_GOOGLE_MAPS_API_KEY=your_browser_restricted_google_maps_key
   ```

8. Restart Vite after changing `.env.local`. Vite only loads environment
   variables when the development server starts.

This implementation only needs the Maps JavaScript API. Places, Geocoding,
Routes, Maps Embed, and Street View APIs are not required for the current
satellite/3D map experience. Never commit `.env.local` or expose an
unrestricted key.

## Offline-First Architecture

PULSO uses an **outbox pattern** for offline resilience:

1. All data writes go to local IndexedDB first
2. Reports are queued in an outbox when offline
3. When connectivity returns, queued items sync automatically
4. Conflict resolution uses last-write-wins with audit logging

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

The map boundary is stored in
[`public/geojson/marinduque-province.geojson`](public/geojson/marinduque-province.geojson).
It contains the Marinduque municipal boundary features used to fit and constrain the map
and to exclude coordinates outside the province from map layers.

## License

MIT
