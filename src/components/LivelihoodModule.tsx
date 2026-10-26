import { useState } from "react";
import { Sprout, Anchor } from "lucide-react";
import { useApp } from "../context/AppContext";
import { MUNICIPALITIES } from "../data/marinduqueData";
import type { Municipality } from "../types";
export function LivelihoodModule() {
  const app = useApp();
  const [kind, setKind] = useState("agriculture_damage");
  const reports = app.reports.filter(
    (r) =>
      r.category === kind &&
      (app.selectedMunicipalityFilter === "All" ||
        r.municipality === app.selectedMunicipalityFilter),
  );
  const loss = reports.reduce(
      (n, r) => n + (r.livelihoodDetails?.estimatedValueLossPhp || 0),
      0,
    ),
    area = reports.reduce(
      (n, r) => n + (r.livelihoodDetails?.affectedAreaHa || 0),
      0,
    );
  return (
    <div className="page-shell">
      <p className="eyebrow">From farm to shore</p>
      <h1 className="page-title">Livelihood impact</h1>
      <p className="page-description">
        Community-reported impacts for agricultural and fisheries assessment.
        Values are estimates requiring officer validation.
      </p>
      <div className="my-6 flex flex-wrap items-end gap-4">
        <label className="field-label">
          Livelihood sector
          <select
            className="input"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            <option value="agriculture_damage">Agriculture</option>
            <option value="fisheries_damage">Fisheries</option>
          </select>
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
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Visible impact reports", value: reports.length },
          {
            label: "Reported loss estimate",
            value: `₱${loss.toLocaleString()}`,
          },
          {
            label:
              kind === "agriculture_damage"
                ? "Reported affected hectares"
                : "Sea travel guidance",
            value:
              kind === "agriculture_damage"
                ? area.toFixed(2)
                : "Check PCG / PAGASA",
          },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-forest-100 bg-forest-50 p-5"
          >
            <p className="text-xs text-forest-700">{c.label}</p>
            <p className="mt-3 font-display text-2xl font-semibold text-marine-900">
              {c.value}
            </p>
          </div>
        ))}
      </section>
      <p className="my-5 rounded-xl border border-sand-200 bg-white p-4 text-xs leading-6 text-charcoal-600">
        Follow current PAGASA warnings, Philippine Coast Guard instructions and
        local government advisories before marine activities. PULSO does not
        determine whether it is safe to sail.
      </p>
      <section className="rounded-xl border border-sand-200 bg-white">
        <h2 className="flex items-center gap-2 border-b border-sand-200 p-5 font-semibold text-marine-900">
          {kind === "agriculture_damage" ? (
            <Sprout className="h-5 w-5 text-forest-700" />
          ) : (
            <Anchor className="h-5 w-5" />
          )}
          Reported livelihood impacts
        </h2>
        {reports.length === 0 ? (
          <p className="p-6 text-sm text-charcoal-500">
            No livelihood reports match this selection.
          </p>
        ) : (
          <ul className="divide-y divide-sand-200">
            {reports.map((r) => (
              <li key={r.id} className="p-5">
                <p className="text-xs font-semibold text-charcoal-500">
                  {r.referenceNumber} · {r.barangay}, {r.municipality}
                </p>
                <p className="my-3 text-sm leading-6">{r.description}</p>
                <p className="text-xs text-forest-700">
                  {r.status.replaceAll("_", " ")} · Estimated loss{" "}
                  {r.livelihoodDetails?.estimatedValueLossPhp !== undefined
                    ? `₱${r.livelihoodDetails.estimatedValueLossPhp.toLocaleString()}`
                    : "not provided"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
