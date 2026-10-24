import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { OfflineStatusBar } from './components/OfflineStatusBar';
import { Overview } from './components/Overview';
import { ReportForm } from './components/ReportForm';
import { RiskMap } from './components/RiskMap';
import { VerificationDashboard } from './components/VerificationDashboard';
import { FacilityDirectory } from './components/FacilityDirectory';
import { AdvisoryBoard } from './components/AdvisoryBoard';
import { LivelihoodModule } from './components/LivelihoodModule';
import { SitRepGenerator } from './components/SitRepGenerator';
import { AuditTrailView } from './components/AuditTrailView';

const AppContent: React.FC = () => {
  const { activeTab, crisisMode } = useApp();

  return (
    <div className={`min-h-screen flex flex-col ${crisisMode ? 'bg-amber-50/40' : 'bg-sand-50'}`}>
      <Header />
      <OfflineStatusBar />

      <main className="flex-1">
        {activeTab === 'overview' && <Overview />}
        {activeTab === 'report' && <ReportForm />}
        {activeTab === 'map' && <RiskMap />}
        {activeTab === 'verify' && <VerificationDashboard />}
        {activeTab === 'facilities' && <FacilityDirectory />}
        {activeTab === 'advisories' && <AdvisoryBoard />}
        {activeTab === 'livelihood' && <LivelihoodModule />}
        {activeTab === 'sitrep' && <SitRepGenerator />}
        {activeTab === 'audit' && <AuditTrailView />}
      </main>

      <footer className="print:hidden bg-marine-950 text-sand-300 border-t border-marine-800 py-6 text-xs mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <img src="/logo.svg" alt="PULSO Logo" className="w-6 h-6" />
            <div>
              <span className="font-bold text-white tracking-wider">PULSO</span> &mdash; Disaster Preparedness, Resilience, and Livelihood Intelligence System
              <div className="text-[11px] text-charcoal-400">
                Designed for the Island Province of Marinduque (MIMAROPA Region) &bull; Offline-First Progressive Web App
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-[11px] text-sand-400">
            <span>Compliant with NPC Circular 16-03</span>
            <span>&bull;</span>
            <span>DOST-PAGASA / PHIVOLCS Attribution</span>
            <span>&bull;</span>
            <span>NDRRMC Standard SitRep Format</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
