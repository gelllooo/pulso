import { SystemNotice } from "./SystemNotice";
import { useState } from "react";
import {
  Building2,
  MapPin,
  Phone,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { BARANGAYS, MUNICIPALITIES } from "../data/marinduqueData";
import type { Facility, Municipality } from "../types";
import { canManageReports } from "../lib/permissions";
import { supabase } from "../lib/supabase";
import { Button } from "./ui/button";
export function FacilityDirectory() {
  const app = useApp();
  const [query, setQuery] = useState(""),
    [editing, setEditing] = useState<Facility | null>(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const items = app.facilities.filter(
    (f) =>
      (app.selectedMunicipalityFilter === "All" ||
        f.municipality === app.selectedMunicipalityFilter) &&
      `${f.name} ${f.barangay}`.toLowerCase().includes(query.toLowerCase()),
  );
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing || !supabase) return;
    setBusy(true);
    setMessage("");
    try {
      const data = new FormData(e.currentTarget);
      const payload = {
        ...editing,
        name: String(data.get("name")),
        barangay: String(data.get("barangay")),
        lat: Number(data.get("lat")),
        lng: Number(data.get("lng")),
        capacity: Number(data.get("capacity")),
        currentOccupancy: Number(data.get("occupancy")),
        contactNumber: String(data.get("contact")),
        sourceUrl: String(data.get("source")),
        source: "LGU-validated record",
        verificationStatus: "verified",
        coordinateAccuracy: "surveyed",
        operatingStatus: String(data.get("status")),
        accessibilityNotes: String(data.get("notes")),
        lastVerified: new Date().toISOString(),
      };
      const { error } = await supabase.rpc("publish_facility", {
        p_facility: payload,
      });
      if (error) throw error;
      await app.refreshData();
      setEditing(null);
      setMessage("Validated facility published.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Facility could not be published.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page-shell">
      <p className="eyebrow">Community resources</p>
      <SystemNotice name="facility_notice" />
      <h1 className="page-title">Facilities & evacuation sites</h1>
      <p className="page-description">
        A directory for all six municipalities. Always confirm opening, capacity
        and the route with your LGU.
      </p>
      <div
        role="note"
        className="my-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"
      >
        The initial inventory contains 18 candidate planning entries. These are
        not confirmed evacuation destinations. Exact coordinates, barangay
        assignments, capacity and public contacts require LGU validation.
        Unknown values are left blank rather than invented.
      </div>
      <div className="my-5 flex flex-wrap gap-3">
        <label className="field-label flex-1">
          Search facilities
          <input
            className="input"
            placeholder="Search name or barangay"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
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
            <option value="All">All municipalities</option>
            {MUNICIPALITIES.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
      </div>
      {message && (
        <p role="status" className="my-4 rounded-lg bg-marine-50 p-3 text-sm">
          {message}
        </p>
      )}
      {editing && (
        <form
          onSubmit={save}
          className="mb-6 rounded-xl border border-marine-100 bg-white p-5"
        >
          <h2 className="font-display text-xl text-marine-900">
            Validate facility · {editing.municipality}
          </h2>
          <p className="mt-2 text-xs leading-6 text-charcoal-500">
            Publish only after verifying this site with the LGU. Coordinates
            must identify the actual site.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="field-label">
              Validated facility name
              <input
                className="input"
                name="name"
                required
                maxLength={200}
                defaultValue={editing.name.replace(" — candidate", "")}
              />
            </label>
            <label className="field-label">
              Actual barangay
              <select
                className="input"
                name="barangay"
                defaultValue={editing.barangay}
              >
                {BARANGAYS.filter(
                  (b) => b.municipality === editing.municipality,
                ).map((b) => (
                  <option key={b.psgcCode}>{b.name}</option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Exact latitude
              <input
                className="input"
                name="lat"
                required
                type="number"
                step="any"
                min="13.17"
                max="13.64"
                defaultValue={editing.lat ?? ""}
              />
            </label>
            <label className="field-label">
              Exact longitude
              <input
                className="input"
                name="lng"
                required
                type="number"
                step="any"
                min="121.78"
                max="122.18"
                defaultValue={editing.lng ?? ""}
              />
            </label>
            <label className="field-label">
              Validated capacity
              <input
                className="input"
                name="capacity"
                required
                type="number"
                min="0"
                defaultValue={editing.capacity ?? ""}
              />
            </label>
            <label className="field-label">
              Current occupancy
              <input
                className="input"
                name="occupancy"
                required
                type="number"
                min="0"
                defaultValue={editing.currentOccupancy}
              />
            </label>
            <label className="field-label">
              Public facility contact
              <input
                className="input"
                name="contact"
                required
                maxLength={100}
                minLength={5}
                defaultValue={editing.contactNumber ?? ""}
              />
            </label>
            <label className="field-label">
              HTTPS source record
              <input
                className="input"
                name="source"
                required
                type="url"
                pattern="https://.*"
                defaultValue=""
              />
            </label>
            <label className="field-label">
              Operating status
              <select
                className="input"
                name="status"
                defaultValue={editing.operatingStatus}
              >
                {[
                  "operational",
                  "at_capacity",
                  "standby",
                  "damaged",
                  "closed",
                ].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Accessibility notes
              <input className="input" name="notes" required maxLength={1000} />
            </label>
          </div>
          <label className="my-4 flex items-start gap-2 text-sm">
            <input type="checkbox" required className="mt-1" />I have confirmed
            these details and the site’s designation with the responsible LGU.
          </label>
          <div className="flex gap-3">
            <Button type="submit" disabled={busy}>
              {busy ? "Publishing…" : "Publish validated facility"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditing(null)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {items.map((f) => (
          <article
            key={f.id}
            className="rounded-xl border border-sand-200 bg-white p-5"
          >
            <div className="flex items-center justify-between">
              <Building2
                className={`h-6 w-6 ${f.verificationStatus === "verified" ? "text-forest-600" : "text-charcoal-500"}`}
              />
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${f.verificationStatus === "verified" ? "bg-forest-50 text-forest-700" : "bg-amber-50 text-amber-800"}`}
              >
                {f.verificationStatus === "verified"
                  ? "LGU validated"
                  : "Needs validation"}
              </span>
            </div>
            <h2 className="mt-5 font-display text-lg font-semibold text-marine-900">
              {f.name}
            </h2>
            <p className="mt-2 flex items-center gap-1 text-xs text-charcoal-500">
              <MapPin className="h-3 w-3" />
              {f.barangay}, {f.municipality}
              {f.verificationStatus !== "verified"
                ? " · assignment provisional"
                : ""}
            </p>
            <dl className="my-4 grid grid-cols-2 gap-3 border-y border-sand-200 py-4 text-xs">
              <div>
                <dt className="text-charcoal-500">Capacity</dt>
                <dd className="mt-1 font-semibold">
                  {f.capacity === null
                    ? "Not validated"
                    : `${f.capacity} people`}
                </dd>
              </div>
              <div>
                <dt className="text-charcoal-500">Coordinates</dt>
                <dd className="mt-1 font-semibold">
                  {f.lat === null || f.lng === null
                    ? "Not validated"
                    : `${f.lat.toFixed(5)}, ${f.lng.toFixed(5)}`}
                </dd>
              </div>
            </dl>
            <p className="text-xs leading-6 text-charcoal-600">
              {f.accessibilityNotes}
            </p>
            <p className="mt-3 flex items-center gap-2 text-xs">
              <Phone className="h-3 w-3" />
              {f.contactNumber ? (
                <a
                  className="underline"
                  href={`tel:${f.contactNumber.replace(/[^+\d]/g, "")}`}
                >
                  {f.contactNumber}
                </a>
              ) : (
                "Contact not validated"
              )}
            </p>
            {f.verificationStatus === "verified" && (
              <p className="mt-3 text-xs text-charcoal-500">
                Last validated:{" "}
                {new Date(f.lastVerified).toLocaleString("en-PH")}
              </p>
            )}
            {f.sourceUrl && (
              <a
                href={f.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1 text-xs text-marine-700 underline"
              >
                {f.verificationStatus === "verified"
                  ? "Source record"
                  : "PSGC reference for area names"}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {canManageReports(app.currentUser, f.municipality) && (
              <Button
                className="mt-4 w-full"
                variant="outline"
                onClick={() => {
                  setEditing(f);
                  setMessage("");
                }}
              >
                <ShieldCheck className="h-4 w-4" />
                Validate site details
              </Button>
            )}
          </article>
        ))}
      </div>
      {items.length === 0 && (
        <p className="mt-5 text-sm text-charcoal-500">
          No matching facilities.
        </p>
      )}
    </div>
  );
}
