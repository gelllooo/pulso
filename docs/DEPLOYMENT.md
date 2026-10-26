# Configure and deploy PULSO

The app runs locally without Supabase credentials: public reference data, the map UI, device reports and preparedness tools work. Reports stay queued until a user signs in to a configured Supabase project. No live Supabase project, Google OAuth provider or AI credential was available during implementation; those live integrations still need the configuration below.

## 1. Database migration and seed

Create a Supabase project. In its SQL Editor, run these files **in order**:

1. `supabase/migrations/202610270001_pulso.sql` (once).
2. `supabase/seed.sql` (safe to repeat; preserves existing facility records).

Alternatively, with the Supabase CLI installed and authenticated:

```sh
supabase link --project-ref YOUR_PROJECT_REF
supabase db push --include-seed
```

For local Supabase development, Docker and the Supabase CLI are required:

```sh
supabase start
supabase db reset
```

The local `supabase/config.toml` deliberately leaves Google disabled until you supply an OAuth client. Do not run `db reset` against a database containing data you need to preserve.

The seed loads six municipalities and **218 barangays**, using the 10-digit PSGC hierarchy in `src/data/marinduque-reference.json`. The source package is pinned to `@aivangogh/ph-address@2026.2.4`, which identifies its source as the PSA publication dated 30 June 2026. Its MIT license is included in `docs/psgc-LICENSE.txt`. Regenerate the reference and seed from the repository root:

```sh
npm run reference:generate
npm run seed:generate
```

### Facility data requires LGU validation

The 18 initial entries are **candidate planning records**, distributed across all six municipalities. Site names and barangay assignments are provisional. They are not a verified evacuation inventory, and the PSA address reference does not establish facility existence or designation. Exact coordinates, capacity and contact information are `null` because no authoritative inventory was supplied. The UI labels these entries, excludes them from operational map markers, and never presents a fabricated contact number or capacity.

Municipal and provincial officers can use **Facilities & evacuation → Validate site details** to provide an actual name, barangay, surveyed coordinates, validated capacity, public contact, HTTPS source record and operating status. Only validated, geographically valid facilities appear as green map markers. The database RPC checks the officer’s municipality. Obtain confirmation from the responsible MDRRMO/PDRRMO before using the directory for routing or evacuation decisions.

## 2. Browser and server configuration

Create an ignored `.env` in the checkout, preserving any existing values:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_PUBLISHABLE_KEY
```

The legacy public anon key is also supported as `VITE_SUPABASE_ANON_KEY`. A publishable/anon key is intended for browser use; authorization comes from the authenticated session and RLS. **Never put a Supabase `service_role` key, Google client secret or AI key in a `VITE_` variable.** This application does not need a service-role key.

Vite embeds its public configuration at build time. Restart development after editing `.env`; rebuild production before deployment. The Node scripts load `.env` with Node 24’s `--env-file-if-exists` option.

```sh
npm ci
npm run dev
# Production:
npm run build
npm run preview
```

The Node server serves the frontend and same-origin `/api/` routes on port 5173 by default (`PORT` overrides it). In a proxy-managed cloud environment, start with `NODE_USE_ENV_PROXY=1`; preserve the supplied CA trust settings. Never disable TLS verification.

## 3. Google OAuth in the Supabase dashboard

1. In Google Cloud Console, configure the OAuth consent screen and create an OAuth 2.0 **Web application** client.
2. Add `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback` as an **Authorized redirect URI**. Use the exact callback displayed by Supabase if your project uses a custom Auth domain.
3. In Supabase **Authentication → Sign In / Providers → Google**, enable Google and enter the Google client ID and client secret. Store the secret there, never in the frontend.
4. In Supabase **Authentication → URL Configuration**, set **Site URL** to the production HTTPS origin and add the exact application origins you use to **Redirect URLs**. For local development, allow `http://localhost:5173` and/or `http://127.0.0.1:5173`.
5. Use **Sign in with Google** in PULSO. The signup trigger creates a `resident_guest` profile and ignores any role or municipality supplied in user metadata.
6. Confirm sign-in, sign-out, a report submission, a network interruption and reconnection against your actual project. The outbox must only empty after a server acknowledgment. Local PostgreSQL and contract tests do not substitute for this live acceptance check.

### Bootstrap the first administrator

After the intended administrator has signed in once, run this through the trusted SQL Editor. Replace the email with the intended account; inspect the matching row first.

```sql
select id, email from auth.users where email = 'ADMIN_EMAIL';
update public.profiles
set role = 'administrator', municipality = null
where id = (select id from auth.users where email = 'ADMIN_EMAIL');
```

Administrators then use **Dashboard** to assign exactly one of these four roles:

| Role                 | Access                                                                                                                                                                                   |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `resident_guest`     | Public verified incident summaries, official advisories and facilities; submit reports; read own private report data. Signed-out guests can save device drafts and sign in to send them. |
| `municipal_officer`  | Review, verify, manage and request sorting assistance only for the assigned municipality.                                                                                                |
| `provincial_officer` | Review, verify, manage and request sorting assistance across Marinduque.                                                                                                                 |
| `administrator`      | Manage profile roles/scopes and system notices. Does not automatically inherit officer access to reports.                                                                                |

The database prevents removal of the last administrator. The UI does not permit changing your own role. Municipal scope is mandatory only for municipal officers. Role changes are checked by database functions on every operation; another open browser may need a refresh before its navigation reflects a newly assigned role.

## 4. Official sources and manual advisories

PAGASA and NDRRMC have source links in the Advisory Board. No supported public RSS endpoint for either agency was identified in the repository. Rather than invent a feed URL, PULSO provides a chronological `official_advisories` schema and a source-attributed posting form for authorized officers. It validates HTTPS links against the selected agency’s actual domain, enforces municipality scope in RLS, and requires original issuance/expiry information and human confirmation.

The existing Node utility fetches and parses the PHIVOLCS public RSS feed through `/api/official/phivolcs/news`, with bounded retries, timeout, cache age and stale indicators. The UI displays it as **agency news**, separate from the official-advisory list and community reports. General news entries are never automatically promoted into warnings. The existing supplemental weather and geocoding utilities remain available on their documented same-origin API routes. Review upstream provider terms for the intended deployment.

## 5. Optional AI sorting service

Set this on the **Node server only**, in deployment secrets or the ignored local `.env`:

```dotenv
AI_API_KEY=YOUR_SERVER_SIDE_PROVIDER_KEY
AI_MODEL=gpt-4.1-mini
```

The fixed provider endpoint is `https://api.openai.com/v1/chat/completions`. `OPENAI_API_KEY` is supported as a server-side alternative. The app requires no AI key for human review. Do not expose keys in browser configuration, committed files or logs.

`POST /api/ai/sort` requires a Bearer Supabase access token and an existing report UUID. The server verifies the session with Supabase, loads the current profile, checks the municipality, and queries the report using the caller’s JWT and RLS. It sends only the municipality and description to the AI provider, not contact-table or review-table data. Descriptions may still contain personal information entered by the reporter; assess provider/data-processing arrangements before enabling this feature. The UI informs officers that text is sent to the configured provider.

Output accepts only a category, queue priority and short rationale, marked **AI Suggestion — Review Required**. Invalid output is rejected. Sorting is a view preference. The endpoint makes no database writes: it cannot verify reports, change urgency/status, issue warnings or edit advisories. A bounded per-process rate limit and request timeout apply; use a shared rate limit if scaling to multiple server instances.

## 6. PWA deployment and offline behavior

Deploy the complete Node app on **HTTPS**, not only `dist/`, if you need same-origin API utilities and AI sorting. The Vite PWA plugin generates the manifest, standard/maskable PNG icons and Workbox service worker. Fonts, CSS, Leaflet styling, JavaScript and app-shell assets are served locally and precached. API/Supabase responses and private account data are excluded from service-worker caching.

Android: use **Install app / Add to Home screen**. iOS: open in Safari, choose **Share → Add to Home Screen**. Load the production app online once before testing an offline reload. Development mode intentionally does not register a new service worker. Reports persist in Dexie; online events and a 45-second retry interval synchronize eligible account reports, with server-side idempotency. Signing out hides that account’s local report cache; it does not delete its queued reports. Unclaimed guest drafts are device-local until the next account signs in and claims them for delivery. Avoid using shared devices for sensitive reports; clearing browser storage removes unsent data.

Offline map tiles are not bundled or bulk-downloaded. The map and saved report list remain usable, while basemap imagery may be unavailable. Esri imagery is not live. Attribution is shown, and provider usage limits/terms still apply. Site markers require validated data.

## 7. Network destinations

Allow the project’s exact Supabase hostname, `api.openai.com` if AI is enabled, `www.phivolcs.dost.gov.ph`, `server.arcgisonline.com` and `*.tile.openstreetmap.org`. The optional geocoding/weather utilities use `nominatim.openstreetmap.org` and `api.open-meteo.com`. Google sign-in also requires the user’s browser to reach Google and the project’s Supabase Auth endpoint. Fonts and Leaflet CSS no longer depend on third-party CDNs.

Cloud draft changes must be reviewed/saved and published through environment settings; saving a draft does not apply network policy. Existing live network denials are a configuration limitation, not evidence that OAuth credentials are missing.

## 8. Validation

```sh
npm run typecheck
npm test
npm run build
# First install a Playwright Chromium browser locally, if needed:
npx playwright install chromium
npm run test:browser
# In the supplied cloud machine, reuse the installed Chromium instead:
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:browser
```

The PostgreSQL tests execute the migration, seed, RLS policies and RPCs in PGlite, including role escalation attempts, cross-municipality access, private-note/contact visibility, idempotency and public projections. Sync tests use IndexedDB-compatible storage and simulated transport failures to check acknowledgment and account boundaries. AI tests simulate provider/Auth responses; they do not call a live model. Browser tests exercise the actual production server, desktop/tablet/mobile navigation, GPS denial fallback, all barangay dropdowns, an offline report, offline PWA reload, map controls and unauthenticated API rejection.

Live Google OAuth, Supabase PostgREST/synchronization, AI provider responses, current agency feeds and external imagery must be rechecked after credentials and egress access are configured. No remote database was migrated or production application deployed by this implementation task.
