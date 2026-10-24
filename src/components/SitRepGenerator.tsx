import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MUNICIPALITIES } from '../data/marinduqueData';
import {
  FileText,
  Printer,
  Download,
  CheckCircle,
  AlertTriangle,
  Building,
  Sprout,
  Anchor,
  Clock,
  ShieldCheck,
  Info
} from 'lucide-react';

export const SitRepGenerator: React.FC = () => {
  const { reports, facilities, advisories, currentUser, selectedMunicipalityFilter } = useApp();

  const [sitrepNumber, setSitrepNumber] = useState('SITREP-2026-004');
  const [preparedBy, setPreparedBy] = useState(currentUser.name);
  const [reviewedBy, setReviewedBy] = useState('Gov. Presbitero J. Velasco Jr. / PDRRMC Chair');
  const [remarks, setRemarks] = useState(
    'All Barangay DRRMCs placed on Red Alert status. Pre-emptive evacuation completed in coastal Cawit and Laylay.'
  );

  const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

  // Filtered reports
  const scopeReports = reports.filter(
    (r) => selectedMunicipalityFilter === 'All' || r.municipality === selectedMunicipalityFilter
  );

  const verifiedReports = scopeReports.filter((r) => r.status === 'verified' || r.status === 'assigned' || r.status === 'resolved');
  const unverifiedReports = scopeReports.filter((r) => r.status === 'received' || r.status === 'under_verification' || r.status === 'queued_offline');

  // Breakdown by category
  const categoryCounts = scopeReports.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Evacuee numbers
  const totalEvacuees = facilities.reduce((acc, f) => acc + (f.type === 'evacuation_center' ? f.currentOccupancy : 0), 0);
  const activeEvacCenters = facilities.filter((f) => f.type === 'evacuation_center' && f.currentOccupancy > 0).length;

  // Livelihood loss
  const totalAgriHectares = scopeReports
    .filter((r) => r.category === 'agriculture_damage')
    .reduce((acc, r) => acc + (r.livelihoodDetails?.affectedAreaHa || 0), 0);

  const totalBoatsDamaged = scopeReports
    .filter((r) => r.category === 'fisheries_damage')
    .reduce((acc, r) => acc + 1, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['Reference', 'Category', 'Municipality', 'Barangay', 'Sitio', 'Urgency', 'Status', 'ObservationTime', 'Description'];
    const rows = scopeReports.map((r) => [
      r.referenceNumber,
      r.category,
      r.municipality,
      r.barangay,
      `"${r.sitioOrLandmark.replace(/"/g, '""')}"`,
      r.urgency,
      r.status,
      r.observationTime,
      `"${r.description.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PULSO_${selectedMunicipalityFilter}_SitRep_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Top Controls Bar (hidden during print) */}
      <div className="print:hidden bg-white rounded-xl shadow-sm border border-sand-200 p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-coral-600 font-bold text-xs uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>Official DRRM Reporting Protocol</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-display font-extrabold text-marine-900">
            Situation Report (SitRep) Generator
          </h1>
          <p className="text-xs text-charcoal-600 mt-0.5">
            Auto-synthesize verified ground data into an NDRRMC/PDRRMC standard format with human-in-the-loop audit fields.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 py-2 px-3 bg-sand-100 hover:bg-sand-200 text-marine-900 border border-sand-300 font-bold text-xs rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 py-2 px-4 bg-marine-900 hover:bg-marine-800 text-white font-bold text-xs rounded-lg transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Printable SitRep Document (Styled for professional A4 print) */}
      <div className="bg-white border border-sand-300 rounded-xl shadow-md p-6 sm:p-10 font-sans text-charcoal-900 print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="text-center border-b-2 border-marine-900 pb-5 mb-6">
          <div className="flex items-center justify-center space-x-3 mb-2">
            <img src="/logo.svg" alt="PULSO" className="w-10 h-10" />
            <div>
              <div className="text-xs uppercase font-extrabold text-marine-900 tracking-wider">
                Republic of the Philippines &bull; MIMAROPA Region
              </div>
              <div className="text-sm font-bold text-marine-800">
                PROVINCIAL DISASTER RISK REDUCTION AND MANAGEMENT COUNCIL
              </div>
              <div className="text-[11px] text-charcoal-600">
                Province of Marinduque &mdash; Operations Center (OpCen)
              </div>
            </div>
          </div>

          <div className="mt-4">
            <span className="font-mono text-xs font-bold bg-sand-100 border border-sand-300 px-3 py-1 rounded">
              {sitrepNumber}
            </span>
            <h2 className="text-xl sm:text-2xl font-display font-extrabold text-marine-900 mt-2">
              DISASTER SITUATION & LIVELIHOOD INTELLIGENCE REPORT
            </h2>
            <div className="text-xs text-charcoal-600 mt-1">
              Coverage: <strong>{selectedMunicipalityFilter === 'All' ? 'Province of Marinduque (All Municipalities)' : selectedMunicipalityFilter}</strong> &bull; Generated: {nowStr} PHT
            </div>
          </div>
        </div>

        {/* 1. Executive Summary & Alert Status */}
        <div className="mb-6">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-marine-900 bg-sand-100 p-2 rounded border border-sand-200 mb-2">
            1. Executive Summary & Synoptic Status
          </h3>
          <p className="text-xs leading-relaxed text-charcoal-800 mb-3">
            PAGASA has placed Marinduque under <strong>Tropical Cyclone Wind Signal (TCWS) No. 2</strong>. Over the last 24 hours, local monitoring through the PULSO system logged a total of <strong>{scopeReports.length} community incident reports</strong> across monitored barangays. <strong>{verifiedReports.length}</strong> reports have undergone official human verification by designated Barangay and Municipal DRRM officers, while <strong>{unverifiedReports.length}</strong> remain in the verification pipeline.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
            <div className="bg-sand-50 border border-sand-200 p-3 rounded-lg">
              <span className="text-[10px] text-charcoal-500 uppercase font-semibold">Total Reports</span>
              <div className="text-xl font-bold text-marine-900 mt-0.5">{scopeReports.length}</div>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg">
              <span className="text-[10px] text-emerald-800 uppercase font-semibold">Human-Verified</span>
              <div className="text-xl font-bold text-emerald-700 mt-0.5">{verifiedReports.length}</div>
            </div>
            <div className="bg-sky-50 border border-sky-200 p-3 rounded-lg">
              <span className="text-[10px] text-sky-800 uppercase font-semibold">Displaced In Evac</span>
              <div className="text-xl font-bold text-sky-700 mt-0.5">{totalEvacuees} persons</div>
            </div>
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
              <span className="text-[10px] text-amber-800 uppercase font-semibold">Agri Area Damaged</span>
              <div className="text-xl font-bold text-amber-700 mt-0.5">{totalAgriHectares.toFixed(1)} ha</div>
            </div>
          </div>
        </div>

        {/* 2. Verified Incidents vs Unverified Observations Table */}
        <div className="mb-6">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-marine-900 bg-sand-100 p-2 rounded border border-sand-200 mb-2">
            2. Verified Ground Incidents (Traceable Records)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-sand-200">
              <thead className="bg-sand-50 text-marine-900 font-bold border-b border-sand-300">
                <tr>
                  <th className="p-2 border-r border-sand-200">Ref #</th>
                  <th className="p-2 border-r border-sand-200">Location</th>
                  <th className="p-2 border-r border-sand-200">Category</th>
                  <th className="p-2 border-r border-sand-200">Verified Ground Situation</th>
                  <th className="p-2 border-r border-sand-200">Assigned Unit</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-200">
                {verifiedReports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-charcoal-500">
                      No verified incidents currently recorded for this jurisdiction.
                    </td>
                  </tr>
                ) : (
                  verifiedReports.map((r) => (
                    <tr key={r.id} className="hover:bg-sand-50/50">
                      <td className="p-2 font-mono font-bold text-coral-600 border-r border-sand-200 whitespace-nowrap">
                        {r.referenceNumber}
                      </td>
                      <td className="p-2 border-r border-sand-200 whitespace-nowrap">
                        {r.barangay}, {r.municipality}
                      </td>
                      <td className="p-2 border-r border-sand-200 capitalize whitespace-nowrap font-semibold">
                        {r.category.replace(/_/g, ' ')}
                      </td>
                      <td className="p-2 border-r border-sand-200 text-charcoal-700 leading-snug">
                        {r.description}
                        {r.verification?.internalNotes && (
                          <div className="text-[10px] text-emerald-800 font-semibold mt-0.5">
                            Note: {r.verification.internalNotes}
                          </div>
                        )}
                      </td>
                      <td className="p-2 border-r border-sand-200 text-[11px] text-charcoal-600">
                        {r.assignment?.assignedTo || 'BDRRMC Standby'}
                      </td>
                      <td className="p-2 font-bold uppercase text-[10px]">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Livelihood Assessment Breakdown */}
        <div className="mb-6">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-marine-900 bg-sand-100 p-2 rounded border border-sand-200 mb-2">
            3. Agricultural and Coastal Livelihood Impacts
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="border border-forest-200 rounded-lg p-3 bg-forest-50/40">
              <div className="font-bold text-forest-800 mb-1 flex items-center space-x-1.5">
                <Sprout className="w-4 h-4 text-forest-600" />
                <span>Agricultural Crops & Coconut Trees</span>
              </div>
              <ul className="list-disc list-inside text-charcoal-700 space-y-1 text-[11px]">
                <li>Reported Affected Area: <strong>{totalAgriHectares.toFixed(1)} hectares</strong></li>
                <li>Primary Commodities: Coconut palms uprooted in upland groves; palay fields inundated in Boac river basin.</li>
                <li>Action: Municipal Agriculture Office (MAO) dispatching validation teams for seed and fertilizer input assistance requests.</li>
              </ul>
            </div>

            <div className="border border-sky-200 rounded-lg p-3 bg-sky-50/40">
              <div className="font-bold text-sky-800 mb-1 flex items-center space-x-1.5">
                <Anchor className="w-4 h-4 text-sky-600" />
                <span>Fisherfolk & Coastal Bancas</span>
              </div>
              <ul className="list-disc list-inside text-charcoal-700 space-y-1 text-[11px]">
                <li>Damaged Vessels: <strong>{totalBoatsDamaged} bancas</strong> reported damaged by tidal surges.</li>
                <li>Seaport Status: Balanacan Port and Cawit Port closed to small seacraft per Coast Guard Gale Advisory.</li>
                <li>Action: Fisherfolk advised to haul light craft 50 meters inland past high-water mark.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 4. Priority Humanitarian & Material Assistance Needs */}
        <div className="mb-8">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-marine-900 bg-sand-100 p-2 rounded border border-sand-200 mb-2">
            4. Immediate Assistance & Relief Requirements
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 border border-sand-200 rounded bg-sand-50">
              <div className="font-bold text-marine-900">Family Food Packs</div>
              <div className="text-sm font-extrabold text-coral-600 mt-0.5">350 packs</div>
              <div className="text-[10px] text-charcoal-500">For Cawit & Laylay evacuees</div>
            </div>
            <div className="p-2.5 border border-sand-200 rounded bg-sand-50">
              <div className="font-bold text-marine-900">Potable Water Jugs</div>
              <div className="text-sm font-extrabold text-sky-600 mt-0.5">500 units (5-gal)</div>
              <div className="text-[10px] text-charcoal-500">Turbidity in shallow wells</div>
            </div>
            <div className="p-2.5 border border-sand-200 rounded bg-sand-50">
              <div className="font-bold text-marine-900">GI Sheets / Tarpaulins</div>
              <div className="text-sm font-extrabold text-amber-600 mt-0.5">180 sheets</div>
              <div className="text-[10px] text-charcoal-500">For wind-damaged roofs</div>
            </div>
            <div className="p-2.5 border border-sand-200 rounded bg-sand-50">
              <div className="font-bold text-marine-900">Emergency Fuel (Diesel)</div>
              <div className="text-sm font-extrabold text-emerald-600 mt-0.5">800 liters</div>
              <div className="text-[10px] text-charcoal-500">For hospital & evac generators</div>
            </div>
          </div>
        </div>

        {/* Signatures & Approvals (Formal LGU protocol) */}
        <div className="pt-6 border-t-2 border-sand-300 grid grid-cols-2 gap-8 text-xs">
          <div>
            <div className="text-charcoal-500 text-[10px] uppercase font-semibold">Prepared By:</div>
            <div className="font-bold text-marine-900 mt-3 border-b border-charcoal-400 pb-1 inline-block min-w-[200px]">
              {preparedBy}
            </div>
            <div className="text-[11px] text-charcoal-600">
              PULSO System Operator &bull; {currentUser.agencyOrOffice}
            </div>
          </div>

          <div>
            <div className="text-charcoal-500 text-[10px] uppercase font-semibold">Reviewed & Approved For Release:</div>
            <div className="font-bold text-marine-900 mt-3 border-b border-charcoal-400 pb-1 inline-block min-w-[200px]">
              {reviewedBy}
            </div>
            <div className="text-[11px] text-charcoal-600">
              Provincial Disaster Risk Reduction & Management Council
            </div>
          </div>
        </div>

        <div className="mt-8 pt-3 border-t border-sand-200 text-center text-[10px] text-charcoal-400">
          Generated via PULSO (Disaster Preparedness, Resilience, and Livelihood Intelligence System for Marinduque) &bull; Page 1 of 1
        </div>
      </div>
    </div>
  );
};
