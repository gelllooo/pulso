# PULSO · Marinduque

An offline-first community preparedness and livelihood coordination app for Marinduque. PULSO complements PAGASA, PHIVOLCS, NDRRMC and local government; it does not replace official warnings or emergency response.

## Develop

Node.js 24+ and npm 10+ are required.

```sh
npm ci
npm run dev
```

For cloud proxy routing, use `NODE_USE_ENV_PROXY=1 npm run dev`. To connect the backend, copy the names from `.env.example` into an ignored `.env` and configure a Supabase project. Local device reporting works without credentials; server delivery requires sign-in and a configured project.

```sh
npm run typecheck
npm test
npm run build
npm run preview
```

See **[deployment, database, seeding and Google OAuth setup](docs/DEPLOYMENT.md)** for the complete configuration and live acceptance checks.

## What is implemented

- Persistent marine-blue sidebar on desktop/tablet, accessible mobile navigation drawer and separate emergency-advisory banner.
- React Leaflet map bounded to Marinduque, with Esri satellite/street basemaps, incident/facility markers, original attribution and a collapsible legend.
- Complete offline address selection for six municipalities and **218 PSGC barangays**, real device GPS and manual incident pin placement.
- Supabase Google OAuth integration and four database-enforced roles: `resident_guest`, `municipal_officer`, `provincial_officer`, `administrator`.
- PostgreSQL migrations, RLS policies, a sanitized public incident projection, separate contacts/review notes, scoped officer actions and append-only server audit events.
- Dexie outbox, server-acknowledged idempotent submissions, online-event synchronization, bounded retries and visible delivery status.
- Source-attributed official-advisory publication by authorized officers, chronological display, and separate PHIVOLCS agency news through the same-origin Node utility.
- Installable PWA with Workbox app-shell caching, bundled fonts and Leaflet styles, PNG icons and production offline reload.
- Optional authenticated, server-side AI category/priority suggestions. **AI Suggestion — Review Required** output cannot verify reports, issue warnings or modify advisories.
- Role-specific dashboards, administrative role/scope assignment, public system notices, preparedness checklist and reviewed situation-report exports.

## Data boundaries

The initial facility seed contains **18 unverified candidate planning entries**, not a confirmed evacuation inventory. Coordinates, usable capacity and contacts are unknown and intentionally left `null`. Municipal/provincial officers must validate actual details before a facility appears on the operational map. No sample incidents, active warnings, fabricated phone numbers or claimed current conditions are seeded.

The map is restricted to a geographic bounding rectangle covering Marinduque, including its outlying islands; the rectangle also contains surrounding water. Imagery requires internet and is not live. Offline reports remain on the device until an authenticated Supabase acknowledgment; signing out hides account data. No API/service-role credential belongs in a `VITE_` variable.

## Repository guide

| Area                                                  | Location                                                                   |
| ----------------------------------------------------- | -------------------------------------------------------------------------- |
| App shell and navigation                              | `src/App.tsx`, `src/components/Header.tsx`, `src/components/ui/`           |
| Auth, private/public data and offline sync            | `src/context/AppContext.tsx`, `src/db.ts`, `src/lib/`                      |
| Map, reporting, facilities, advisories and dashboards | `src/components/`                                                          |
| PSGC and facility planning inventory                  | `src/data/`, `scripts/generate-reference.mjs`, `scripts/generate-seed.mjs` |
| Database policies, RPCs and seed                      | `supabase/migrations/202610270001_pulso.sql`, `supabase/seed.sql`          |
| Same-origin data/AI utilities                         | `server.mjs`, `server/ai.mjs`                                              |
| PWA                                                   | `vite.config.ts`, `public/icons/`                                          |
| Automated checks                                      | `tests/`, `e2e/`                                                           |

The client uses React 19, Vite, TypeScript, Tailwind, shadcn-style Radix components, React Leaflet, Dexie and Supabase. The backend utility uses Node native HTTP/fetch. Database tests run actual PostgreSQL via PGlite; browser checks use Playwright.
