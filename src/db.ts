import Dexie, { type Table } from 'dexie';
import {
  IncidentReport,
  Facility,
  OfficialAdvisory,
  AuditEvent,
  SyncLog
} from './types';
import {
  INITIAL_REPORTS,
  INITIAL_FACILITIES,
  INITIAL_ADVISORIES
} from './data/marinduqueData';

export class PulsoDatabase extends Dexie {
  reports!: Table<IncidentReport, string>;
  outbox!: Table<IncidentReport, string>;
  drafts!: Table<Partial<IncidentReport>, string>;
  facilities!: Table<Facility, string>;
  advisories!: Table<OfficialAdvisory, string>;
  auditEvents!: Table<AuditEvent, string>;
  syncLogs!: Table<SyncLog, string>;

  constructor() {
    super('PulsoMarinduqueDB');
    this.version(1).stores({
      reports: 'id, clientReportId, referenceNumber, category, municipality, barangay, urgency, status, reportedTime',
      outbox: 'id, clientReportId, referenceNumber, category, municipality, reportedTime',
      drafts: 'id, category, municipality, reportedTime',
      facilities: 'id, type, municipality, operatingStatus',
      advisories: 'id, issuer, status, severity',
      auditEvents: 'id, reportId, actor, timestamp',
      syncLogs: 'id, clientReportId, status, timestamp'
    });
  }
}

export const db = new PulsoDatabase();

// Seed initial database if empty
export async function initializeDatabase() {
  const reportsCount = await db.reports.count();
  if (reportsCount === 0) {
    await db.reports.bulkAdd(INITIAL_REPORTS);
  }

  const facilitiesCount = await db.facilities.count();
  if (facilitiesCount === 0) {
    await db.facilities.bulkAdd(INITIAL_FACILITIES);
  }

  const advisoriesCount = await db.advisories.count();
  if (advisoriesCount === 0) {
    await db.advisories.bulkAdd(INITIAL_ADVISORIES);
  }

  const auditCount = await db.auditEvents.count();
  if (auditCount === 0) {
    await db.auditEvents.bulkAdd([
      {
        id: 'AUD-001',
        reportId: 'REP-001',
        actor: 'Juan Dela Cruz',
        actorRole: 'community_reporter',
        action: 'Report Submitted',
        previousStatus: 'draft',
        newStatus: 'received',
        timestamp: '2026-10-24 08:50',
        notes: 'Initial report submitted via web portal'
      },
      {
        id: 'AUD-002',
        reportId: 'REP-001',
        actor: 'Capt. E. Madrigal',
        actorRole: 'barangay_official',
        action: 'Report Verified',
        previousStatus: 'received',
        newStatus: 'verified',
        timestamp: '2026-10-24 09:10',
        notes: 'Verified water gauge 4.2m by physical inspection'
      },
      {
        id: 'AUD-003',
        reportId: 'REP-001',
        actor: 'MDRRMO Dispatcher',
        actorRole: 'municipal_official',
        action: 'Assigned to QRU',
        previousStatus: 'verified',
        newStatus: 'assigned',
        timestamp: '2026-10-24 09:15',
        notes: 'Sandbag fortification team deployed'
      }
    ]);
  }
}
