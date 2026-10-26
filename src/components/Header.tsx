import React from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  Shield,
  Layers,
  FileText,
  Building,
  Radio,
  Sprout,
  FileCheck2,
  History,
  Send
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentUser,
    setCurrentRole,
    isOffline,
    isSimulatedOffline,
    toggleSimulateOffline,
    outboxCount,
    syncNow,
    crisisMode,
    setCrisisMode,
    activeTab,
    setActiveTab
  } = useApp();

  const rolesList: { id: UserRole; label: string }[] = [
    { id: 'community_reporter', label: 'Community Reporter' },
    { id: 'barangay_official', label: 'Barangay Official' },
    { id: 'municipal_official', label: 'Municipal Official (MDRRMO)' },
    { id: 'provincial_official', label: 'Provincial Official (PDRRMO)' },
    { id: 'agriculture_officer', label: 'Agriculture Officer' },
    { id: 'fisheries_officer', label: 'Fisheries Officer' },
    { id: 'guest', label: 'Resident / Guest' },
    { id: 'admin', label: 'System Administrator' },
    { id: 'auditor', label: 'Auditor' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-marine-900 border-b border-marine-700 text-white shadow-md">
      {/* Crisis Mode Top Alert Banner */}
      {crisisMode && (
        <div className="bg-coral-600 px-4 py-2 text-white font-semibold flex items-center justify-between text-xs sm:text-sm animate-pulse">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-white" />
            <span>
              <strong>CRISIS MODE ACTIVE:</strong> Severe weather condition in Marinduque. Prioritize life-safety verification and evacuation center reporting.
            </span>
          </div>
          <button
            onClick={() => setCrisisMode(false)}
            className="text-xs bg-black/20 hover:bg-black/30 px-2 py-0.5 rounded ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Brand & Logo */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('overview')}>
          <div className="w-10 h-10 rounded-lg bg-marine-800 p-1 flex items-center justify-center border border-marine-600 shadow-inner">
            <img src="/logo.svg" alt="PULSO Logo" className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-display font-bold text-xl sm:text-2xl tracking-wider text-white">
                PULSO
              </span>
              <span className="text-[10px] font-semibold bg-marine-700 text-sand-300 px-1.5 py-0.5 rounded uppercase tracking-wider">
                Marinduque
              </span>
            </div>
            <p className="text-[11px] text-sand-200 hidden sm:block">
              Disaster Preparedness, Resilience & Livelihood Intelligence
            </p>
          </div>
        </div>

        {/* Center / Right Controls: Offline Sim, Outbox Sync, Role Switcher */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Offline Simulator Switch */}
          <button
            onClick={toggleSimulateOffline}
            title={isSimulatedOffline ? 'Click to restore online mode' : 'Click to simulate offline mode'}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md font-medium transition-all ${
              isOffline
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
            }`}
          >
            {isOffline ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span>Offline{isSimulatedOffline ? ' (Demo)' : ''}</span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>Online</span>
              </>
            )}
          </button>

          {/* Outbox Badge & Sync Button */}
          {outboxCount > 0 && (
            <button
              onClick={syncNow}
              disabled={isOffline}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-md font-semibold transition-all ${
                isOffline
                  ? 'bg-marine-800 text-sand-300 border border-marine-600 opacity-90 cursor-not-allowed'
                  : 'bg-coral-500 text-white hover:bg-coral-600 shadow-sm'
              }`}
              title={isOffline ? 'Connect to network to attempt sync' : 'Backend is not configured; reports remain local'}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>
                {outboxCount} Waiting
              </span>
            </button>
          )}

          {/* Crisis Mode Toggle */}
          <button
            onClick={() => setCrisisMode(!crisisMode)}
            className={`flex items-center space-x-1 px-2 py-1.5 rounded-md border text-xs transition-all ${
              crisisMode
                ? 'bg-coral-500 border-coral-400 text-white font-bold'
                : 'bg-marine-800 border-marine-700 text-sand-300 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{crisisMode ? 'Crisis Active' : 'Crisis Mode'}</span>
          </button>

          {/* Role Switcher */}
          <div className="flex items-center space-x-1.5 bg-marine-800 border border-marine-700 rounded-md px-2 py-1">
            <Shield className="w-3.5 h-3.5 text-sand-300" />
            <span className="text-sand-300 hidden md:inline text-[11px]">Role:</span>
            <select
              value={currentUser.role}
              onChange={(e) => setCurrentRole(e.target.value as UserRole)}
              className="bg-transparent text-white font-medium text-xs focus:outline-none cursor-pointer"
            >
              {rolesList.map((r) => (
                <option key={r.id} value={r.id} className="bg-marine-900 text-white">
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <nav className="bg-marine-800/80 backdrop-blur border-t border-marine-700/60 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto px-4 flex space-x-1">
          <NavTab
            id="overview"
            active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
            label="Home"
            icon={<Layers className="w-4 h-4" />}
          />
          <NavTab
            id="report"
            active={activeTab === 'report'}
            onClick={() => setActiveTab('report')}
            label="Report"
            highlight={true}
            icon={<Send className="w-4 h-4" />}
          />
          <NavTab
            id="map"
            active={activeTab === 'map'}
            onClick={() => setActiveTab('map')}
            label="Map"
            icon={<Layers className="w-4 h-4" />}
          />
          <NavTab
            id="verify"
            active={activeTab === 'verify'}
            onClick={() => setActiveTab('verify')}
            label="Review"
            icon={<FileCheck2 className="w-4 h-4" />}
          />
          <NavTab
            id="facilities"
            active={activeTab === 'facilities'}
            onClick={() => setActiveTab('facilities')}
            label="Safe Places"
            icon={<Building className="w-4 h-4" />}
          />
          <NavTab
            id="advisories"
            active={activeTab === 'advisories'}
            onClick={() => setActiveTab('advisories')}
            label="Advisories"
            icon={<Radio className="w-4 h-4" />}
          />
          <NavTab
            id="livelihood"
            active={activeTab === 'livelihood'}
            onClick={() => setActiveTab('livelihood')}
            label="Livelihood"
            icon={<Sprout className="w-4 h-4" />}
          />
          <NavTab
            id="sitrep"
            active={activeTab === 'sitrep'}
            onClick={() => setActiveTab('sitrep')}
            label="Situation Report"
            icon={<FileText className="w-4 h-4" />}
          />
          <NavTab
            id="audit"
            active={activeTab === 'audit'}
            onClick={() => setActiveTab('audit')}
            label="Activity"
            icon={<History className="w-4 h-4" />}
          />
        </div>
      </nav>
    </header>
  );
};

const NavTab: React.FC<{
  id: string;
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
  highlight?: boolean;
}> = ({ active, onClick, label, icon, highlight }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-1.5 py-2.5 px-3 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 ${
        active
          ? 'border-coral-500 text-white bg-marine-700/50'
          : highlight
          ? 'border-transparent text-coral-400 hover:text-coral-300 hover:bg-marine-700/30 font-bold'
          : 'border-transparent text-sand-200 hover:text-white hover:bg-marine-700/30'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};
