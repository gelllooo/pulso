import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Radio,
  ExternalLink,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Compass,
  FileCheck,
  CheckCircle2,
  Info
} from 'lucide-react';

export const AdvisoryBoard: React.FC = () => {
  const { advisories, crisisMode, setCrisisMode } = useApp();

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2 text-coral-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Radio className="w-4 h-4" />
            <span>Official Information & Early Warning</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-marine-900">
            Mandated Agency Advisories & Bulletins
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-600 mt-0.5">
            Synchronized directly from PAGASA, PHIVOLCS, GeoRiskPH, and PDRRMO Marinduque. Strict source attribution is preserved.
          </p>
        </div>

        {/* Crisis Mode Toggle Card */}
        <div className="bg-sand-100 border border-sand-300 rounded-xl p-3 flex items-center space-x-3 text-xs">
          <div>
            <div className="font-bold text-marine-900">Crisis Mode Interface</div>
            <div className="text-[11px] text-charcoal-600">
              {crisisMode ? 'High-contrast emergency layout enabled' : 'Normal monitoring layout'}
            </div>
          </div>
          <button
            onClick={() => setCrisisMode(!crisisMode)}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors shadow-sm ${
              crisisMode
                ? 'bg-coral-600 text-white hover:bg-coral-700'
                : 'bg-marine-900 text-white hover:bg-marine-800'
            }`}
          >
            {crisisMode ? 'Deactivate Crisis' : 'Activate Crisis Mode'}
          </button>
        </div>
      </div>

      {/* Tropical Cyclone Warning Highlight Box */}
      <div className="bg-gradient-to-r from-marine-900 to-marine-800 text-white rounded-xl p-5 sm:p-6 shadow-md mb-8 border border-marine-700">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center space-x-2">
            <span className="bg-coral-500 text-white text-xs font-extrabold uppercase px-2.5 py-1 rounded">
              PAGASA TCWS No. 2
            </span>
            <span className="text-sand-200 text-xs">
              Severe Weather Bulletin &bull; MIMAROPA Region
            </span>
          </div>
          <span className="text-xs text-sand-300 font-mono">
            Issued: 2026-10-24 11:00 PHT
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-display font-bold text-white mb-2">
          Tropical Cyclone Wind Signal No. 2: Province of Marinduque
        </h2>
        <p className="text-xs sm:text-sm text-sand-100 leading-relaxed mb-4 max-w-3xl">
          Winds between 62 km/h and 88 km/h may be expected in at least 24 hours. Small seacraft and motorized bancas are strictly advised not to venture out into the open sea. Coastal communities in Boac, Gasan, and Torrijos should guard against moderate to high swells.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-3 border-t border-marine-700">
          <div>
            <span className="text-sand-300 text-[11px]">Affected Municipalities:</span>
            <div className="font-semibold text-white">All 6 Municipalities of Marinduque</div>
          </div>
          <div>
            <span className="text-sand-300 text-[11px]">Marine Travel Advisory:</span>
            <div className="font-semibold text-coral-300">Gale Warning / Small Craft Suspended</div>
          </div>
          <div className="flex items-end sm:justify-end">
            <a
              href="https://www.pagasa.dost.gov.ph"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-coral-400 hover:text-coral-300 underline flex items-center space-x-1"
            >
              <span>Verify on Official PAGASA Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Advisory Feed Cards */}
      <div className="space-y-4">
        {advisories.map((adv) => {
          const isEmergency = adv.severity === 'emergency';
          const isWarning = adv.severity === 'warning';

          return (
            <div
              key={adv.id}
              className={`rounded-xl border p-5 shadow-sm bg-white transition-all ${
                isEmergency
                  ? 'border-l-4 border-l-coral-600 border-sand-300'
                  : isWarning
                  ? 'border-l-4 border-l-amber-500 border-sand-300'
                  : 'border-l-4 border-l-sky-600 border-sand-300'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-marine-900 bg-sand-100 border border-sand-300 px-2 py-0.5 rounded">
                    {adv.issuer}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      isEmergency
                        ? 'bg-coral-100 text-coral-800'
                        : isWarning
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-sky-100 text-sky-800'
                    }`}
                  >
                    {adv.severity}
                  </span>
                  <span className="text-[11px] text-charcoal-500 font-mono">
                    ID: {adv.id}
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-xs text-charcoal-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{adv.issuanceTime}</span>
                </div>
              </div>

              <h3 className="font-display font-bold text-base sm:text-lg text-marine-900 mb-1">
                {adv.title}
              </h3>

              <div className="text-xs text-charcoal-600 mb-3">
                <strong>Scope:</strong> {adv.scope} &bull; <strong>Validity:</strong>{' '}
                {adv.validityPeriod}
              </div>

              <p className="text-xs sm:text-sm text-charcoal-800 leading-relaxed bg-sand-50/70 p-3 rounded-lg border border-sand-200 mb-4">
                {adv.content}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-sand-200 text-xs">
                <span className="text-[11px] text-charcoal-500">
                  PULSO Policy: Content unaltered from original mandated agency broadcast.
                </span>
                <a
                  href={adv.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-marine-800 hover:text-marine-900 underline flex items-center space-x-1"
                >
                  <span>View Original Source Bulletin</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Official Deference Safeguard Notice */}
      <div className="mt-8 bg-sand-100/80 border border-sand-300 rounded-xl p-4 text-xs text-charcoal-700 flex items-start space-x-3">
        <Info className="w-5 h-5 text-marine-700 shrink-0 mt-0.5" />
        <div>
          <strong className="text-marine-900">Legal & Warning Authority Safeguard:</strong> PULSO operates strictly as a localized community information layer and does NOT issue independent tropical cyclone warnings, tsunami alerts, or evacuation orders. All warnings originate from PAGASA, PHIVOLCS, NDRRMC, and authorized local chief executives.
        </div>
      </div>
    </div>
  );
};
