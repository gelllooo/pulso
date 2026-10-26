import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  UserProfile,
  UserRole,
  IncidentReport,
  Facility,
  OfficialAdvisory,
  AuditEvent,
  SyncLog,
  Municipality,
  VerificationData,
  AssignmentData,
  ReportStatus,
  AppTab
} from '../types';
import { db, initializeDatabase } from '../db';

interface AppContextType {
  currentUser: UserProfile;
  setCurrentRole: (role: UserRole) => void;
  isSimulatedOffline: boolean;
  toggleSimulateOffline: () => void;
  isNetworkOnline: boolean;
  isOffline: boolean;
  outboxCount: number;
  isLoading: boolean;
  loadError: string | null;
  syncNow: () => Promise<void>;
  reports: IncidentReport[];
  facilities: Facility[];
  advisories: OfficialAdvisory[];
  auditEvents: AuditEvent[];
  crisisMode: boolean;
  setCrisisMode: (val: boolean) => void;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  selectedMunicipalityFilter: Municipality | 'All';
  setSelectedMunicipalityFilter: (m: Municipality | 'All') => void;
  submitReport: (reportData: Omit<IncidentReport, 'id' | 'clientReportId' | 'referenceNumber' | 'status' | 'idempotencyKey' | 'lastUpdatedAt'>) => Promise<string>;
  verifyReport: (reportId: string, data: VerificationData) => Promise<void>;
  assignReport: (reportId: string, data: AssignmentData) => Promise<void>;
  updateReportStatus: (reportId: string, newStatus: ReportStatus, notes: string) => Promise<void>;
  activeToast: string | null;
  clearToast: () => void;
}

const DEFAULT_USER: UserProfile = {
  id: 'USR-001',
  name: 'Maria Elena Reyes',
  role: 'barangay_official',
  scopeMunicipality: 'Boac',
  scopeBarangay: 'Cawit',
  contactNumber: '0917-888-2345',
  agencyOrOffice: 'BDRRMC Cawit'
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEFAULT_USER);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);
  const [isNetworkOnline, setIsNetworkOnline] = useState(navigator.onLine);
  const [outboxCount, setOutboxCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [advisories, setAdvisories] = useState<OfficialAdvisory[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [crisisMode, setCrisisMode] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>('overview');
  const [selectedMunicipalityFilter, setSelectedMunicipalityFilter] = useState<Municipality | 'All'>('All');
  const [activeToast, setActiveToast] = useState<string | null>(null);

  const isOffline = !isNetworkOnline || isSimulatedOffline;

  // Listen to browser network state
  useEffect(() => {
    const handleOnline = () => setIsNetworkOnline(true);
    const handleOffline = () => setIsNetworkOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize DB and load data
  const refreshData = async () => {
    try {
      const allReports = await db.reports.toArray();
      // Sort newest first
      allReports.sort((a, b) => new Date(b.reportedTime).getTime() - new Date(a.reportedTime).getTime());
      setReports(allReports);

      const allFacilities = await db.facilities.toArray();
      setFacilities(allFacilities);

      const allAdvisories = await db.advisories.toArray();
      setAdvisories(allAdvisories);

      const allAudits = await db.auditEvents.toArray();
      allAudits.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setAuditEvents(allAudits);

      const pendingCount = await db.outbox.count();
      setOutboxCount(pendingCount);
    } catch (err) {
      console.error('Failed to load from Dexie DB', err);
      setLoadError('Saved data could not be loaded. Try again.');
      setActiveToast('Unable to load locally stored data. Please check this device’s storage.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializeDatabase()
      .then(refreshData)
      .catch((err) => {
        console.error('Failed to initialize local database', err);
        setLoadError('Saved data could not be loaded. Try again.');
        setIsLoading(false);
        setActiveToast('Unable to initialize local storage. Reports cannot be saved on this device.');
      });
  }, []);

  const toggleSimulateOffline = () => {
    setIsSimulatedOffline((prev) => !prev);
    setActiveToast(
      !isSimulatedOffline
        ? 'Offline Mode Active — Reports will queue in local IndexedDB outbox'
        : 'Online mode restored — reports remain on this device until a backend is configured'
    );
  };

  const setCurrentRole = (role: UserRole) => {
    let office = 'Community Network';
    if (role === 'barangay_official') office = 'BDRRMC Cawit / Boac';
    else if (role === 'municipal_official') office = 'MDRRMO Boac Operations Center';
    else if (role === 'provincial_official') office = 'PDRRMO Marinduque';
    else if (role === 'agriculture_officer') office = 'Municipal Agriculture Office (MAO)';
    else if (role === 'fisheries_officer') office = 'BFAR / Municipal Fisheries Division';
    else if (role === 'admin') office = 'PULSO Systems Administration';
    else if (role === 'auditor') office = 'Internal Audit & Governance Office';

    setCurrentUser((prev) => ({
      ...prev,
      role,
      agencyOrOffice: office
    }));
    setActiveToast(`Switched active view role to: ${role.replace(/_/g, ' ').toUpperCase()}`);
  };

  const clearToast = () => setActiveToast(null);

  const syncNow = async () => {
    if (isOffline) {
      setActiveToast('Cannot sync while offline. Please connect to network.');
      return;
    }
    if (outboxCount === 0) {
      setActiveToast('There are no locally queued reports.');
      return;
    }
    setActiveToast('Backend API is not configured. Reports remain saved on this device and have not been sent.');
  };

  // Submit Report
  const submitReport = async (
    data: Omit<IncidentReport, 'id' | 'clientReportId' | 'referenceNumber' | 'status' | 'idempotencyKey' | 'lastUpdatedAt'>
  ): Promise<string> => {
    const randomHex = Math.floor(100 + Math.random() * 900);
    const refNum = `PULSO-2026-${data.municipality.toUpperCase()}-${randomHex}`;
    const id = `REP-${crypto.randomUUID()}`;
    const clientReportId = `client-${crypto.randomUUID()}`;
    const idempotencyKey = `idem-${crypto.randomUUID()}`;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const newReport: IncidentReport = {
      ...data,
      id,
      clientReportId,
      referenceNumber: refNum,
      status: 'pending_sync',
      idempotencyKey,
      syncedAt: undefined,
      lastUpdatedAt: nowStr
    };

    await db.transaction('rw', db.reports, db.outbox, db.auditEvents, async () => {
      await db.reports.add(newReport);
      await db.outbox.add(newReport);
      await db.auditEvents.add({
        id: 'AUD-' + Math.random().toString(36).substring(2, 9),
        reportId: id,
        actor: data.reporterName || 'Anonymous Reporter',
        actorRole: data.reporterRole,
        action: 'Report Saved Locally',
        previousStatus: 'draft',
        newStatus: 'pending_sync',
        timestamp: nowStr,
        notes: 'Saved in local IndexedDB outbox. No backend API is configured; the report has not been transmitted.'
      });
    });
    setActiveToast(`Report ${refNum} saved on this device. Backend delivery is not configured.`);

    await refreshData();
    return refNum;
  };

  // Verify Report
  const verifyReport = async (reportId: string, verData: VerificationData) => {
    const report = await db.reports.get(reportId);
    if (!report) return;

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const newStatus: ReportStatus = verData.duplicateOfId ? 'duplicate' : 'verified';

    const updated: IncidentReport = {
      ...report,
      status: newStatus,
      verification: verData,
      lastUpdatedAt: nowStr
    };

    await db.reports.put(updated);
    await db.auditEvents.add({
      id: 'AUD-' + Math.random().toString(36).substring(2, 9),
      reportId,
      actor: verData.verifierName,
      actorRole: verData.verifierRole,
      action: newStatus === 'duplicate' ? 'Marked as Duplicate' : 'Report Verified',
      previousStatus: report.status,
      newStatus,
      timestamp: nowStr,
      notes: `Verified via ${verData.basis} (Confidence: ${verData.confidence.toUpperCase()}). ${verData.internalNotes || ''}`
    });

    await refreshData();
    setActiveToast(`Report ${report.referenceNumber} status updated to: ${newStatus.toUpperCase()}`);
  };

  // Assign Report
  const assignReport = async (reportId: string, assData: AssignmentData) => {
    const report = await db.reports.get(reportId);
    if (!report) return;

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const updated: IncidentReport = {
      ...report,
      status: 'assigned',
      assignment: assData,
      lastUpdatedAt: nowStr
    };

    await db.reports.put(updated);
    await db.auditEvents.add({
      id: 'AUD-' + Math.random().toString(36).substring(2, 9),
      reportId,
      actor: currentUser.name,
      actorRole: currentUser.role,
      action: 'Assigned to Response Unit',
      previousStatus: report.status,
      newStatus: 'assigned',
      timestamp: nowStr,
      notes: `Assigned to ${assData.assignedTo} (${assData.assignedOffice}): ${assData.actionRequired}`
    });

    await refreshData();
    setActiveToast(`Incident ${report.referenceNumber} assigned to ${assData.assignedTo}`);
  };

  // Update Status
  const updateReportStatus = async (reportId: string, newStatus: ReportStatus, notes: string) => {
    const report = await db.reports.get(reportId);
    if (!report) return;

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const updated: IncidentReport = {
      ...report,
      status: newStatus,
      lastUpdatedAt: nowStr
    };

    await db.reports.put(updated);
    await db.auditEvents.add({
      id: 'AUD-' + Math.random().toString(36).substring(2, 9),
      reportId,
      actor: currentUser.name,
      actorRole: currentUser.role,
      action: `Status changed to ${newStatus}`,
      previousStatus: report.status,
      newStatus,
      timestamp: nowStr,
      notes
    });

    await refreshData();
    setActiveToast(`Report ${report.referenceNumber} marked as ${newStatus.toUpperCase()}`);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentRole,
        isSimulatedOffline,
        toggleSimulateOffline,
        isNetworkOnline,
        isOffline,
        outboxCount,
        isLoading,
        loadError,
        syncNow,
        reports,
        facilities,
        advisories,
        auditEvents,
        crisisMode,
        setCrisisMode,
        activeTab,
        setActiveTab,
        selectedMunicipalityFilter,
        setSelectedMunicipalityFilter,
        submitReport,
        verifyReport,
        assignReport,
        updateReportStatus,
        activeToast,
        clearToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
