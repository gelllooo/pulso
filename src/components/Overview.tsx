import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Send,
  MapPin,
  Layers,
  FileCheck2,
  Building,
  Radio,
  Sprout,
  Anchor,
  FileText,
  AlertTriangle,
  CheckCircle,
  WifiOff,
  Wifi,
  Clock,
  ArrowRight,
  ShieldCheck,
  Compass
} from 'lucide-react';

export const Overview: React.FC = () => {
  const {
    reports,
    facilities,
    advisories,
    isOffline,
    outboxCount,
    setActiveTab,
    selectedMunicipalityFilter,
    currentUser
  } = useApp();

  const verifiedCount = reports.filter((r) => r.status === 'verified').length;
  const assignedCount = reports.filter((r) => r.status === 'assigned' || r.status === 'action_in_progress').length;
  const urgentCount = reports.filter((r) => r.urgency === 'immediate_danger' || r.urgency === 'urgent').length;
  const totalEvacuees = facilities.reduce((acc, f) => acc + (f.type === 'evacuation_center' ? f.currentOccupancy : 0), 0);
  const totalBoats = reports.filter((r) => r.category === 'fisheries_damage').length;
  const totalAgriArea = reports
    .filter((r) => r.category === 'agriculture_damage')
    .reduce((acc, r) => acc + (r.livelihoodDetails?.affectedAreaHa || 0), 0);

  const recentReports = reports.slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-marine-900 via-marine-800 to-marine-700 text-white rounded-2xl p-6 sm:p-8 shadow-lg border border-marine-600">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center space-x-2 text-coral-400 font-bold text-xs uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-coral-400 animate-ping"></span>
            <span>Marinduque Community Resilience Platform</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white tracking-tight">
            PULSO Marinduque
          </h1>
          <p className="text-xs sm:text-sm text-sand-200 mt-2 leading-relaxed">
            An offline-first, community-centered disaster preparedness, resilience, and livelihood intelligence system. Empowering trained barangay reporters, farmers, fisherfolk, and DRRMO teams to coordinate verified action before, during, and after disasters.
          </p>

          {/* Workflow Sequence Indicator */}
          <div className="mt-5 pt-4 border-t border-marine-700/80 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-sand-200">
            <span className="text-sand-300 font-normal">Core Operational Workflow:</span>
            <span className="bg-marine-700/70 px-2 py-0.5 rounded text-white">Observe</span>
            <span>&rarr;</span>
            <span className="bg-marine-700/70 px-2 py-0.5 rounded text-white">Report</span>
            <span>&rarr;</span>
            <span className="bg-amber-500/30 text-amber-300 px-2 py-0.5 rounded border border-amber-500/40">
              Store Offline
            </span>
            <span>&rarr;</span>
            <span className="bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40">
              Synchronize
            </span>
            <span>&rarr;</span>
            <span className="bg-marine-700/70 px-2 py-0.5 rounded text-white">Verify</span>
            <span>&rarr;</span>
            <span className="bg-marine-700/70 px-2 py-0.5 rounded text-white">Visualize</span>
            <span>&rarr;</span>
            <span className="bg-coral-500/40 text-coral-200 px-2 py-0.5 rounded border border-coral-500/40">
              Respond
            </span>
          </div>
        </div>

        {/* Decorative subtle pulse graphic in background */}
        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none hidden md:block">
          <img src="/logo.svg" alt="" className="w-64 h-64" />
        </div>
      </div>

      {/* Active Weather Status & Offline Connectivity Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Weather Alert */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-sand-200 flex items-start space-x-3">
          <div className="p-2.5 bg-coral-100 text-coral-700 rounded-lg shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <div className="text-[11px] font-bold text-coral-600 uppercase tracking-wider">
              PAGASA Alert &bull; TCWS No. 2
            </div>
            <div className="font-bold text-marine-900 text-sm mt-0.5">
              Tropical Cyclone Advisory
            </div>
            <p className="text-charcoal-600 text-[11px] mt-1 leading-snug">
              62-88 km/h winds expected. Gale warning active for small seacraft in Marinduque waters.
            </p>
            <button
              onClick={() => setActiveTab('advisories')}
              className="mt-2 text-marine-800 font-bold underline flex items-center space-x-1"
            >
              <span>View Source Advisories</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Connectivity Status */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-sand-200 flex items-start space-x-3">
          <div
            className={`p-2.5 rounded-lg shrink-0 ${
              isOffline ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            {isOffline ? <WifiOff className="w-5 h-5" /> : <Wifi className="w-5 h-5" />}
          </div>
          <div className="text-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-charcoal-500">
              Offline-First Engine
            </div>
            <div className="font-bold text-marine-900 text-sm mt-0.5">
              {isOffline ? 'Offline Mode Active' : 'Online & Synchronized'}
            </div>
            <p className="text-charcoal-600 text-[11px] mt-1 leading-snug">
              {isOffline
                ? `${outboxCount} report(s) waiting in device IndexedDB outbox. Automatic background sync enabled.`
                : 'Connected to central data store. All local reports are up-to-date.'}
            </p>
            <button
              onClick={() => setActiveTab('report')}
              className="mt-2 text-coral-600 font-bold underline flex items-center space-x-1"
            >
              <span>Submit New Report</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Small Island Context */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-sand-200 flex items-start space-x-3">
          <div className="p-2.5 bg-marine-100 text-marine-800 rounded-lg shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-marine-700">
              Pilot Scope: Boac
            </div>
            <div className="font-bold text-marine-900 text-sm mt-0.5">
              Pilot Barangays Active
            </div>
            <p className="text-charcoal-600 text-[11px] mt-1 leading-snug">
              Active coverage in Cawit, Laylay, Murallon, Balimbing, and Poras before island-wide rollout.
            </p>
            <button
              onClick={() => setActiveTab('map')}
              className="mt-2 text-marine-800 font-bold underline flex items-center space-x-1"
            >
              <span>Explore Community Map</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-xl p-3.5 border border-sand-200 shadow-sm text-center">
          <span className="text-[10px] font-bold text-charcoal-500 uppercase">Total Reports</span>
          <div className="text-2xl font-display font-extrabold text-marine-900 mt-0.5">
            {reports.length}
          </div>
          <span className="text-[10px] text-charcoal-400">All categories</span>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-sand-200 shadow-sm text-center">
          <span className="text-[10px] font-bold text-coral-600 uppercase">Urgent Incidents</span>
          <div className="text-2xl font-display font-extrabold text-coral-600 mt-0.5">
            {urgentCount}
          </div>
          <span className="text-[10px] text-coral-500 font-medium">Prompt follow-up</span>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-sand-200 shadow-sm text-center">
          <span className="text-[10px] font-bold text-emerald-700 uppercase">Human-Verified</span>
          <div className="text-2xl font-display font-extrabold text-emerald-700 mt-0.5">
            {verifiedCount}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">Confirmed on ground</span>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-sand-200 shadow-sm text-center">
          <span className="text-[10px] font-bold text-sky-700 uppercase">Evacuees Count</span>
          <div className="text-2xl font-display font-extrabold text-sky-700 mt-0.5">
            {totalEvacuees}
          </div>
          <span className="text-[10px] text-sky-600 font-medium">In designated centers</span>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-sand-200 shadow-sm text-center">
          <span className="text-[10px] font-bold text-forest-700 uppercase">Agri Area Damaged</span>
          <div className="text-2xl font-display font-extrabold text-forest-700 mt-0.5">
            {totalAgriArea.toFixed(1)} <span className="text-xs font-normal">ha</span>
          </div>
          <span className="text-[10px] text-forest-600 font-medium">Palay & Coconut</span>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-sand-200 shadow-sm text-center">
          <span className="text-[10px] font-bold text-amber-700 uppercase">Offline Queued</span>
          <div className="text-2xl font-display font-extrabold text-amber-600 mt-0.5">
            {outboxCount}
          </div>
          <span className="text-[10px] text-amber-600 font-medium">In device storage</span>
        </div>
      </div>

      {/* Quick Action Cards Grid */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-marine-900 mb-3 flex items-center space-x-1.5">
          <Layers className="w-4 h-4 text-coral-500" />
          <span>Priority Actions & Workspaces</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ActionCard
            title="Submit Incident Report"
            tagline="Online or Offline"
            desc="Capture road cuts, flooding, blown roofs, crop or banca damage with GPS pin."
            btnText="Open Report Form"
            onClick={() => setActiveTab('report')}
            icon={<Send className="w-5 h-5 text-coral-600" />}
            color="border-coral-400"
          />

          <ActionCard
            title="Community Risk Map"
            tagline="Geospatial Intelligence"
            desc="Explore incident pins, evacuation locations, and GeoRiskPH flood zones."
            btnText="View Interactive Map"
            onClick={() => setActiveTab('map')}
            icon={<MapPin className="w-5 h-5 text-marine-700" />}
            color="border-marine-400"
          />

          <ActionCard
            title="Verification Dashboard"
            tagline="For Authorized Officials"
            desc="Review unverified reports, assign response crews, and maintain audit log."
            btnText="Open Verification Hub"
            onClick={() => setActiveTab('verify')}
            icon={<FileCheck2 className="w-5 h-5 text-emerald-700" />}
            color="border-emerald-400"
          />

          <ActionCard
            title="Situation Report Generator"
            tagline="NDRRMC Standard SitRep"
            desc="Auto-synthesize verified numbers into printable PDF and CSV for LGU leadership."
            btnText="Generate SitRep"
            onClick={() => setActiveTab('sitrep')}
            icon={<FileText className="w-5 h-5 text-sky-700" />}
            color="border-sky-400"
          />
        </div>
      </div>

      {/* Recent Incident Feed */}
      <div className="bg-white rounded-xl shadow-sm border border-sand-200 overflow-hidden">
        <div className="p-4 bg-sand-100 border-b border-sand-200 flex items-center justify-between">
          <span className="font-bold text-xs text-marine-900 flex items-center space-x-1.5">
            <Clock className="w-4 h-4 text-marine-700" />
            <span>Recent Community Incident Reports & Verifications</span>
          </span>
          <button
            onClick={() => setActiveTab('map')}
            className="text-xs font-bold text-coral-600 hover:text-coral-700 underline"
          >
            View All ({reports.length})
          </button>
        </div>

        <div className="divide-y divide-sand-200">
          {recentReports.map((r) => (
            <div key={r.id} className="p-4 hover:bg-sand-50/70 transition-colors text-xs flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-[11px] font-bold text-coral-600 bg-sand-100 px-1.5 py-0.5 rounded">
                    {r.referenceNumber}
                  </span>
                  <span className="font-bold text-marine-900 capitalize">
                    {r.category.replace(/_/g, ' ')}
                  </span>
                  <span className="text-charcoal-500">
                    &bull; {r.barangay}, {r.municipality} ({r.sitioOrLandmark})
                  </span>
                </div>
                <p className="text-charcoal-700 line-clamp-1">{r.description}</p>
              </div>

              <div className="flex items-center space-x-3 text-xs">
                <span
                  className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                    r.status === 'verified'
                      ? 'bg-emerald-100 text-emerald-800'
                      : r.status === 'assigned'
                      ? 'bg-sky-100 text-sky-800'
                      : r.status === 'queued_offline'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-sand-200 text-charcoal-700'
                  }`}
                >
                  {r.status.replace(/_/g, ' ').toUpperCase()}
                </span>
                <button
                  onClick={() => setActiveTab('verify')}
                  className="font-bold text-marine-800 hover:text-marine-900 underline text-[11px]"
                >
                  Dossier
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ActionCard: React.FC<{
  title: string;
  tagline: string;
  desc: string;
  btnText: string;
  onClick: () => void;
  icon: React.ReactNode;
  color: string;
}> = ({ title, tagline, desc, btnText, onClick, icon, color }) => {
  return (
    <div className={`bg-white rounded-xl p-5 border border-sand-200 hover:shadow-md transition-all flex flex-col justify-between border-t-4 ${color}`}>
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 bg-sand-100 rounded-lg">{icon}</div>
          <span className="text-[10px] font-bold text-charcoal-500 uppercase tracking-wider">
            {tagline}
          </span>
        </div>
        <h3 className="font-display font-bold text-base text-marine-900 mb-1">{title}</h3>
        <p className="text-xs text-charcoal-600 leading-relaxed mb-4">{desc}</p>
      </div>

      <button
        onClick={onClick}
        className="w-full py-2 px-3 bg-sand-100 hover:bg-sand-200 text-marine-900 font-bold text-xs rounded-lg transition-colors flex items-center justify-center space-x-1"
      >
        <span>{btnText}</span>
        <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
};
