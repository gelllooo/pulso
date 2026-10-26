import { useState } from "react";
import { useApp } from "../context/AppContext";
import { canManageReports } from "../lib/permissions";
import { csvCell } from "../lib/csv";
import { Button } from "./ui/button";
export function SitRepGenerator() {
  const app = useApp();
  const [reviewer, setReviewer] = useState(""),
    [remarks, setRemarks] = useState("");
  const reports = app.reports.filter(
    (r) =>
      canManageReports(app.currentUser, r.municipality) &&
      [
        "verified",
        "assigned",
        "action_in_progress",
        "resolved",
        "closed",
      ].includes(r.status),
  );
  const facilities = app.facilities.filter(
    (f) =>
      canManageReports(app.currentUser, f.municipality) &&
      f.verificationStatus === "verified",
  );
  function download() {
    const rows = [
      [
        "Reference",
        "Municipality",
        "Barangay",
        "Category",
        "Status",
        "Reported at",
        "Public update",
      ],
      ...reports.map((r) => [
        r.referenceNumber,
        r.municipality,
        r.barangay,
        r.category,
        r.status,
        r.reportedTime,
        r.verification?.publicUpdate || "",
      ]),
    ];
    const file = new Blob(
      [rows.map((row) => row.map(csvCell).join(",")).join("\r\n")],
      { type: "text/csv;charset=utf-8" },
    );
    const url = URL.createObjectURL(file),
      link = document.createElement("a");
    link.href = url;
    link.download = `PULSO-SitRep-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="page-shell max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Human-reviewed coordination</p>
          <h1 className="page-title">Situation report</h1>
        </div>
        <div className="flex gap-3 print:hidden">
          <Button variant="outline" onClick={download}>
            Export CSV
          </Button>
          <Button onClick={() => window.print()}>Print report</Button>
        </div>
      </div>
      <p className="page-description">
        A working summary of visible, human-verified incidents in your
        authorized scope. It is not an official NDRRMC publication.
      </p>
      <section className="mt-7 rounded-xl border border-sand-200 bg-white p-6">
        <dl className="grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-charcoal-500">Prepared by</dt>
            <dd className="mt-1 font-semibold">{app.currentUser.name}</dd>
          </div>
          <div>
            <dt className="text-charcoal-500">Scope</dt>
            <dd className="mt-1 font-semibold">
              {app.currentUser.scopeMunicipality || "Marinduque"}
            </dd>
          </div>
          <div>
            <dt className="text-charcoal-500">Generated</dt>
            <dd className="mt-1">{new Date().toLocaleString("en-PH")}</dd>
          </div>
        </dl>
        <div className="my-6 grid gap-4 sm:grid-cols-2">
          <p className="rounded-lg bg-marine-50 p-4 text-sm">
            <strong>{reports.length}</strong> human-verified incidents in this
            snapshot
          </p>
          <p className="rounded-lg bg-forest-50 p-4 text-sm">
            <strong>{facilities.length}</strong> LGU-validated facilities in
            scope
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-sand-100">
              <tr>
                {[
                  "Reference",
                  "Area",
                  "Incident",
                  "Status",
                  "Public update",
                ].map((h) => (
                  <th key={h} className="p-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-200">
              {reports.map((r) => (
                <tr key={r.id}>
                  <td className="p-3">{r.referenceNumber}</td>
                  <td className="p-3">
                    {r.barangay}, {r.municipality}
                  </td>
                  <td className="p-3">{r.category.replaceAll("_", " ")}</td>
                  <td className="p-3">{r.status.replaceAll("_", " ")}</td>
                  <td className="p-3">
                    {r.verification?.publicUpdate ||
                      "No public update entered."}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {reports.length === 0 && (
          <p className="mt-5 text-sm text-charcoal-500">
            No verified incidents in this snapshot.
          </p>
        )}
        <label className="field-label mt-6">
          Reviewed by
          <input
            className="input"
            value={reviewer}
            placeholder="Enter the actual reviewer after review"
            onChange={(e) => setReviewer(e.target.value)}
          />
        </label>
        <label className="field-label mt-4">
          Officer remarks
          <textarea
            className="input"
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </label>
        <p className="mt-5 text-xs leading-6 text-charcoal-500">
          This export excludes reporter contacts and internal verification
          notes. Confirm source data and reviewer approval before distribution.
        </p>
      </section>
    </div>
  );
}
