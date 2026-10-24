import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Sprout,
  Anchor,
  TrendingDown,
  ShieldAlert,
  Coins,
  MapPin,
  Clock,
  ExternalLink,
  Info
} from 'lucide-react';

export const LivelihoodModule: React.FC = () => {
  const { reports, selectedMunicipalityFilter, setSelectedMunicipalityFilter } = useApp();
  const [activeTab, setActiveTab] = useState<'agriculture' | 'fisheries'>('agriculture');

  // Filter reports
  const agriReports = reports.filter(
    (r) =>
      r.category === 'agriculture_damage' &&
      (selectedMunicipalityFilter === 'All' || r.municipality === selectedMunicipalityFilter)
  );

  const fisheriesReports = reports.filter(
    (r) =>
      r.category === 'fisheries_damage' &&
      (selectedMunicipalityFilter === 'All' || r.municipality === selectedMunicipalityFilter)
  );

  // Aggregate Agri Loss
  const totalAgriAreaHa = agriReports.reduce(
    (acc, r) => acc + (r.livelihoodDetails?.affectedAreaHa || 0),
    0
  );
  const totalAgriLossPhp = agriReports.reduce(
    (acc, r) => acc + (r.livelihoodDetails?.estimatedValueLossPhp || 0),
    0
  );

  // Aggregate Fisheries Loss
  const totalFisheriesLossPhp = fisheriesReports.reduce(
    (acc, r) => acc + (r.livelihoodDetails?.estimatedValueLossPhp || 0),
    0
  );
  const totalBoatsDamaged = fisheriesReports.filter(
    (r) => r.livelihoodDetails?.boatType === 'motorized' || r.livelihoodDetails?.boatType === 'non_motorized'
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2 text-forest-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Sprout className="w-4 h-4" />
            <span>Small-Island Economic Resilience</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-marine-900">
            Agriculture & Fisheries Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-600 mt-0.5">
            Tracking post-disaster damage to Marinduque’s key livelihood commodities: Coconut/Copra, Palay, Bananas, and Coastal Bancas.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-sand-200 p-1 rounded-xl border border-sand-300">
          <button
            onClick={() => setActiveTab('agriculture')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'agriculture'
                ? 'bg-forest-700 text-white shadow-sm'
                : 'text-charcoal-700 hover:text-marine-900'
            }`}
          >
            <Sprout className="w-4 h-4" />
            <span>Agriculture & Crops ({agriReports.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('fisheries')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'fisheries'
                ? 'bg-marine-800 text-white shadow-sm'
                : 'text-charcoal-700 hover:text-marine-900'
            }`}
          >
            <Anchor className="w-4 h-4" />
            <span>Fisheries & Boats ({fisheriesReports.length})</span>
          </button>
        </div>
      </div>

      {/* Safety Notice regarding Sailing / Marine Operations */}
      <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 mb-6 text-xs text-amber-900 flex items-start space-x-3">
        <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <strong>Marine Safety Deference Safeguard:</strong> PULSO does <em>NOT</em> declare whether it is "safe to fish" or "safe to sail". Under Gale Warning conditions (PAGASA TCWS Signal No. 2), all coastal fisherfolk and small motorbancas must defer to official Philippine Coast Guard (PCG) and MDRRMO sea travel advisories.
        </div>
      </div>

      {activeTab === 'agriculture' ? (
        <div className="space-y-6">
          {/* Agri Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-sand-300 rounded-xl p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-charcoal-500 uppercase tracking-wider">
                Total Reported Crop Area Impacted
              </span>
              <div className="text-2xl font-display font-extrabold text-forest-700 mt-1">
                {totalAgriAreaHa.toFixed(1)} <span className="text-sm font-normal text-charcoal-600">hectares</span>
              </div>
              <p className="text-[11px] text-charcoal-500 mt-1">
                Across {agriReports.length} reported farming sitios in Marinduque
              </p>
            </div>

            <div className="bg-white border border-sand-300 rounded-xl p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-charcoal-500 uppercase tracking-wider">
                Estimated Crop Loss (PHP)
              </span>
              <div className="text-2xl font-display font-extrabold text-coral-600 mt-1">
                ₱{totalAgriLossPhp.toLocaleString()}
              </div>
              <p className="text-[11px] text-charcoal-500 mt-1">
                Subject to formal Municipal Agriculture Office (MAO) validation
              </p>
            </div>

            <div className="bg-white border border-sand-300 rounded-xl p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-charcoal-500 uppercase tracking-wider">
                Key Affected Commodities
              </span>
              <div className="text-sm font-bold text-marine-900 mt-1">
                Coconut / Copra, Palay (Rice), Banana
              </div>
              <p className="text-[11px] text-charcoal-500 mt-1">
                High-value provincial agricultural livelihood anchors
              </p>
            </div>
          </div>

          {/* Agri Reports List */}
          <div className="bg-white rounded-xl shadow-sm border border-sand-200 overflow-hidden">
            <div className="p-4 bg-sand-100 border-b border-sand-200 font-bold text-xs text-marine-900 flex justify-between items-center">
              <span>Farm Damage Reports</span>
              <span className="font-normal text-charcoal-600">
                PULSO Livelihood Assessment Pipeline
              </span>
            </div>

            {agriReports.length === 0 ? (
              <div className="p-8 text-center text-xs text-charcoal-500">
                No agricultural damage reports for this selection.
              </div>
            ) : (
              <div className="divide-y divide-sand-200">
                {agriReports.map((r) => (
                  <div key={r.id} className="p-4 hover:bg-sand-50 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-forest-700 bg-forest-50 border border-forest-200 px-2 py-0.5 rounded">
                          {r.referenceNumber}
                        </span>
                        <span className="font-bold text-xs text-marine-900">
                          {r.livelihoodDetails?.cropType || 'Agricultural Crop'}
                        </span>
                        <span className="text-xs text-charcoal-500">
                          &bull; {r.barangay}, {r.municipality} ({r.sitioOrLandmark})
                        </span>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded capitalize">
                        {r.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-charcoal-700 mb-2 leading-relaxed">{r.description}</p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-sand-50 p-2 rounded border border-sand-200 text-charcoal-700">
                      <div>Area: <strong>{r.livelihoodDetails?.affectedAreaHa || 'N/A'} ha</strong></div>
                      <div>Est. Loss: <strong>₱{(r.livelihoodDetails?.estimatedValueLossPhp || 0).toLocaleString()}</strong></div>
                      <div>Reporter: <strong>{r.reporterName}</strong></div>
                      <div>Date: <strong>{r.observationTime}</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Fisheries Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-sand-300 rounded-xl p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-charcoal-500 uppercase tracking-wider">
                Reported Damaged Fishing Bancas
              </span>
              <div className="text-2xl font-display font-extrabold text-marine-800 mt-1">
                {totalBoatsDamaged} <span className="text-sm font-normal text-charcoal-600">vessels</span>
              </div>
              <p className="text-[11px] text-charcoal-500 mt-1">
                Motorized and non-motorized artisanal fishing boats
              </p>
            </div>

            <div className="bg-white border border-sand-300 rounded-xl p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-charcoal-500 uppercase tracking-wider">
                Estimated Gear & Boat Loss (PHP)
              </span>
              <div className="text-2xl font-display font-extrabold text-coral-600 mt-1">
                ₱{totalFisheriesLossPhp.toLocaleString()}
              </div>
              <p className="text-[11px] text-charcoal-500 mt-1">
                Boat hulls, outriggers, engines, and gill nets
              </p>
            </div>

            <div className="bg-white border border-sand-300 rounded-xl p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-charcoal-500 uppercase tracking-wider">
                Coastal Landing Site Status
              </span>
              <div className="text-sm font-bold text-coral-600 mt-1">
                High Swell Alert Active
              </div>
              <p className="text-[11px] text-charcoal-500 mt-1">
                Cawit, Balanacan, and Poctoy shores on standby
              </p>
            </div>
          </div>

          {/* Fisheries Reports List */}
          <div className="bg-white rounded-xl shadow-sm border border-sand-200 overflow-hidden">
            <div className="p-4 bg-sand-100 border-b border-sand-200 font-bold text-xs text-marine-900 flex justify-between items-center">
              <span>Boat & Gear Damage Reports</span>
              <span className="font-normal text-charcoal-600">
                Coastal Community Verification Queue
              </span>
            </div>

            {fisheriesReports.length === 0 ? (
              <div className="p-8 text-center text-xs text-charcoal-500">
                No fisheries damage reports recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-sand-200">
                {fisheriesReports.map((r) => (
                  <div key={r.id} className="p-4 hover:bg-sand-50 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-marine-800 bg-marine-50 border border-marine-200 px-2 py-0.5 rounded">
                          {r.referenceNumber}
                        </span>
                        <span className="font-bold text-xs text-marine-900 capitalize">
                          {r.livelihoodDetails?.boatType?.replace(/_/g, ' ') || 'Fishing Vessel / Gear'}
                        </span>
                        <span className="text-xs text-charcoal-500">
                          &bull; {r.barangay}, {r.municipality} ({r.sitioOrLandmark})
                        </span>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded capitalize">
                        {r.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-charcoal-700 mb-2 leading-relaxed">{r.description}</p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] bg-sand-50 p-2 rounded border border-sand-200 text-charcoal-700">
                      <div>Est. Loss: <strong>₱{(r.livelihoodDetails?.estimatedValueLossPhp || 0).toLocaleString()}</strong></div>
                      <div>Reporter: <strong>{r.reporterName}</strong></div>
                      <div>Date: <strong>{r.observationTime}</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
