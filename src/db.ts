import Dexie, { type Table } from "dexie";
import type {
  IncidentReport,
  Facility,
  OfficialAdvisory,
  AuditEvent,
  SyncLog,
} from "./types";
import { INITIAL_FACILITIES } from "./data/marinduqueData";

export class PulsoDatabase extends Dexie {
  reports!: Table<IncidentReport, string>;
  outbox!: Table<IncidentReport, string>;
  drafts!: Table<Partial<IncidentReport>, string>;
  facilities!: Table<Facility, string>;
  advisories!: Table<OfficialAdvisory, string>;
  auditEvents!: Table<AuditEvent, string>;
  syncLogs!: Table<SyncLog, string>;
  constructor() {
    super("PulsoMarinduqueDB");
    const legacy = {
      reports:
        "id, clientReportId, referenceNumber, category, municipality, barangay, urgency, status, reportedTime",
      outbox:
        "id, clientReportId, referenceNumber, category, municipality, reportedTime",
      drafts: "id, category, municipality, reportedTime",
      facilities: "id, type, municipality, operatingStatus",
      advisories: "id, issuer, status, severity",
      auditEvents: "id, reportId, actor, timestamp",
      syncLogs: "id, clientReportId, status, timestamp",
    };
    // Preserve schema history so existing devices migrate rather than losing their outbox.
    for (const version of [1, 2, 3, 4, 5]) this.version(version).stores(legacy);
    this.version(6)
      .stores({
        ...legacy,
        reports: legacy.reports + ", ownerUserId",
        outbox: legacy.outbox + ", ownerUserId",
      })
      .upgrade(async (tx) => {
        await tx
          .table("reports")
          .bulkDelete(["REP-001", "REP-002", "REP-003", "REP-004"]);
        await tx
          .table("advisories")
          .filter((a) => /^ADV-/.test(a.id))
          .delete();
        await tx
          .table("facilities")
          .filter((f) => /^FAC-/.test(f.id))
          .delete();
        await tx
          .table("auditEvents")
          .filter((a) => ["AUD-001", "AUD-002", "AUD-003"].includes(a.id))
          .delete();
        for (const name of ["reports", "outbox"]) {
          await tx
            .table(name)
            .toCollection()
            .modify((report) => {
              report.ownerUserId ??= null;
              report.reporterRole = "resident_guest";
              report.locationSource ??= "legacy";
              // Keep the report's original client identifier until it is atomically migrated below.
            });
        }
        for (const report of await tx.table("outbox").toArray()) {
          if (
            !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(
              report.clientReportId,
            )
          ) {
            report.clientReportId = crypto.randomUUID();
            await tx.table("outbox").put(report);
            await tx.table("reports").put(report);
          }
        }
      });
  }
}
export const db = new PulsoDatabase();
let initialization: Promise<void> | undefined;
export function initializeDatabase() {
  // One shared transaction/promise prevents StrictMode and multi-tab duplicate seeding.
  initialization ??= db
    .transaction("rw", db.facilities, async () => {
      if ((await db.facilities.count()) === 0)
        await db.facilities.bulkPut(INITIAL_FACILITIES);
    })
    .catch((error) => {
      initialization = undefined;
      throw error;
    });
  return initialization;
}
