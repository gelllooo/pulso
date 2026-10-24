# PULSO 🏝️

**Disaster Preparedness, Resilience, and Livelihood Intelligence System for Marinduque**

PULSO is an offline-first, community-centered disaster preparedness platform designed for Marinduque, Philippines. It helps barangay reporters, community volunteers, farmers, fisherfolk, and local officials collect, verify, visualize, and coordinate localized information before, during, and after disasters.

## Core Workflow

**Observe → Report → Store Offline → Synchronize → Verify → Visualize → Respond**

## Features

- 📊 **Dashboard Overview** — Real-time summary of active incidents, pending reports, and alert levels across municipalities
- 📝 **Incident Reporting** — Offline-capable structured report submission with severity, category, and geolocation
- 🗺️ **Risk Map** — Interactive SVG map of Marinduque with municipality-level risk visualization and hazard overlays
- ✅ **Verification Dashboard** — Multi-stage report verification workflow (Pending → Verified / Flagged / Rejected)
- 🏥 **Facility Directory** — Searchable directory of evacuation centers, hospitals, fire stations, and emergency contacts
- 📢 **Advisory Board** — Official weather and disaster advisory display with severity-coded alerts
- 🌾 **Livelihood Module** — Agricultural and fisheries impact tracking with seasonal calendars and crop/catch monitoring
- 📋 **SitRep Generator** — Automated Situation Report generation from verified data with export capability
- 📜 **Audit Trail** — Immutable activity log for accountability and transparency

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript |
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

# Preview production build
npm run preview
```

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

## License

MIT
