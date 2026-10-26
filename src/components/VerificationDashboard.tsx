import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { IncidentReport, ReportStatus, VerificationBasis } from '../types';
import { MUNICIPALITIES } from '../data/marinduqueData';
import {
  FileCheck2,
  Shield,
  CheckCircle,
  XCircle,
  Copy,
  Send,
  AlertTriangle,
  Clock,
  Filter,
  UserCheck,
  ChevronRight,
  History
} from 'lucide-react';

export const VerificationDashboard: React.FC = () => {
  const {
    reports,
    currentUser,
    verifyReport,
    assignReport,
    updateReportStatus,
    selectedMunicipalityFilter,
    setSelectedMunicipalityFilter,
    setActiveTab
  } = useApp();

  const [selectedReportId, setSelectedReportId] = useState<string | null>(
    reports.length > 0 ? reports[0].id : null
  );

  // Form states for verification
  const [basis, setBasis] = useState<VerificationBasis>('field_check');
  const [confidence, setConfidence] = useState<'low' | 'medium' | 'high'>('high');
  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe' | 'critical'>('moderate');
  const [internalNotes, setInternalNotes] = useState('');
  const [publicUpdate, setPublicUpdate] = useState('');
  const [duplicateOfId, setDuplicateOfId] = useState('');

  // Form states for assignment
  const [assignedTo, setAssignedTo] = useState('MDRRMO Quick Response Team 1');
  const [assignedOffice, setAssignedOffice] = useState('Boac MDRRMO');
  const [actionRequired, setActionRequired] = useState('Inspect site and deploy barrier/relief equipment.');

  // Resolution note state
  const [resolutionNotes, setResolutionNotes] = useState('');

  const [filterStatus, setFilterStatus] = useState<string>('All');

  const filteredReports = reports.filter((r) => {
    if (selectedMunicipalityFilter !== 'All' && r.municipality !== selectedMunicipalityFilter) {
      return false;
    }
    if (filterStatus !== 'All' && r.status !== filterStatus) {
      return false;
    }
    return true;
  });

  const selectedReport = reports.find((r) => r.id === selectedReportId) || filteredReports[0];

  const handleVerify = async (isDuplicate: boolean = false) => {
    if (!selectedReport) return;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    await verifyReport(selectedReport.id, {
      verifierName: currentUser.name,
      verifierRole: currentUser.role,
      verifierOffice: currentUser.agencyOrOffice || 'Disaster Council',
      verifiedAt: nowStr,
      basis,
      confidence,
      severityAssessment: severity,
      internalNotes: internalNotes.trim() || 'Verified as authentic incident.',
      publicUpdate: publicUpdate.trim() || undefined,
      duplicateOfId: isDuplicate ? duplicateOfId.trim() || 'Earlier incident' : undefined
    });

    setInternalNotes('');
    setPublicUpdate('');
  };

  const handleAssign = async () => {
    if (!selectedReport) return;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    await assignReport(selectedReport.id, {
      assignedTo,
      assignedOffice,
      assignedAt: nowStr,
      actionRequired: actionRequired.trim()
    });
  };

  const handleStatusChange = async (newStatus: ReportStatus) => {
    if (!selectedReport) return;
    await updateReportStatus(
      selectedReport.id,
      newStatus,
      resolutionNotes.trim() || `Marked as ${newStatus} by ${currentUser.name}`
    );
    setResolutionNotes('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2 text-coral-600 font-bold text-xs uppercase tracking-wider mb-1">
            <FileCheck2 className="w-4 h-4" />
            <span>Operational Incident Verification & Triage</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-marine-900">
            Disaster Coordination & Verification Hub
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-600 mt-0.5">
            Human-in-the-loop review workflow: verify community reports, assign response units, and preserve traceability.
          </p>
        </div>

        {/* Current Verifier Identity Badge */}
        <div className="bg-sand-100 border border-sand-300 rounded-lg p-2.5 text-xs text-marine-900 flex items-center space-x-2.5">
          <UserCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <div>
            <div className="font-bold text-xs">{currentUser.name}</div>
            <div className="text-[11px] text-charcoal-600">
              Role: <strong className="capitalize">{currentUser.role.replace(/_/g, ' ')}</strong> &bull; {currentUser.agencyOrOffice}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-sand-200 p-3 mb-6 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center space-x-1.5 font-semibold text-charcoal-600">
          <Filter className="w-3.5 h-3.5 text-marine-900" />
          <span>Queue Filter:</span>
        </div>

        <select
          value={selectedMunicipalityFilter}
          onChange={(e) => setSelectedMunicipalityFilter(e.target.value as any)}
          className="bg-sand-50 border border-sand-300 rounded px-2.5 py-1 text-xs font-semibold text-marine-900"
        >
          <option value="All">All Municipalities</option>
          {MUNICIPALITIES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-sand-50 border border-sand-300 rounded px-2.5 py-1 text-xs text-charcoal-800"
        >
          <option value="All">All Statuses</option>
          <option value="received">Needs Verification (Received)</option>
          <option value="under_verification">Under Verification</option>
          <option value="verified">Verified</option>
          <option value="assigned">Assigned</option>
          <option value="resolved">Resolved</option>
          <option value="pending_sync">Pending Server Sync</option>
          <option value="queued_offline">Offline Queue</option>
        </select>

        <span className="ml-auto text-xs text-charcoal-500 font-medium">
          Showing <strong>{filteredReports.length}</strong> incidents in queue
        </span>
      </div>

      {/* Main Grid: Left List (Triage) | Right Detail & Action Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Incident Queue */}
        <div className="lg:col-span-5 space-y-3 max-h-[750px] overflow-y-auto pr-1">
          {filteredReports.length === 0 ? (
            <div className="bg-white rounded-xl border border-sand-200 p-8 text-center text-xs text-charcoal-500">
              No reports match the current filter.
            </div>
          ) : (
            filteredReports.map((r) => {
              const isSelected = selectedReport?.id === r.id;
              const isUrgent = r.urgency === 'immediate_danger' || r.urgency === 'urgent';

              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedReportId(r.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-marine-50/70 border-marine-900 ring-2 ring-marine-900/10 shadow-sm'
                      : 'bg-white border-sand-200 hover:border-sand-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[11px] font-bold text-coral-600 bg-sand-100 px-1.5 py-0.5 rounded">
                      {r.referenceNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        r.status === 'verified'
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.status === 'assigned'
                          ? 'bg-sky-100 text-sky-800'
                          : r.status === 'resolved'
                          ? 'bg-slate-200 text-slate-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {r.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <h3 className="font-bold text-xs text-marine-900 capitalize mb-1">
                    {r.category.replace(/_/g, ' ')}
                  </h3>

                  <div className="text-[11px] text-charcoal-600 mb-2">
                    📍 {r.barangay}, {r.municipality} ({r.sitioOrLandmark})
                  </div>

                  <p className="text-xs text-charcoal-700 line-clamp-2 leading-relaxed">
                    {r.description}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-sand-200 flex items-center justify-between text-[10px] text-charcoal-500">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{r.reportedTime}</span>
                    </span>
                    <span
                      className={`font-semibold ${
                        isUrgent ? 'text-coral-600' : 'text-charcoal-600'
                      }`}
                    >
                      Urgency: {r.urgency.toUpperCase()}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Selected Report Review & Workflow Actions */}
        <div className="lg:col-span-7">
          {selectedReport ? (
            <div className="bg-white rounded-xl shadow-md border border-sand-200 p-5 sm:p-6 space-y-6">
              {/* Dossier Header */}
              <div className="border-b border-sand-200 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-coral-600 bg-sand-100 px-2 py-0.5 rounded">
                    {selectedReport.referenceNumber}
                  </span>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-charcoal-500">Urgency:</span>
                    <span className="font-bold uppercase text-coral-600 px-2 py-0.5 bg-coral-50 rounded border border-coral-200">
                      {selectedReport.urgency.replace(/_/g, ' ')}
                    </span>
                    <span className="text-charcoal-500 ml-2">Status:</span>
                    <span className="font-bold uppercase text-marine-800 px-2 py-0.5 bg-sand-100 rounded border border-sand-300">
                      {selectedReport.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                <h2 className="text-lg sm:text-xl font-display font-bold text-marine-900 capitalize mt-1">
                  {selectedReport.category.replace(/_/g, ' ')}
                </h2>
                <p className="text-xs text-charcoal-600 mt-0.5">
                  📍 <strong>{selectedReport.barangay}, {selectedReport.municipality}</strong> &mdash; Sitio/Landmark: {selectedReport.sitioOrLandmark}
                  <span className="ml-2 text-charcoal-400">({selectedReport.lat.toFixed(4)}° N, {selectedReport.lng.toFixed(4)}° E)</span>
                </p>
              </div>

              {/* Observation Content */}
              <div>
                <h4 className="text-xs font-bold uppercase text-charcoal-500 mb-1">
                  Reported Observation
                </h4>
                <div className="bg-sand-50 border border-sand-200 rounded-lg p-3 text-xs text-charcoal-800 leading-relaxed">
                  {selectedReport.description}
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between text-[11px] text-charcoal-500">
                  <span>
                    Reported by: <strong>{selectedReport.reporterName || 'Anonymous Community Member'}</strong>{' '}
                    ({selectedReport.reporterRole})
                  </span>
                  <span>Contact: {selectedReport.reporterContact || 'Not provided / Protected'}</span>
                </div>
              </div>

              {/* Livelihood Details if present */}
              {selectedReport.livelihoodDetails && (
                <div className="bg-forest-50/70 border border-forest-300/60 rounded-lg p-3 text-xs">
                  <h4 className="font-bold text-forest-800 uppercase text-[11px] mb-1">
                    Livelihood & Economic Asset Impact
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-forest-900 mt-1">
                    {selectedReport.livelihoodDetails.cropType && (
                      <div>
                        <span className="text-forest-600">Crop:</span> <strong>{selectedReport.livelihoodDetails.cropType}</strong>
                      </div>
                    )}
                    {selectedReport.livelihoodDetails.affectedAreaHa && (
                      <div>
                        <span className="text-forest-600">Area:</span> <strong>{selectedReport.livelihoodDetails.affectedAreaHa} ha</strong>
                      </div>
                    )}
                    {selectedReport.livelihoodDetails.boatType && (
                      <div>
                        <span className="text-forest-600">Gear:</span> <strong>{selectedReport.livelihoodDetails.boatType}</strong>
                      </div>
                    )}
                    {selectedReport.livelihoodDetails.estimatedValueLossPhp && (
                      <div>
                        <span className="text-forest-600">Loss Est:</span> <strong>₱{selectedReport.livelihoodDetails.estimatedValueLossPhp.toLocaleString()}</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Existing Verification / Assignment Record */}
              {selectedReport.verification && (
                <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-3 text-xs text-emerald-900">
                  <div className="font-bold flex items-center space-x-1.5 mb-1">
                    <CheckCircle className="w-4 h-4 text-emerald-700" />
                    <span>Verified by {selectedReport.verification.verifierName} ({selectedReport.verification.verifierOffice})</span>
                  </div>
                  <div className="text-[11px] space-y-0.5">
                    <div>Basis: <strong>{selectedReport.verification.basis}</strong> | Confidence: <strong>{selectedReport.verification.confidence.toUpperCase()}</strong> | Time: {selectedReport.verification.verifiedAt}</div>
                    {selectedReport.verification.internalNotes && (
                      <div>Internal Notes: {selectedReport.verification.internalNotes}</div>
                    )}
                    {selectedReport.verification.publicUpdate && (
                      <div className="text-emerald-800 font-medium">Public Broadcast: "{selectedReport.verification.publicUpdate}"</div>
                    )}
                  </div>
                </div>
              )}

              {/* ACTION 1: Verification Form (If received or under verification) */}
              <div className="border border-sand-300 rounded-xl p-4 bg-sand-50/50 space-y-3">
                <h4 className="font-display font-bold text-xs text-marine-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <Shield className="w-4 h-4 text-marine-800" />
                  <span>Action Step 1: Verification & Triage</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">
                      Verification Basis
                    </label>
                    <select
                      value={basis}
                      onChange={(e) => setBasis(e.target.value as any)}
                      className="w-full bg-white border border-sand-300 rounded p-1.5 text-xs"
                    >
                      <option value="field_check">Physical Field Check</option>
                      <option value="phone_confirmation">Phone / Radio Confirmation</option>
                      <option value="second_report">Corroborated by 2nd Report</option>
                      <option value="official_source">Official Agency Source</option>
                      <option value="photo_evidence">Verified Geotagged Photo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">
                      Confidence Level
                    </label>
                    <select
                      value={confidence}
                      onChange={(e) => setConfidence(e.target.value as any)}
                      className="w-full bg-white border border-sand-300 rounded p-1.5 text-xs font-semibold"
                    >
                      <option value="high">High Confidence (Confirmed)</option>
                      <option value="medium">Medium Confidence</option>
                      <option value="low">Low Confidence (Unverified)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">
                      Assessed Severity
                    </label>
                    <select
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value as any)}
                      className="w-full bg-white border border-sand-300 rounded p-1.5 text-xs"
                    >
                      <option value="mild">Mild (Localized disruption)</option>
                      <option value="moderate">Moderate (Needs team response)</option>
                      <option value="severe">Severe (Hazard to safety/livelihood)</option>
                      <option value="critical">Critical (Immediate danger)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">
                    Internal Verification Notes
                  </label>
                  <input
                    type="text"
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="e.g., Confirmed with Barangay Kagawad on site. River level gauge at 4.2m."
                    className="w-full bg-white border border-sand-300 rounded p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">
                    Public Update / Citizen Advice (Optional)
                  </label>
                  <input
                    type="text"
                    value={publicUpdate}
                    onChange={(e) => setPublicUpdate(e.target.value)}
                    placeholder="e.g., Road is closed to 4-wheel vehicles; use bypass route."
                    className="w-full bg-white border border-sand-300 rounded p-2 text-xs"
                  />
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => handleVerify(false)}
                    className="flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg transition-colors shadow-sm flex items-center justify-center space-x-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Confirm & Mark Verified</span>
                  </button>

                  <button
                    onClick={() => handleStatusChange('rejected')}
                    className="py-2 px-3 bg-sand-200 hover:bg-coral-100 text-coral-700 font-semibold text-xs rounded-lg transition-colors border border-sand-300 flex items-center space-x-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject / Invalid</span>
                  </button>

                  <button
                    onClick={() => handleVerify(true)}
                    className="py-2 px-3 bg-sand-200 hover:bg-sand-300 text-charcoal-700 font-semibold text-xs rounded-lg transition-colors border border-sand-300 flex items-center space-x-1"
                    title="Mark as duplicate of existing incident"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Mark Duplicate</span>
                  </button>
                </div>
              </div>

              {/* ACTION 2: Incident Assignment & Dispatch Directive */}
              <div className="border border-sand-300 rounded-xl p-4 bg-sand-50/50 space-y-3">
                <h4 className="font-display font-bold text-xs text-marine-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <Send className="w-4 h-4 text-marine-800" />
                  <span>Action Step 2: Assign Responsible Response Unit</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">
                      Assigned Team / Unit
                    </label>
                    <select
                      value={assignedTo}
                      onChange={(e) => setAssignedTo(e.target.value)}
                      className="w-full bg-white border border-sand-300 rounded p-1.5 text-xs font-semibold"
                    >
                      <option value="MDRRMO Quick Response Team">MDRRMO Quick Response Team</option>
                      <option value="Municipal Engineering & Heavy Equipment">Municipal Engineering & Clearing Crew</option>
                      <option value="Municipal Agriculture Office (MAO) Inspectors">Municipal Agriculture Office (MAO)</option>
                      <option value="Philippine Coast Guard / Bantay Dagat">Philippine Coast Guard / Bantay Dagat</option>
                      <option value="MARELCO Emergency Power Crew">MARELCO Emergency Line Crew</option>
                      <option value="Barangay Cawit DRRM Committee">Barangay BDRRMC Response Team</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">
                      Responsible Office
                    </label>
                    <input
                      type="text"
                      value={assignedOffice}
                      onChange={(e) => setAssignedOffice(e.target.value)}
                      className="w-full bg-white border border-sand-300 rounded p-1.5 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">
                    Directive / Action Required
                  </label>
                  <input
                    type="text"
                    value={actionRequired}
                    onChange={(e) => setActionRequired(e.target.value)}
                    placeholder="e.g., Deploy backhoe for clearing post; conduct farm damage validation."
                    className="w-full bg-white border border-sand-300 rounded p-2 text-xs"
                  />
                </div>

                <button
                  onClick={handleAssign}
                  className="py-2 px-4 bg-marine-900 hover:bg-marine-800 text-white font-bold text-xs rounded-lg transition-colors shadow-sm"
                >
                  Save Assignment & Directive
                </button>
              </div>

              {/* ACTION 3: Resolution & Closure */}
              <div className="border border-sand-300 rounded-xl p-4 bg-sand-50/50 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex-1 min-w-[220px]">
                  <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">
                    Resolution Note / Final Remarks
                  </label>
                  <input
                    type="text"
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="e.g., Debris cleared, road opened to traffic at 14:00."
                    className="w-full bg-white border border-sand-300 rounded p-1.5 text-xs"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-4">
                  <button
                    onClick={() => handleStatusChange('action_in_progress')}
                    className="py-2 px-3 bg-sky-700 hover:bg-sky-800 text-white font-semibold rounded-lg text-xs"
                  >
                    Action in Progress
                  </button>
                  <button
                    onClick={() => handleStatusChange('resolved')}
                    className="py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs"
                  >
                    Mark Resolved
                  </button>
                  <button
                    onClick={() => handleStatusChange('closed')}
                    className="py-2 px-3 bg-charcoal-800 hover:bg-charcoal-900 text-white font-bold rounded-lg text-xs"
                  >
                    Close Dossier
                  </button>
                </div>
              </div>

              {/* Link to Audit Trail */}
              <div className="pt-2 flex justify-between items-center text-xs text-charcoal-500">
                <span>All verification steps are permanently recorded in the immutable audit log.</span>
                <button
                  onClick={() => setActiveTab('audit')}
                  className="text-marine-800 hover:text-marine-900 font-bold underline flex items-center space-x-1"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Inspect Audit Events</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-sand-200 p-12 text-center text-xs text-charcoal-500">
              Select an incident from the queue to verify or assign.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
