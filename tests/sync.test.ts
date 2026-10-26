import "fake-indexeddb/auto";
import { afterAll, beforeEach, describe, expect, test, vi } from "vitest";
import { db, initializeDatabase } from "../src/db";
import { synchronizeOutbox } from "../src/lib/sync";
import { submissionPayload } from "../src/lib/reports";
import type { IncidentReport } from "../src/types";
const user = "10000000-0000-4000-8000-000000000001";
function report(): IncidentReport {
  return {
    id: crypto.randomUUID(),
    clientReportId: crypto.randomUUID(),
    referenceNumber: "TEST",
    category: "flooding",
    description: "Synthetic test report for local synchronization.",
    observationTime: new Date().toISOString(),
    reportedTime: new Date().toISOString(),
    municipality: "Boac",
    barangay: "Agot",
    barangayCode: "1704001001",
    sitioOrLandmark: "",
    lat: 13.4,
    lng: 121.9,
    locationSource: "manual",
    urgency: "elevated",
    immediateDanger: false,
    status: "pending_sync",
    reporterRole: "resident_guest",
    isAnonymous: true,
    idempotencyKey: "test",
    lastUpdatedAt: new Date().toISOString(),
    ownerUserId: user,
  };
}
beforeEach(async () => {
  await db.reports.clear();
  await db.outbox.clear();
  await db.syncLogs.clear();
});
afterAll(() => db.close());
function client(rpc: ReturnType<typeof vi.fn>, id = user) {
  return {
    auth: {
      getSession: async () => ({
        data: { session: { user: { id }, access_token: `test-token-${id}` } },
      }),
    },
    rpc: (...args: unknown[]) => {
      const pending = rpc(...args);
      return Object.assign(pending, { setHeader: () => pending });
    },
  } as any;
}
describe("persistent outbox", () => {
  test("StrictMode/concurrent initialization seeds facilities exactly once", async () => {
    await Promise.all([
      initializeDatabase(),
      initializeDatabase(),
      initializeDatabase(),
    ]);
    expect(await db.facilities.count()).toBe(18);
  });
  test("failed delivery and invalid acknowledgments retain the report", async () => {
    const r = report();
    await db.outbox.put(r);
    await db.reports.put(r);
    await synchronizeOutbox(
      client(
        vi
          .fn()
          .mockResolvedValue({ data: null, error: { message: "offline" } }),
      ),
      user,
    );
    expect(await db.outbox.count()).toBe(1);
    await synchronizeOutbox(
      client(vi.fn().mockResolvedValue({ data: { id: r.id }, error: null })),
      user,
    );
    expect(await db.outbox.count()).toBe(1);
  });
  test("concurrent sync sends once and only valid acknowledgment clears the outbox", async () => {
    const r = report();
    await db.outbox.put(r);
    await db.reports.put(r);
    const rpc = vi.fn().mockResolvedValue({
      data: {
        id: r.clientReportId,
        client_report_id: r.clientReportId,
        owner_id: user,
        status: "received",
        updated_at: new Date().toISOString(),
      },
      error: null,
    });
    await Promise.all([
      synchronizeOutbox(client(rpc), user),
      synchronizeOutbox(client(rpc), user),
    ]);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(await db.outbox.count()).toBe(0);
    expect((await db.reports.get(r.id))?.status).toBe("received");
  });
  test("the outgoing request is bound to the account session that claimed the report", async () => {
    const r = report();
    r.ownerUserId = null;
    await db.outbox.put(r);
    await db.reports.put(r);
    const header = vi.fn().mockResolvedValue({
      data: {
        id: r.clientReportId,
        client_report_id: r.clientReportId,
        owner_id: user,
        status: "received",
        updated_at: new Date().toISOString(),
      },
      error: null,
    });
    const transport = {
      auth: {
        getSession: async () => ({
          data: {
            session: {
              user: { id: user },
              access_token: "captured-test-session",
            },
          },
        }),
      },
      rpc: () => ({ setHeader: header }),
    } as any;
    await synchronizeOutbox(transport, user);
    expect(header).toHaveBeenCalledWith(
      "Authorization",
      "Bearer captured-test-session",
    );
    expect((await db.reports.get(r.id))?.ownerUserId).toBe(user);
  });
  test("switching accounts never sends another account’s reports", async () => {
    const r = report();
    await db.outbox.put(r);
    const rpc = vi.fn();
    await synchronizeOutbox(client(rpc, "other-user"), "other-user");
    expect(rpc).not.toHaveBeenCalled();
    expect(await db.outbox.count()).toBe(1);
  });
  test("network payload cannot carry local verification, role or status", () => {
    const r = report();
    r.status = "verified";
    r.reporterRole = "administrator";
    const payload = submissionPayload(r);
    expect(payload).not.toHaveProperty("status");
    expect(payload).not.toHaveProperty("ownerUserId");
    expect(payload).not.toHaveProperty("verification");
    expect(payload).not.toHaveProperty("reporterRole");
  });
});
