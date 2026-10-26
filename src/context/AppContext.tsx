import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import type {
  UserProfile,
  IncidentReport,
  Facility,
  OfficialAdvisory,
  AuditEvent,
  Municipality,
  VerificationData,
  AssignmentData,
  ReportStatus,
  AppTab,
} from "../types";
import { db, initializeDatabase } from "../db";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { canManageReports, ROLES } from "../lib/permissions";
import { fromRemote } from "../lib/reports";
import { synchronizeOutbox } from "../lib/sync";
import { BARANGAYS } from "../data/marinduqueData";
import { inMarinduque } from "../lib/geo";

type ReportInput = Omit<
  IncidentReport,
  | "id"
  | "clientReportId"
  | "referenceNumber"
  | "status"
  | "idempotencyKey"
  | "lastUpdatedAt"
>;
interface AppContextType {
  currentUser: UserProfile;
  authLoading: boolean;
  backendConfigured: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  isNetworkOnline: boolean;
  isOffline: boolean;
  outboxCount: number;
  isLoading: boolean;
  loadError: string | null;
  syncError: string | null;
  isSyncing: boolean;
  syncNow: () => Promise<void>;
  refreshData: () => Promise<void>;
  reports: IncidentReport[];
  facilities: Facility[];
  advisories: OfficialAdvisory[];
  auditEvents: AuditEvent[];
  crisisMode: boolean;
  setCrisisMode: (value: boolean) => void;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  selectedMunicipalityFilter: Municipality | "All";
  setSelectedMunicipalityFilter: (m: Municipality | "All") => void;
  submitReport: (input: ReportInput) => Promise<string>;
  verifyReport: (id: string, data: VerificationData) => Promise<void>;
  assignReport: (id: string, data: AssignmentData) => Promise<void>;
  updateReportStatus: (
    id: string,
    status: ReportStatus,
    notes: string,
  ) => Promise<void>;
  activeToast: string | null;
  clearToast: () => void;
  notify: (message: string) => void;
}
const GUEST: UserProfile = {
  id: "guest",
  name: "Guest on this device",
  role: "resident_guest",
  scopeMunicipality: "",
};
const AppContext = createContext<AppContextType | undefined>(undefined);
export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile>(GUEST);
  const userRef = useRef(currentUser);
  const authGeneration = useRef(0);
  const refreshGeneration = useRef(0);
  const [authLoading, setAuthLoading] = useState(!!supabase);
  const [isNetworkOnline, setNetworkOnline] = useState(navigator.onLine);
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [advisories, setAdvisories] = useState<OfficialAdvisory[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [outboxCount, setOutboxCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeToast, setActiveToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>("overview");
  const [selectedMunicipalityFilter, setSelectedMunicipalityFilter] = useState<
    Municipality | "All"
  >("All");
  const [crisisMode, setCrisisMode] = useState(false);

  const refreshData = useCallback(async () => {
    const generation = ++refreshGeneration.current;
    const identity = userRef.current.id;
    const stillCurrent = () =>
      generation === refreshGeneration.current &&
      userRef.current.id === identity;
    try {
      await initializeDatabase();
      const local = (await db.reports.toArray()).filter(
        (r) => r.ownerUserId === identity || !r.ownerUserId,
      );
      const queued = (await db.outbox.toArray()).filter(
        (r) => r.ownerUserId === identity || !r.ownerUserId,
      );
      const localFacilities = await db.facilities.toArray();
      const localAdvisories = await db.advisories.toArray();
      if (!stillCurrent()) return;
      setReports(local);
      setOutboxCount(queued.length);
      setFacilities(localFacilities);
      setAdvisories(localAdvisories);
      setAuditEvents([]);
      setLoadError(null);
      setIsLoading(false);
      if (!supabase || !navigator.onLine) return;
      const [
        publicResult,
        privateResult,
        facilityResult,
        advisoryResult,
        auditResult,
      ] = await Promise.all([
        supabase
          .from("public_incidents")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(500),
        identity !== "guest"
          ? supabase
              .from("reports")
              .select("*,report_private(*),report_reviews(*)")
              .order("created_at", { ascending: false })
              .limit(500)
          : Promise.resolve({ data: [], error: null }),
        supabase.from("facilities").select("payload").order("municipality"),
        supabase
          .from("official_advisories")
          .select("*")
          .eq("status", "active")
          .order("issued_at", { ascending: false })
          .limit(100),
        canManageReports(userRef.current)
          ? supabase
              .from("report_audit")
              .select("*")
              .order("created_at", { ascending: false })
              .limit(100)
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (!stillCurrent()) return;
      const error = [
        publicResult,
        privateResult,
        facilityResult,
        advisoryResult,
        auditResult,
      ].find((r) => r.error)?.error;
      if (error) {
        setSyncError(`Server refresh unavailable: ${error.message}`);
        return;
      }
      const merged = new Map<string, IncidentReport>();
      for (const r of publicResult.data || [])
        merged.set(r.id, fromRemote(r, true));
      for (const r of privateResult.data || []) merged.set(r.id, fromRemote(r));
      for (const r of local)
        if (!r.syncedAt || !merged.has(r.clientReportId)) merged.set(r.id, r);
      setReports(
        [...merged.values()].sort((a, b) =>
          b.reportedTime.localeCompare(a.reportedTime),
        ),
      );
      if (facilityResult.data?.length) {
        const items = facilityResult.data.map((r) => r.payload as Facility);
        setFacilities(items);
        await db.facilities.bulkPut(items);
      }
      const items: OfficialAdvisory[] = (advisoryResult.data || []).map(
        (a) => ({
          id: a.id,
          issuer: a.issuer,
          title: a.title,
          category: a.category,
          sourceUrl: a.source_url,
          issuanceTime: a.issued_at,
          validityPeriod: a.expires_at,
          verificationStatus:
            a.expires_at && Date.parse(a.expires_at) < Date.now()
              ? "expired"
              : "current",
          scope: a.municipality || "Marinduque",
          municipality: a.municipality,
          content: a.content,
          status: "active",
          severity: a.severity,
        }),
      );
      setAdvisories(items);
      await db.transaction("rw", db.advisories, async () => {
        await db.advisories.clear();
        await db.advisories.bulkPut(items);
      });
      if (stillCurrent())
        setAuditEvents(
          (auditResult.data || []).map((a) => ({
            id: a.id,
            reportId: a.report_id,
            actor: a.actor_id,
            actorRole: a.actor_role,
            action: a.action,
            previousStatus: a.previous_status,
            newStatus: a.new_status,
            timestamp: a.created_at,
            notes: a.notes || "",
          })),
        );
    } catch (error) {
      if (stillCurrent()) {
        setLoadError(
          "Saved data could not be loaded. Check this browser’s storage permissions.",
        );
        setActiveToast(
          error instanceof Error ? error.message : "Local storage failed.",
        );
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    async function applySession(session: Session | null) {
      const generation = ++authGeneration.current;
      ++refreshGeneration.current;
      const next: UserProfile = session
        ? {
            ...GUEST,
            id: session.user.id,
            name: session.user.is_anonymous
              ? "Guest account"
              : session.user.user_metadata.full_name || "Resident",
          }
        : GUEST;
      userRef.current = next;
      setCurrentUser(next);
      setReports([]);
      setAuditEvents([]);
      setActiveTab("overview");
      setSyncError(null);
      if (session && supabase) {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        if (!mounted || generation !== authGeneration.current) return;
        if (error)
          setSyncError(
            "Your profile could not be loaded. Officer privileges remain disabled.",
          );
        else if (data && ROLES.includes(data.role)) {
          const profile: UserProfile = {
            id: data.id,
            name: data.display_name || next.name,
            role: data.role,
            scopeMunicipality: data.municipality || "",
            agencyOrOffice:
              data.role === "municipal_officer"
                ? `${data.municipality} MDRRMO`
                : "PULSO",
          };
          userRef.current = profile;
          setCurrentUser(profile);
        }
      }
      if (mounted && generation === authGeneration.current) {
        setAuthLoading(false);
        void refreshData();
      }
    }
    if (supabase) {
      void supabase.auth.getSession().then(({ data, error }) => {
        if (error) setSyncError("Sign-in session could not be restored.");
        if (mounted) void applySession(data.session);
      });
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        queueMicrotask(() => {
          if (mounted) void applySession(session);
        });
      });
      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    }
    void refreshData();
    return () => {
      mounted = false;
    };
  }, [refreshData]);
  useEffect(() => {
    const online = () => setNetworkOnline(true),
      offline = () => setNetworkOnline(false);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, []);
  const syncNow = useCallback(async () => {
    if (!navigator.onLine) return;
    if (!supabase) {
      setSyncError(
        "Cloud connection is not configured. Reports remain saved on this device.",
      );
      return;
    }
    const identity = userRef.current.id;
    if (identity === "guest") {
      setSyncError("Sign in to synchronize device reports to your account.");
      return;
    }
    setIsSyncing(true);
    try {
      const result = await synchronizeOutbox(supabase, identity);
      if (userRef.current.id !== identity) return;
      setSyncError(
        result.failed
          ? `${result.failed} report(s) could not be acknowledged. They remain in the outbox.`
          : null,
      );
      if (result.sent)
        setActiveToast(`${result.sent} report(s) acknowledged by the server.`);
      await refreshData();
    } catch (error) {
      if (userRef.current.id === identity)
        setSyncError(
          error instanceof Error
            ? error.message
            : "Synchronization failed; reports remain saved.",
        );
    } finally {
      setIsSyncing(false);
    }
  }, [refreshData]);
  useEffect(() => {
    if (!authLoading && isNetworkOnline && currentUser.id !== "guest")
      void syncNow();
  }, [authLoading, isNetworkOnline, currentUser.id, syncNow]);
  useEffect(() => {
    const timer = setInterval(() => {
      if (navigator.onLine) {
        if (userRef.current.id !== "guest") void syncNow();
        else void refreshData();
      }
    }, 45000);
    return () => clearInterval(timer);
  }, [syncNow, refreshData]);

  async function signIn() {
    if (!supabase) {
      setActiveToast(
        "Supabase is not configured yet. See docs/DEPLOYMENT.md. Reports can still be saved on this device.",
      );
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) setActiveToast(`Sign in failed: ${error.message}`);
  }
  async function signOut() {
    if (!supabase) return;
    ++authGeneration.current;
    ++refreshGeneration.current;
    userRef.current = GUEST;
    setCurrentUser(GUEST);
    setReports([]);
    setAuditEvents([]);
    setActiveTab("overview");
    setSyncError(null);
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) setActiveToast(error.message);
    await refreshData();
  }
  async function submitReport(data: ReportInput) {
    const barangay = BARANGAYS.find(
      (b) =>
        b.psgcCode === data.barangayCode &&
        b.municipality === data.municipality,
    );
    if (!barangay)
      throw new Error("Choose a valid municipality and PSGC barangay.");
    if (!inMarinduque(data.lat, data.lng))
      throw new Error("Place the incident pin inside Marinduque.");
    if (data.description.trim().length < 10 || data.description.length > 4000)
      throw new Error("Use a description between 10 and 4,000 characters.");
    const id = crypto.randomUUID(),
      now = new Date().toISOString();
    const referenceNumber = `PULSO-${new Date().getFullYear()}-${id.slice(0, 8).toUpperCase()}`;
    const report: IncidentReport = {
      ...data,
      barangay: barangay.name,
      reporterRole: userRef.current.role,
      description: data.description.trim(),
      id,
      clientReportId: id,
      ownerUserId: userRef.current.id === "guest" ? null : userRef.current.id,
      referenceNumber,
      status: "pending_sync",
      idempotencyKey: id,
      syncedAt: undefined,
      lastUpdatedAt: now,
    };
    await db.transaction("rw", db.reports, db.outbox, async () => {
      await db.reports.add(report);
      await db.outbox.add(report);
    });
    await refreshData();
    setActiveToast("Saved on device — waiting to sync.");
    if (navigator.onLine && userRef.current.id !== "guest") void syncNow();
    return referenceNumber;
  }
  async function manageReport(id: string, action: string, data: unknown) {
    const report = reports.find((r) => r.id === id);
    if (!report || !canManageReports(userRef.current, report.municipality))
      throw new Error("You are not authorized to manage this report.");
    if (!supabase || !navigator.onLine || !report.syncedAt)
      throw new Error(
        "Connect to the server and synchronize the report before taking an officer action.",
      );
    const { error } = await supabase.rpc("manage_report", {
      p_report_id: report.clientReportId,
      p_action: action,
      p_data: data,
    });
    if (error) throw new Error(error.message);
    await refreshData();
    setActiveToast("Officer action recorded by the server.");
  }
  return (
    <AppContext.Provider
      value={{
        currentUser,
        authLoading,
        backendConfigured: supabaseConfigured,
        signIn,
        signOut,
        isNetworkOnline,
        isOffline: !isNetworkOnline,
        outboxCount,
        isLoading,
        loadError,
        syncError,
        isSyncing,
        syncNow,
        refreshData,
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
        verifyReport: (id, data) =>
          manageReport(id, data.duplicateOfId ? "duplicate" : "verify", data),
        assignReport: (id, data) => manageReport(id, "assign", data),
        updateReportStatus: (id, status, notes) =>
          manageReport(id, "status", { status, notes }),
        activeToast,
        clearToast: () => setActiveToast(null),
        notify: setActiveToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp requires AppProvider");
  return context;
}
