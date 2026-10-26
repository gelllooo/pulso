import type { SupabaseClient } from "@supabase/supabase-js";
import { db } from "../db";
import { submissionPayload } from "./reports";
import type { IncidentReport } from "../types";

let active: Promise<{ sent: number; failed: number }> | null = null;
export function synchronizeOutbox(client: SupabaseClient, userId: string) {
  if (active) return active;
  active = run(client, userId).finally(() => {
    active = null;
  });
  return active;
}
async function run(client: SupabaseClient, userId: string) {
  let sent = 0,
    failed = 0;
  const queued = await db.outbox.toArray();
  for (const original of queued) {
    const {
      data: { session },
    } = await client.auth.getSession();
    if (session?.user.id !== userId) break;
    // Claim device-guest drafts once before a network attempt; they can never be sent by a different user.
    let report: IncidentReport | undefined;
    await db.transaction("rw", db.outbox, db.reports, async () => {
      const latest = await db.outbox.get(original.id);
      if (!latest || (latest.ownerUserId && latest.ownerUserId !== userId))
        return;
      report = { ...latest, ownerUserId: userId };
      await db.outbox.put(report);
      await db.reports.put(report);
    });
    if (!report) continue;
    const queuedReport = report;
    // Bind this request to the session that claimed the report, even if another tab signs in meanwhile.
    const { data, error } = await client
      .rpc("submit_report", {
        p_report: submissionPayload(report),
      })
      .setHeader("Authorization", `Bearer ${session.access_token}`);
    if (
      error ||
      data?.id !== report.clientReportId ||
      data.client_report_id !== report.clientReportId ||
      data.owner_id !== userId ||
      ![
        "received",
        "under_verification",
        "verified",
        "assigned",
        "action_in_progress",
        "resolved",
        "closed",
        "rejected",
        "duplicate",
      ].includes(data.status) ||
      !Number.isFinite(Date.parse(data.updated_at))
    ) {
      failed++;
      await db.syncLogs.add({
        id: crypto.randomUUID(),
        clientReportId: report.clientReportId,
        attemptNumber: Date.now(),
        status: "failed",
        timestamp: new Date().toISOString(),
        message:
          error?.message ||
          "Server acknowledgment was not valid. Report remains queued.",
      });
      continue;
    }
    // Only an authenticated server acknowledgment removes an entry from the outbox.
    await db.transaction("rw", db.reports, db.outbox, db.syncLogs, async () => {
      await db.reports.put({
        ...queuedReport,
        id: queuedReport.id,
        status: data.status,
        syncedAt: new Date().toISOString(),
        lastUpdatedAt: data.updated_at,
      });
      await db.outbox.delete(queuedReport.id);
      await db.syncLogs.add({
        id: crypto.randomUUID(),
        clientReportId: queuedReport.clientReportId,
        attemptNumber: Date.now(),
        status: "success",
        timestamp: new Date().toISOString(),
        message: "Supabase acknowledged this report.",
      });
    });
    sent++;
  }
  return { sent, failed };
}
