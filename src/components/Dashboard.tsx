import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import {
  canManageReports,
  isAdministrator,
  ROLES,
  ROLE_LABELS,
} from "../lib/permissions";
import { supabase } from "../lib/supabase";
import { MUNICIPALITIES } from "../data/marinduqueData";
import { VerificationDashboard } from "./VerificationDashboard";
import { Button } from "./ui/button";
import type { UserRole } from "../types";
export function Dashboard() {
  const app = useApp();
  return (
    <div className="page-shell">
      <p className="eyebrow">{ROLE_LABELS[app.currentUser.role]} workspace</p>
      <h1 className="page-title">
        {isAdministrator(app.currentUser)
          ? "System administration"
          : canManageReports(app.currentUser)
            ? "Coordination dashboard"
            : "Your community dashboard"}
      </h1>
      <p className="page-description">
        {isAdministrator(app.currentUser)
          ? "Manage account roles and system notices. Access is enforced by database policies."
          : canManageReports(app.currentUser)
            ? "Review incidents within your assigned scope. Human decisions remain accountable and traceable."
            : "Track your reports and prepare your household. Verification is reserved for authorized officers."}
      </p>
      {isAdministrator(app.currentUser) ? (
        <Administration />
      ) : canManageReports(app.currentUser) ? (
        <VerificationDashboard />
      ) : (
        <section className="mt-7 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-sand-200 bg-white p-6">
            <h2 className="font-display text-xl font-semibold text-marine-900">
              Device outbox
            </h2>
            <p className="my-3 text-3xl font-bold">{app.outboxCount}</p>
            <p className="text-sm leading-6 text-charcoal-600">
              Saved reports remain on this device until authenticated server
              acknowledgment.
            </p>
            <Button className="mt-5" onClick={() => app.setActiveTab("report")}>
              View or submit reports
            </Button>
          </div>
          <div className="rounded-xl border border-sand-200 bg-white p-6">
            <h2 className="font-display text-xl font-semibold text-marine-900">
              Stay prepared
            </h2>
            <p className="mt-3 text-sm leading-6 text-charcoal-600">
              Read official sources, identify validated facilities and make a
              household plan.
            </p>
            <Button
              className="mt-5"
              variant="outline"
              onClick={() => app.setActiveTab("preparedness")}
            >
              Open preparedness checklist
            </Button>
            {app.currentUser.id === "guest" && (
              <Button className="ml-2 mt-3" onClick={() => void app.signIn()}>
                Sign in with Google
              </Button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
type ProfileRow = {
  id: string;
  display_name: string;
  role: UserRole;
  municipality: string | null;
};
function Administration() {
  const app = useApp();
  const [profiles, setProfiles] = useState<ProfileRow[]>([]),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [noticeKey, setNoticeKey] = useState("facility_notice");
  async function load() {
    if (!supabase) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("id,display_name,role,municipality")
      .order("display_name");
    if (error) setMessage(error.message);
    else setProfiles(data || []);
  }
  useEffect(() => {
    void load();
  }, []);
  useEffect(() => {
    let cancelled = false;
    void supabase
      ?.from("system_config")
      .select("value")
      .eq("key", noticeKey)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!cancelled) {
          if (error) setMessage(error.message);
          else setNotice(data?.value || "");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [noticeKey]);
  async function saveRole(
    profile: ProfileRow,
    e: React.FormEvent<HTMLFormElement>,
  ) {
    e.preventDefault();
    if (!supabase) return;
    const data = new FormData(e.currentTarget);
    setBusy(true);
    setMessage("");
    const role = data.get("role");
    const { error } = await supabase.rpc("admin_set_role", {
      p_user_id: profile.id,
      p_role: role,
      p_municipality:
        role === "municipal_officer" ? data.get("municipality") : null,
    });
    setMessage(error?.message || "Role assignment saved by the server.");
    await load();
    setBusy(false);
  }
  async function saveNotice(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.rpc("set_system_config", {
      p_key: noticeKey,
      p_value: notice,
    });
    setMessage(error?.message || "System notice saved.");
    setBusy(false);
  }
  return (
    <div className="mt-7 space-y-6">
      {message && (
        <p role="status" className="rounded-lg bg-sand-100 p-4 text-sm">
          {message}
        </p>
      )}
      <section className="rounded-xl border border-sand-200 bg-white p-5">
        <h2 className="font-display text-xl font-semibold text-marine-900">
          Account roles & municipality assignments
        </h2>
        <p className="mt-2 text-xs leading-6 text-charcoal-500">
          New accounts always start as resident / guest. Only administrators can
          assign officer roles. The last administrator cannot be removed.
        </p>
        <div className="mt-5 divide-y divide-sand-200">
          {profiles.map((profile) => (
            <form
              key={`${profile.id}-${profile.role}`}
              onSubmit={(e) => void saveRole(profile, e)}
              className="flex flex-wrap items-end gap-3 py-4"
            >
              <div className="mr-auto min-w-40">
                <p className="text-sm font-semibold">{profile.display_name}</p>
                <p className="mt-1 max-w-52 truncate font-mono text-[10px] text-charcoal-500">
                  {profile.id}
                </p>
              </div>
              <label className="field-label">
                Role
                <select
                  name="role"
                  className="input"
                  defaultValue={profile.role}
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field-label">
                Municipality for municipal officers
                <select
                  name="municipality"
                  className="input"
                  defaultValue={profile.municipality || MUNICIPALITIES[0]}
                >
                  {MUNICIPALITIES.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </label>
              <Button
                type="submit"
                variant="outline"
                disabled={busy || profile.id === app.currentUser.id}
              >
                Save role
              </Button>
            </form>
          ))}
        </div>
      </section>
      <form
        onSubmit={saveNotice}
        className="space-y-4 rounded-xl border border-sand-200 bg-white p-5"
      >
        <h2 className="font-display text-xl font-semibold text-marine-900">
          System notices
        </h2>
        <label className="field-label">
          Notice placement
          <select
            className="input"
            value={noticeKey}
            onChange={(e) => setNoticeKey(e.target.value)}
          >
            <option value="facility_notice">Facility directory</option>
            <option value="preparedness_notice">Preparedness checklist</option>
          </select>
        </label>
        <label className="field-label">
          Public notice text
          <textarea
            className="input"
            required
            maxLength={2000}
            rows={3}
            value={notice}
            onChange={(e) => setNotice(e.target.value)}
          />
        </label>
        <Button type="submit" disabled={busy}>
          Save notice
        </Button>
      </form>
    </div>
  );
}
