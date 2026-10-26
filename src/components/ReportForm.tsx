import { useState } from "react";
import { MapContainer } from "react-leaflet";
import { LocateFixed, Send, CloudUpload, CheckCircle2 } from "lucide-react";
import { useApp } from "../context/AppContext";
import { BARANGAYS, MUNICIPALITIES, CATEGORIES } from "../data/marinduqueData";
import type { Municipality, ReportCategory, UrgencyLevel } from "../types";
import { MARINDUQUE_BOUNDS, MARINDUQUE_CENTER, inMarinduque } from "../lib/geo";
import { Basemap, LocationPicker, MapLimits } from "./MapParts";
import { Button } from "./ui/button";
export function ReportForm() {
  const app = useApp();
  const [municipality, setMunicipality] = useState<Municipality>("Boac");
  const bgys = BARANGAYS.filter((b) => b.municipality === municipality);
  const [barangayCode, setBarangay] = useState(bgys[0].psgcCode),
    [category, setCategory] = useState<ReportCategory>("flooding"),
    [description, setDescription] = useState(""),
    [landmark, setLandmark] = useState("");
  const [urgency, setUrgency] = useState<UrgencyLevel>("elevated"),
    [position, setPosition] = useState<[number, number] | null>(null),
    [locationSource, setLocationSource] = useState<"gps" | "manual">("manual"),
    [locationMessage, setLocationMessage] = useState(
      "Choose a pin on the map, enter coordinates, or use your device GPS.",
    );
  const [latText, setLatText] = useState(""),
    [lngText, setLngText] = useState("");
  const [anonymous, setAnonymous] = useState(true),
    [name, setName] = useState(""),
    [contact, setContact] = useState(""),
    [consent, setConsent] = useState(false),
    [busy, setBusy] = useState(false),
    [success, setSuccess] = useState(""),
    [error, setError] = useState("");
  const [crop, setCrop] = useState(""),
    [area, setArea] = useState(""),
    [loss, setLoss] = useState("");
  function updatePin(p: [number, number], source: "manual" | "gps" = "manual") {
    setPosition(p);
    setLatText(p[0].toFixed(6));
    setLngText(p[1].toFixed(6));
    setLocationSource(source);
    setLocationMessage(
      source === "gps"
        ? "Device GPS location captured. Check the pin before submitting."
        : "Manual incident pin selected.",
    );
  }
  function gps() {
    if (!navigator.geolocation) {
      setLocationMessage(
        "GPS is unavailable. Tap the map or enter coordinates instead.",
      );
      return;
    }
    setLocationMessage("Requesting device location…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (!inMarinduque(coords.latitude, coords.longitude)) {
          setLocationMessage(
            "Your device is outside Marinduque. Select the incident location manually.",
          );
          return;
        }
        updatePin([coords.latitude, coords.longitude], "gps");
      },
      () =>
        setLocationMessage(
          "GPS was denied or unavailable. Tap the map or enter coordinates instead.",
        ),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!position) {
      setError("Select the incident pin before saving.");
      return;
    }
    if (!consent) {
      setError("Please accept the privacy notice.");
      return;
    }
    setBusy(true);
    try {
      const now = new Date().toISOString();
      const ref = await app.submitReport({
        category,
        municipality,
        barangay: bgys.find((b) => b.psgcCode === barangayCode)!.name,
        barangayCode,
        description,
        observationTime: now,
        reportedTime: now,
        sitioOrLandmark: landmark,
        lat: position[0],
        lng: position[1],
        locationSource,
        urgency,
        immediateDanger: urgency === "immediate_danger",
        reporterRole: app.currentUser.role,
        reporterName: anonymous ? undefined : name,
        reporterContact: anonymous ? undefined : contact,
        isAnonymous: anonymous,
        livelihoodDetails:
          category === "agriculture_damage"
            ? {
                cropType: crop,
                affectedAreaHa: area ? Number(area) : undefined,
                estimatedValueLossPhp: loss ? Number(loss) : undefined,
              }
            : category === "fisheries_damage"
              ? { estimatedValueLossPhp: loss ? Number(loss) : undefined }
              : undefined,
      });
      setSuccess(ref);
      setDescription("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Report could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  }
  const mine = app.reports.filter(
    (r) =>
      !r.isPublic && (r.ownerUserId === app.currentUser.id || !r.ownerUserId),
  );
  return (
    <div className="page-shell max-w-5xl">
      <p className="eyebrow">Community observations</p>
      <h1 className="page-title">Report an incident</h1>
      <p className="page-description">
        Share what you observed in Marinduque. Reports are reviewed by
        authorized officers. For immediate danger, contact emergency services
        directly.
      </p>
      {success && (
        <div
          role="status"
          className="my-5 rounded-xl border border-forest-100 bg-forest-50 p-5 text-sm text-forest-700"
        >
          <p className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="h-5 w-5" />
            Report saved on this device
          </p>
          <p className="mt-2 font-mono">{success}</p>
          <p className="mt-2">
            Waiting for server acknowledgment.{" "}
            {app.currentUser.id === "guest"
              ? "Sign in with Google when online to send it to your account."
              : "The outbox synchronizes automatically when connected."}
          </p>
        </div>
      )}
      <form
        onSubmit={submit}
        className="mt-7 space-y-7 rounded-xl border border-sand-200 bg-white p-5 sm:p-7"
      >
        <fieldset>
          <legend className="section-label">01 · What happened?</legend>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="field-label">
              Incident category
              <select
                className="input"
                value={category}
                onChange={(e) => setCategory(e.target.value as ReportCategory)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Urgency
              <select
                className="input"
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as UrgencyLevel)}
              >
                <option value="routine">Routine</option>
                <option value="elevated">Elevated concern</option>
                <option value="urgent">Urgent</option>
                <option value="immediate_danger">Immediate danger</option>
              </select>
            </label>
          </div>
          <label className="field-label mt-4">
            Describe what you observed
            <textarea
              required
              minLength={10}
              maxLength={4000}
              rows={4}
              className="input resize-y"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What happened? Who or what is affected? What help is needed?"
            />
          </label>
          {["agriculture_damage", "fisheries_damage"].includes(category) && (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {category === "agriculture_damage" && (
                <>
                  <label className="field-label">
                    Crop (optional)
                    <input
                      className="input"
                      maxLength={100}
                      value={crop}
                      onChange={(e) => setCrop(e.target.value)}
                    />
                  </label>
                  <label className="field-label">
                    Affected hectares (optional)
                    <input
                      className="input"
                      type="number"
                      min="0"
                      max="100000"
                      step="0.01"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                    />
                  </label>
                </>
              )}
              <label className="field-label">
                Estimated loss, PHP (optional)
                <input
                  className="input"
                  type="number"
                  min="0"
                  max="1000000000"
                  value={loss}
                  onChange={(e) => setLoss(e.target.value)}
                />
              </label>
            </div>
          )}
        </fieldset>
        <fieldset className="border-t border-sand-200 pt-6">
          <legend className="section-label">02 · Where is it?</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field-label">
              Municipality
              <select
                className="input"
                value={municipality}
                onChange={(e) => {
                  const m = e.target.value as Municipality;
                  setMunicipality(m);
                  setBarangay(
                    BARANGAYS.find((b) => b.municipality === m)!.psgcCode,
                  );
                }}
              >
                {MUNICIPALITIES.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Barangay
              <select
                className="input"
                value={barangayCode}
                onChange={(e) => setBarangay(e.target.value)}
              >
                {bgys.map((b) => (
                  <option key={b.psgcCode} value={b.psgcCode}>
                    {b.name} · {b.psgcCode}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="field-label mt-4">
            Sitio or landmark (optional)
            <input
              className="input"
              maxLength={250}
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
            />
          </label>
          <div className="my-4 flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" onClick={gps}>
              <LocateFixed className="h-4 w-4" />
              Use device GPS
            </Button>
            <p
              role="status"
              className="max-w-md text-xs leading-5 text-charcoal-500"
            >
              {locationMessage}
            </p>
          </div>
          <div className="isolate z-0 h-64 overflow-hidden rounded-lg border border-sand-300">
            <MapContainer
              center={MARINDUQUE_CENTER}
              zoom={11}
              maxBounds={MARINDUQUE_BOUNDS}
              maxBoundsViscosity={1}
              minZoom={10}
              className="h-full w-full"
              aria-label="Select the incident location in Marinduque"
            >
              <Basemap satellite={false} />
              <MapLimits />
              <LocationPicker position={position} onChange={updatePin} />
            </MapContainer>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="field-label">
              Latitude
              <input
                className="input"
                type="number"
                step="any"
                min="13.17"
                max="13.64"
                value={latText}
                onChange={(e) => {
                  setLatText(e.target.value);
                  setPosition(null);
                }}
              />
            </label>
            <label className="field-label">
              Longitude
              <input
                className="input"
                type="number"
                step="any"
                min="121.78"
                max="122.18"
                value={lngText}
                onChange={(e) => {
                  setLngText(e.target.value);
                  setPosition(null);
                }}
              />
            </label>
            <Button
              type="button"
              variant="outline"
              className="self-end"
              onClick={() => {
                const lat = Number(latText),
                  lng = Number(lngText);
                if (!latText || !lngText || !inMarinduque(lat, lng)) {
                  setLocationMessage("Enter coordinates inside Marinduque.");
                  return;
                }
                updatePin([lat, lng]);
              }}
            >
              Set manual pin
            </Button>
          </div>
        </fieldset>
        <fieldset className="border-t border-sand-200 pt-6">
          <legend className="section-label">03 · Privacy & submission</legend>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="h-4 w-4 accent-marine-900"
            />
            Do not include my name or phone number
          </label>
          {!anonymous && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="field-label">
                Name (optional)
                <input
                  className="input"
                  maxLength={150}
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label className="field-label">
                Phone (optional)
                <input
                  className="input"
                  type="tel"
                  maxLength={100}
                  autoComplete="tel"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                />
              </label>
            </div>
          )}
          <p className="mt-4 text-xs leading-6 text-charcoal-500">
            Your report is stored on this device and sent to Supabase after
            sign-in and reconnection. Authorized officers for your municipality
            can access submitted details. Verified public updates exclude
            reporter contacts and internal notes. Avoid including private
            information in the incident description. Using a signed-in account
            still associates a report with that account.
          </p>
          <label className="mt-4 flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              required
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 h-4 w-4 accent-marine-900"
            />
            I understand how my report will be stored and used for local
            coordination.
          </label>
        </fieldset>
        {error && (
          <p
            role="alert"
            className="rounded-lg bg-coral-50 p-3 text-sm text-coral-700"
          >
            {error}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-sand-200 pt-5">
          <p className="flex items-center gap-2 text-xs text-charcoal-500">
            <CloudUpload className="h-4 w-4" />
            Works offline · safe in your device outbox
          </p>
          <Button type="submit" variant="coral" disabled={busy}>
            <Send className="h-4 w-4" />
            {busy ? "Saving…" : "Save report"}
          </Button>
        </div>
      </form>
      <section className="mt-7">
        <h2 className="font-display text-xl font-semibold text-marine-900">
          Your reports on this device / account
        </h2>
        {mine.length === 0 ? (
          <p className="mt-3 text-sm text-charcoal-500">
            No reports yet. Your saved reports and delivery status will appear
            here.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-sand-200 rounded-xl border border-sand-200 bg-white">
            {mine.map((r) => (
              <li key={r.id} className="p-4">
                <p className="text-xs font-bold text-marine-900">
                  {r.referenceNumber} · {r.municipality}
                </p>
                <p className="my-2 text-sm">{r.description}</p>
                <p className="text-xs text-charcoal-500">
                  {r.syncedAt
                    ? "Acknowledged by server"
                    : "Saved on device — waiting to sync"}{" "}
                  · {r.status.replaceAll("_", " ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
