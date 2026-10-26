import { AppProvider, useApp } from "./context/AppContext";
import { Header } from "./components/Header";
import { OfflineStatusBar } from "./components/OfflineStatusBar";
import { Overview } from "./components/Overview";
import { ReportForm } from "./components/ReportForm";
import { EnhancedRiskMap } from "./components/EnhancedRiskMap";
import { Dashboard } from "./components/Dashboard";
import { FacilityDirectory } from "./components/FacilityDirectory";
import { AdvisoryBoard } from "./components/AdvisoryBoard";
import { LivelihoodModule } from "./components/LivelihoodModule";
import { SitRepGenerator } from "./components/SitRepGenerator";
import { AuditTrailView } from "./components/AuditTrailView";
import { Preparedness } from "./components/Preparedness";
import { canManageReports } from "./lib/permissions";
import { PwaUpdate } from "./components/PwaUpdate";
function Content() {
  const app = useApp();
  const officer = canManageReports(app.currentUser);
  const emergency = app.advisories.filter(
    (a) =>
      a.severity === "emergency" &&
      a.verificationStatus === "current" &&
      (!a.validityPeriod || Date.parse(a.validityPeriod) > Date.now()),
  );
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-white focus:p-3"
      >
        Skip to content
      </a>
      {emergency.length > 0 && (
        <div
          role="alert"
          className="sticky top-0 z-[80] bg-coral-700 px-4 py-3 text-center text-sm text-white"
        >
          <strong>Official emergency advisory:</strong> {emergency[0].title}{" "}
          <a
            href={emergency[0].sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold underline"
          >
            Read original source
          </a>
        </div>
      )}
      <div className="min-h-screen md:pl-64">
        <PwaUpdate />
        <Header />
        <OfflineStatusBar />
        <main
          id="main-content"
          tabIndex={-1}
          className="min-h-[75vh] focus:outline-none"
        >
          {app.isLoading ? (
            <p role="status" className="page-shell text-sm">
              Loading saved community information…
            </p>
          ) : app.loadError ? (
            <p role="alert" className="page-shell text-coral-700">
              {app.loadError}
            </p>
          ) : (
            <>
              {app.activeTab === "overview" && <Overview />}
              {app.activeTab === "report" && <ReportForm />}
              {app.activeTab === "map" && <EnhancedRiskMap />}
              {(app.activeTab === "dashboard" ||
                app.activeTab === "verify") && <Dashboard />}
              {app.activeTab === "facilities" && <FacilityDirectory />}
              {app.activeTab === "advisories" && <AdvisoryBoard />}
              {app.activeTab === "preparedness" && <Preparedness />}
              {app.activeTab === "livelihood" && <LivelihoodModule />}
              {app.activeTab === "sitrep" && officer && <SitRepGenerator />}
              {app.activeTab === "audit" && officer && <AuditTrailView />}
            </>
          )}
        </main>
        <footer className="mx-4 mt-10 flex flex-wrap justify-between gap-3 border-t border-sand-200 py-6 text-[11px] text-charcoal-500 md:mx-8 print:hidden">
          <span>
            © {new Date().getFullYear()} PULSO · Marinduque Community Resilience
          </span>
          <span>Observe. Report. Verify. Respond.</span>
        </footer>
      </div>
    </>
  );
}
export default function App() {
  return (
    <AppProvider>
      <Content />
    </AppProvider>
  );
}
