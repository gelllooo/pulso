import { useMemo, useState } from "react";
import { MapContainer, Marker, Popup } from "react-leaflet";
import {
  MapPin,
  Layers,
  LocateFixed,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { MUNICIPALITIES, CATEGORIES } from "../data/marinduqueData";
import type { Municipality } from "../types";
import { MARINDUQUE_CENTER, MARINDUQUE_BOUNDS, inMarinduque } from "../lib/geo";
import { Basemap, MapLimits, pinIcon } from "./MapParts";
import { Button } from "./ui/button";
export function EnhancedRiskMap() {
  const app = useApp();
  const [satellite, setSatellite] = useState(true),
    [legend, setLegend] = useState(true),
    [category, setCategory] = useState("All");
  const reports = useMemo(
    () =>
      app.reports.filter(
        (r) =>
          (app.selectedMunicipalityFilter === "All" ||
            r.municipality === app.selectedMunicipalityFilter) &&
          (category === "All" || r.category === category) &&
          inMarinduque(r.lat, r.lng),
      ),
    [app.reports, app.selectedMunicipalityFilter, category],
  );
  const facilities = app.facilities.filter(
    (f) =>
      f.verificationStatus === "verified" &&
      f.lat !== null &&
      f.lng !== null &&
      inMarinduque(f.lat, f.lng) &&
      (app.selectedMunicipalityFilter === "All" ||
        f.municipality === app.selectedMunicipalityFilter),
  );
  return (
    <div className="page-shell">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Local knowledge, in context</p>
          <h1 className="page-title">Marinduque community map</h1>
          <p className="page-description">
            Verified public incidents, your reports and validated facilities.
            Imagery is not live.
          </p>
        </div>
        <Button variant="outline" onClick={() => setSatellite(!satellite)}>
          <Layers className="h-4 w-4" />
          {satellite ? "Switch to street map" : "Switch to satellite"}
        </Button>
      </div>
      <div className="mb-4 flex flex-wrap gap-3 rounded-xl border border-sand-200 bg-white p-4">
        <label className="field-label">
          Municipality
          <select
            className="input"
            value={app.selectedMunicipalityFilter}
            onChange={(e) =>
              app.setSelectedMunicipalityFilter(
                e.target.value as Municipality | "All",
              )
            }
          >
            <option value="All">All six municipalities</option>
            {MUNICIPALITIES.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
        <label className="field-label">
          Incident category
          <select
            className="input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="All">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <p className="mt-auto pb-2 text-xs text-charcoal-500">
          {reports.length} reports · {facilities.length} validated facilities
          mapped
        </p>
      </div>
      <div className="relative isolate z-0 h-[min(65vh,620px)] min-h-[380px] overflow-hidden rounded-xl border border-sand-300 bg-marine-100">
        <MapContainer
          center={MARINDUQUE_CENTER}
          zoom={11}
          minZoom={10}
          maxZoom={19}
          maxBounds={MARINDUQUE_BOUNDS}
          maxBoundsViscosity={1}
          className="h-full w-full"
          aria-label="Map restricted to Marinduque"
        >
          <Basemap satellite={satellite} />
          <MapLimits />
          {reports.map((r) => (
            <Marker
              key={r.id}
              position={[r.lat, r.lng]}
              icon={pinIcon(
                ["urgent", "immediate_danger"].includes(r.urgency)
                  ? "#d04328"
                  : "#16385a",
                r.category === "fire"
                  ? "♨"
                  : r.category === "flooding"
                    ? "≈"
                    : r.category === "blocked_road"
                      ? "!"
                      : "•",
              )}
              title={r.referenceNumber}
            >
              <Popup>
                <div className="max-w-xs">
                  <strong>{r.referenceNumber}</strong>
                  <p className="mt-2 font-semibold capitalize">
                    {r.category.replaceAll("_", " ")}
                  </p>
                  <p>
                    {r.barangay}, {r.municipality}
                  </p>
                  <p className="my-2 whitespace-pre-wrap">{r.description}</p>
                  <p className="text-xs">
                    {r.status === "pending_sync"
                      ? "Saved on device — waiting to sync"
                      : r.status.replaceAll("_", " ")}{" "}
                    · {r.urgency.replaceAll("_", " ")}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
          {facilities.map((f) => (
            <Marker
              key={f.id}
              position={[f.lat!, f.lng!]}
              icon={pinIcon("#2a724f", "E")}
              title={f.name}
            >
              <Popup>
                <strong>{f.name}</strong>
                <p>
                  {f.barangay}, {f.municipality}
                </p>
                <p>
                  Capacity: {f.capacity ?? "Unknown"} · Occupancy:{" "}
                  {f.currentOccupancy}
                </p>
                <p>{f.contactNumber || "Contact not validated"}</p>
                <p>Confirm current availability before travelling.</p>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        <div className="absolute bottom-7 left-3 z-[500] w-56 rounded-xl border border-sand-200 bg-white/95 p-3 text-xs shadow-lg">
          <button
            className="flex w-full items-center justify-between font-semibold text-marine-900"
            aria-expanded={legend}
            onClick={() => setLegend(!legend)}
          >
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Map legend
            </span>
            {legend ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </button>
          {legend && (
            <div className="mt-3 space-y-2">
              <p>
                <span className="legend-dot bg-coral-600" />
                Urgent fire, flood or incident
              </p>
              <p>
                <span className="legend-dot bg-marine-700" />
                Other incident · icon indicates type
              </p>
              <p>
                <span className="legend-dot bg-forest-600" />
                Validated evacuation / facility
              </p>
              <p className="border-t border-sand-200 pt-2 text-[10px] leading-4 text-charcoal-500">
                Community reports require human review. Map markers do not issue
                warnings.
              </p>
            </div>
          )}
        </div>
      </div>
      <p className="my-3 text-xs leading-6 text-charcoal-500">
        The map stays within Marinduque’s bounds. Satellite imagery and street
        tiles require internet. Candidate facilities without validated
        coordinates remain in the directory and are not plotted.
      </p>
      <section className="mt-6 rounded-xl border border-sand-200 bg-white">
        <h2 className="border-b border-sand-200 p-4 font-semibold text-marine-900">
          Visible incident reports
        </h2>
        {reports.length === 0 ? (
          <p className="p-6 text-sm text-charcoal-500">
            No reports match these filters. You can save an incident report even
            while offline.
          </p>
        ) : (
          <ul className="divide-y divide-sand-200">
            {reports.map((r) => (
              <li key={r.id} className="p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-500">
                  {r.referenceNumber} · {r.municipality}
                </span>
                <p className="mt-1 text-sm font-semibold capitalize text-marine-900">
                  {r.category.replaceAll("_", " ")}
                </p>
                <p className="mt-1 text-sm text-charcoal-600">
                  {r.description}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
