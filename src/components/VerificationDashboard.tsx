import { useState } from "react";
import { Sparkles, ShieldCheck, Filter } from "lucide-react";
import { useApp } from "../context/AppContext";
import { canManageReports } from "../lib/permissions";
import type { IncidentReport, VerificationBasis, ReportStatus } from "../types";
import { supabase } from "../lib/supabase";
import { Button } from "./ui/button";
type Suggestion = {
  category: string;
  priority: "routine" | "elevated" | "urgent";
  reason: string;
  label: string;
};
const weights = { routine: 1, elevated: 2, urgent: 3 };
export function VerificationDashboard() {
  const app = useApp();
  const [selectedId, setSelected] = useState(""),
    [status, setStatus] = useState("All"),
    [suggestions, setSuggestions] = useState<Record<string, Suggestion>>({}),
    [sort, setSort] = useState(false);
  const items = app.reports
    .filter(
      (r) =>
        canManageReports(app.currentUser, r.municipality) &&
        (status === "All" || r.status === status),
    )
    .sort((a, b) =>
      sort
        ? (weights[suggestions[b.id]?.priority] || 0) -
          (weights[suggestions[a.id]?.priority] || 0)
        : b.reportedTime.localeCompare(a.reportedTime),
    );
  const selected = items.find((r) => r.id === selectedId) || items[0];
  if (!canManageReports(app.currentUser))
    return (
      <p role="alert" className="page-shell">
        Officer access required.
      </p>
    );
  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold text-marine-900">
          Human review queue
        </h2>
        <div className="flex flex-wrap gap-3">
          <label className="field-label">
            Report status
            <select
              className="input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="All">All statuses</option>
              {[
                "pending_sync",
                "received",
                "under_verification",
                "verified",
                "assigned",
                "action_in_progress",
                "resolved",
                "closed",
                "rejected",
                "duplicate",
              ].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <Button
            variant="outline"
            className="self-end"
            onClick={() => setSort(!sort)}
            disabled={!Object.keys(suggestions).length}
          >
            {sort ? "Use chronological order" : "Sort by AI suggestions"}
          </Button>
        </div>
      </div>
      <p className="my-3 text-xs leading-6 text-charcoal-500">
        {app.currentUser.role === "municipal_officer"
          ? `Authorized scope: ${app.currentUser.scopeMunicipality}.`
          : "Authorized scope: all of Marinduque."}{" "}
        Verification and management actions require a server connection. AI
        suggestions never change report status.
      </p>
      <div className="mt-5 grid gap-5 lg:grid-cols-5">
        <div className="space-y-3 lg:col-span-2">
          {items.length === 0 ? (
            <p className="rounded-xl border border-sand-200 bg-white p-6 text-sm text-charcoal-500">
              No reports in your authorized queue.
            </p>
          ) : (
            items.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelected(r.id)}
                className={`w-full rounded-xl border p-4 text-left ${r.id === selected?.id ? "border-marine-500 bg-marine-50" : "border-sand-200 bg-white"}`}
              >
                <p className="text-[10px] font-bold text-charcoal-500">
                  {r.referenceNumber} · {r.municipality}
                </p>
                <p className="mt-2 text-sm font-semibold capitalize text-marine-900">
                  {r.category.replaceAll("_", " ")}
                </p>
                <p className="my-2 line-clamp-2 text-xs leading-5 text-charcoal-600">
                  {r.description}
                </p>
                <p className="text-[10px] font-bold uppercase text-marine-700">
                  {r.status.replaceAll("_", " ")}
                  {suggestions[r.id]
                    ? ` · AI priority: ${suggestions[r.id].priority}`
                    : ""}
                </p>
              </button>
            ))
          )}
        </div>
        <div className="lg:col-span-3">
          {selected && (
            <ReportReview
              key={selected.id}
              report={selected}
              suggestion={suggestions[selected.id]}
              onSuggestion={(suggestion) =>
                setSuggestions((s) => ({ ...s, [selected.id]: suggestion }))
              }
            />
          )}
        </div>
      </div>
    </section>
  );
}
function ReportReview({
  report,
  suggestion,
  onSuggestion,
}: {
  report: IncidentReport;
  suggestion?: Suggestion;
  onSuggestion: (s: Suggestion) => void;
}) {
  const app = useApp();
  const [basis, setBasis] = useState<VerificationBasis>("field_check"),
    [confidence, setConfidence] = useState<"low" | "medium" | "high">("medium"),
    [severity, setSeverity] = useState<
      "mild" | "moderate" | "severe" | "critical"
    >("moderate"),
    [notes, setNotes] = useState(""),
    [publicUpdate, setPublic] = useState(""),
    [assignee, setAssignee] = useState(""),
    [action, setAction] = useState(""),
    [duplicate, setDuplicate] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const disabled =
    busy || app.isOffline || !app.backendConfigured || !report.syncedAt;
  async function run(work: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await work();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "The server did not accept this action.",
      );
    } finally {
      setBusy(false);
    }
  }
  function verify(isDuplicate = false) {
    return run(() =>
      app.verifyReport(report.id, {
        verifierName: app.currentUser.name,
        verifierRole: app.currentUser.role,
        verifierOffice: app.currentUser.agencyOrOffice || "",
        verifiedAt: new Date().toISOString(),
        basis,
        confidence,
        severityAssessment: severity,
        internalNotes: notes,
        publicUpdate,
        duplicateOfId: isDuplicate ? duplicate : undefined,
      }),
    );
  }
  async function suggest() {
    await run(async () => {
      if (!supabase) return;
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Sign in before requesting AI assistance.");
      const response = await fetch("/api/ai/sort", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ reportId: report.clientReportId }),
        signal: AbortSignal.timeout(35000),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "AI sorting is unavailable.");
      onSuggestion(data.suggestion);
    });
  }
  return (
    <article className="space-y-5 rounded-xl border border-sand-200 bg-white p-5">
      <div>
        <p className="text-xs font-bold text-charcoal-500">
          {report.referenceNumber}
        </p>
        <h3 className="mt-2 font-display text-xl font-semibold capitalize text-marine-900">
          {report.category.replaceAll("_", " ")}
        </h3>
        <p className="mt-2 text-xs text-charcoal-500">
          {report.barangay}, {report.municipality} ·{" "}
          {new Date(report.reportedTime).toLocaleString("en-PH")}
        </p>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-7">
          {report.description}
        </p>
        <p className="mt-3 text-xs">
          Reporter: {report.reporterName || "Not provided"} · Contact:{" "}
          {report.reporterContact || "Not provided"}
        </p>
      </div>
      {!report.syncedAt && (
        <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
          This report is still on this device. Synchronize it before an officer
          action.
        </p>
      )}
      <section className="rounded-lg border border-marine-100 bg-marine-50 p-4">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-marine-900">
          <Sparkles className="h-4 w-4" />
          Decision support
        </h4>
        <p className="mt-2 text-xs leading-6">
          Classification and ordering only. A human must independently review
          every suggestion. Report text is sent to the configured AI provider.
        </p>
        <Button
          className="mt-3"
          variant="outline"
          disabled={disabled}
          onClick={() => void suggest()}
        >
          Suggest category & priority
        </Button>
        {suggestion && (
          <div className="mt-4 border-t border-marine-100 pt-3">
            <p className="text-xs font-bold text-coral-700">
              AI Suggestion — Review Required
            </p>
            <p className="mt-2 text-sm capitalize">
              {suggestion.category.replaceAll("_", " ")} · {suggestion.priority}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-xs leading-6">
              {suggestion.reason}
            </p>
          </div>
        )}
      </section>
      {report.verification && (
        <details className="rounded-lg bg-sand-50 p-3 text-xs">
          <summary className="cursor-pointer font-semibold">
            Previous officer review
          </summary>
          <p className="mt-2 whitespace-pre-wrap">
            {report.verification.internalNotes || "No internal notes."}
          </p>
        </details>
      )}
      <section className="space-y-3 border-t border-sand-200 pt-5">
        <h4 className="flex items-center gap-2 font-semibold text-marine-900">
          <ShieldCheck className="h-4 w-4" />
          Human verification
        </h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="field-label">
            Verification basis
            <select
              className="input"
              value={basis}
              onChange={(e) => setBasis(e.target.value as VerificationBasis)}
            >
              {[
                "field_check",
                "official_source",
                "second_report",
                "phone_confirmation",
                "photo_evidence",
              ].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label className="field-label">
            Confidence
            <select
              className="input"
              value={confidence}
              onChange={(e) =>
                setConfidence(e.target.value as typeof confidence)
              }
            >
              {["low", "medium", "high"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label className="field-label">
            Severity assessment
            <select
              className="input"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as typeof severity)}
            >
              {["mild", "moderate", "severe", "critical"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="field-label">
          Internal verification notes
          <textarea
            className="input"
            rows={3}
            maxLength={4000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
        <label className="field-label">
          Public update (exclude private information)
          <textarea
            className="input"
            rows={2}
            maxLength={2000}
            value={publicUpdate}
            onChange={(e) => setPublic(e.target.value)}
          />
        </label>
        <Button disabled={disabled} onClick={() => void verify()}>
          Record human verification
        </Button>
        <details className="text-sm">
          <summary className="cursor-pointer py-2 font-semibold">
            Mark as a duplicate
          </summary>
          <label className="field-label">
            Original report server UUID
            <input
              className="input"
              value={duplicate}
              onChange={(e) => setDuplicate(e.target.value)}
            />
          </label>
          <Button
            className="mt-3"
            variant="outline"
            disabled={disabled || !duplicate}
            onClick={() => void verify(true)}
          >
            Record duplicate
          </Button>
        </details>
      </section>
      <details className="border-t border-sand-200 pt-3">
        <summary className="cursor-pointer text-sm font-semibold">
          Assign response or update status
        </summary>
        <div className="mt-4 space-y-3">
          <label className="field-label">
            Assigned team
            <input
              className="input"
              value={assignee}
              maxLength={150}
              onChange={(e) => setAssignee(e.target.value)}
            />
          </label>
          <label className="field-label">
            Action required
            <textarea
              className="input"
              value={action}
              maxLength={2000}
              onChange={(e) => setAction(e.target.value)}
            />
          </label>
          <Button
            disabled={disabled || assignee.length < 2 || action.length < 5}
            variant="outline"
            onClick={() =>
              void run(() =>
                app.assignReport(report.id, {
                  assignedTo: assignee,
                  assignedOffice:
                    app.currentUser.agencyOrOffice || report.municipality,
                  assignedAt: new Date().toISOString(),
                  actionRequired: action,
                }),
              )
            }
          >
            Assign verified incident
          </Button>
          <div className="flex flex-wrap gap-2">
            {(
              [
                "under_verification",
                "action_in_progress",
                "resolved",
                "closed",
                "rejected",
              ] as ReportStatus[]
            ).map((s) => (
              <Button
                key={s}
                variant="outline"
                className="text-xs"
                disabled={disabled}
                onClick={() =>
                  void run(() => app.updateReportStatus(report.id, s, notes))
                }
              >
                {s.replaceAll("_", " ")}
              </Button>
            ))}
          </div>
        </div>
      </details>
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-coral-50 p-3 text-sm text-coral-700"
        >
          {error}
        </p>
      )}
    </article>
  );
}
