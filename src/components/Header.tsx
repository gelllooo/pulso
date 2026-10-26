import { useState } from "react";
import {
  Menu,
  Home,
  Send,
  Map,
  Radio,
  Building2,
  ShieldCheck,
  LayoutDashboard,
  Sprout,
  FileText,
  History,
  LogIn,
  LogOut,
  ArrowUpRight,
  Waves,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import type { AppTab } from "../types";
import { ROLE_LABELS, canManageReports } from "../lib/permissions";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";

const primary = [
  { id: "overview", label: "Home", icon: Home },
  { id: "report", label: "Reports", icon: Send },
  { id: "map", label: "Community map", icon: Map },
  { id: "advisories", label: "Official advisories", icon: Radio },
  { id: "facilities", label: "Facilities & evacuation", icon: Building2 },
  { id: "preparedness", label: "Preparedness", icon: ShieldCheck },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
] as const;
export function Header() {
  const app = useApp();
  const [open, setOpen] = useState(false);
  const navigate = (id: AppTab) => {
    app.setActiveTab(id);
    setOpen(false);
    document.getElementById("main-content")?.focus();
  };
  const navigation = (
    <>
      <nav aria-label="Primary navigation" className="mt-8 space-y-1">
        <p className="px-3 pb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-sand-400">
          Community workspace
        </p>
        {primary.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            aria-current={app.activeTab === id ? "page" : undefined}
            onClick={() => navigate(id)}
            className={`sidebar-link ${app.activeTab === id ? "bg-white/10 text-white border-l-coral-500" : "border-l-transparent text-sand-300 hover:bg-white/5 hover:text-white"}`}
          >
            <Icon
              className={`h-[18px] w-[18px] ${app.activeTab === id ? "text-coral-500" : ""}`}
            />
            <span>{label}</span>
            {app.activeTab === id && (
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-coral-500" />
            )}
          </button>
        ))}
        <div className="my-5 border-t border-white/10" />
        <button
          className="sidebar-link text-sand-300"
          onClick={() => navigate("livelihood")}
        >
          <Sprout className="h-[18px] w-[18px] text-forest-500" />
          Livelihood
        </button>
        {canManageReports(app.currentUser) && (
          <>
            <button
              className="sidebar-link text-sand-300"
              onClick={() => navigate("sitrep")}
            >
              <FileText className="h-[18px] w-[18px]" />
              Situation reports
            </button>
            <button
              className="sidebar-link text-sand-300"
              onClick={() => navigate("audit")}
            >
              <History className="h-[18px] w-[18px]" />
              Audit trail
            </button>
          </>
        )}
      </nav>
      <div className="mt-10 rounded-xl border border-white/10 bg-white/5 p-4 text-xs leading-relaxed text-sand-300">
        <Waves className="mb-2 h-5 w-5 text-sand-400" />
        <strong className="block text-white">Prepared together.</strong>Local
        knowledge. Human verification. A more resilient Marinduque.
      </div>
      <p className="mt-5 px-3 text-[10px] uppercase tracking-widest text-sand-400">
        PULSO · Marinduque, PH
      </p>
    </>
  );
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 overflow-y-auto bg-marine-900 px-4 py-7 text-white md:block print:hidden">
        <div className="flex items-center gap-3 px-3">
          <img src="/logo.svg" alt="" className="h-10 w-10" />
          <div>
            <span className="font-display text-2xl font-bold tracking-[0.15em]">
              PULSO
            </span>
            <p className="text-[10px] tracking-[0.12em] text-sand-300">
              COMMUNITY RESILIENCE
            </p>
          </div>
        </div>
        {navigation}
      </aside>
      <header className="flex min-h-20 items-center justify-between gap-3 border-b border-sand-200 bg-sand-50/95 px-4 py-3 md:px-8 print:hidden">
        <div className="flex items-center gap-3">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="px-2 md:hidden"
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>{navigation}</SheetContent>
          </Sheet>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-charcoal-500">
              Province of Marinduque
            </p>
            <p className="mt-0.5 text-sm font-semibold text-marine-900">
              Your community. Connected.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right text-xs sm:block">
            <p className="font-semibold text-marine-900">
              {app.currentUser.name}
            </p>
            <p className="text-charcoal-500">
              {ROLE_LABELS[app.currentUser.role]}
              {app.currentUser.scopeMunicipality
                ? ` · ${app.currentUser.scopeMunicipality}`
                : ""}
            </p>
          </div>
          {app.currentUser.id === "guest" ? (
            <Button
              variant="outline"
              onClick={() => void app.signIn()}
              disabled={app.authLoading}
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Sign in with Google</span>
              <span className="sm:hidden">Sign in</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => void app.signOut()}
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </header>
    </>
  );
}
