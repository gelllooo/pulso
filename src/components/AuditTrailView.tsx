import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import {
  History,
  Shield,
  Search,
  Filter,
  CheckCircle,
  Clock,
  ArrowRight,
} from "lucide-react";

export const AuditTrailView: React.FC = () => {
  const { auditEvents } = useApp();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredEvents = auditEvents.filter((ev) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      ev.reportId.toLowerCase().includes(term) ||
      ev.actor.toLowerCase().includes(term) ||
      ev.action.toLowerCase().includes(term) ||
      ev.notes.toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2 text-coral-600 font-bold text-xs uppercase tracking-wider mb-1">
            <History className="w-4 h-4" />
            <span>Traceability, Governance & Accountability</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-marine-900">
            Immutable Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-600 mt-0.5">
            Every submission, verification decision, assignment, status
            transition, and offline synchronization attempt is permanently
            timestamped.
          </p>
        </div>

        <div className="bg-sand-100 border border-sand-300 rounded-lg px-3 py-2 text-xs text-marine-900">
          Total Logged Events: <strong>{auditEvents.length}</strong>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white rounded-xl shadow-sm border border-sand-200 p-3 mb-6">
        <div className="relative">
          <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Report ID, actor name, or action (e.g., REP-001, Madrigal, Sync)..."
            className="w-full bg-sand-50 border border-sand-300 rounded-lg pl-9 pr-3 py-2 text-xs focus:ring-1 focus:ring-marine-800 focus:outline-none"
          />
        </div>
      </div>

      {/* Events Timeline */}
      <div className="bg-white rounded-xl shadow-sm border border-sand-200 overflow-hidden">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-xs text-charcoal-500">
            No audit records match your search.
          </div>
        ) : (
          <div className="divide-y divide-sand-200">
            {filteredEvents.map((ev) => (
              <div
                key={ev.id}
                className="p-4 hover:bg-sand-50/70 transition-colors text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-[11px] font-bold text-marine-900 bg-sand-100 border border-sand-300 px-2 py-0.5 rounded">
                      {ev.id}
                    </span>
                    <span className="font-bold text-marine-900 text-xs">
                      {ev.action}
                    </span>
                    <span className="text-charcoal-500 text-[11px]">
                      &bull; Ref Target: <strong>{ev.reportId}</strong>
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-[11px] text-charcoal-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{ev.timestamp}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 my-2 text-[11px]">
                  <span className="text-charcoal-500">Status Transition:</span>
                  <span className="font-mono bg-sand-100 px-2 py-0.5 rounded text-charcoal-700">
                    {ev.previousStatus}
                  </span>
                  <ArrowRight className="w-3 h-3 text-charcoal-400" />
                  <span className="font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                    {ev.newStatus}
                  </span>
                </div>

                <div className="text-charcoal-700 bg-sand-50 p-2.5 rounded border border-sand-200 text-xs leading-relaxed">
                  {ev.notes}
                </div>

                <div className="mt-2 text-[10px] text-charcoal-400">
                  Authorized Actor: <strong>{ev.actor}</strong> (
                  {ev.actorRole.replace(/_/g, " ")})
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
