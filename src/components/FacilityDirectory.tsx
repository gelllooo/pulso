import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MUNICIPALITIES } from '../data/marinduqueData';
import { Facility } from '../types';
import {
  Building,
  HeartPulse,
  Anchor,
  Phone,
  Check,
  X,
  Droplets,
  Zap,
  Radio,
  Search,
  Filter,
  Users,
  ShieldCheck
} from 'lucide-react';

export const FacilityDirectory: React.FC = () => {
  const { facilities, selectedMunicipalityFilter, setSelectedMunicipalityFilter, currentUser } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');

  const filteredFacilities = facilities.filter((f) => {
    if (selectedMunicipalityFilter !== 'All' && f.municipality !== selectedMunicipalityFilter) {
      return false;
    }
    if (typeFilter !== 'All' && f.type !== typeFilter) {
      return false;
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = f.name.toLowerCase().includes(term);
      const matchBgy = f.barangay.toLowerCase().includes(term);
      return matchName || matchBgy;
    }
    return true;
  });

  const totalCapacity = facilities.reduce((acc, f) => acc + (f.type === 'evacuation_center' ? f.capacity : 0), 0);
  const totalOccupancy = facilities.reduce((acc, f) => acc + (f.type === 'evacuation_center' ? f.currentOccupancy : 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2 text-coral-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Building className="w-4 h-4" />
            <span>Lifeline Infrastructure & Safe Havens</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-marine-900">
            Facility & Evacuation Center Directory
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-600 mt-0.5">
            Verified local facilities, emergency capacities, critical utilities (water/power), and seaport landing status.
          </p>
        </div>

        {/* Quick Capacity Meter Card */}
        <div className="bg-white border border-sand-300 rounded-xl p-3 shadow-sm flex items-center space-x-4 text-xs">
          <div>
            <div className="text-[11px] text-charcoal-500 font-semibold uppercase">Total Evacuation Load</div>
            <div className="text-lg font-bold text-marine-900">
              {totalOccupancy.toLocaleString()} / {totalCapacity.toLocaleString()} <span className="text-xs font-normal text-charcoal-500">persons</span>
            </div>
          </div>
          <div className="w-20 bg-sand-200 h-3 rounded-full overflow-hidden">
            <div
              className={`h-full ${
                (totalOccupancy / (totalCapacity || 1)) > 0.8 ? 'bg-coral-600' : 'bg-marine-700'
              }`}
              style={{ width: `${Math.min(100, (totalOccupancy / (totalCapacity || 1)) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-sand-200 p-4 mb-6 flex flex-wrap items-center gap-3 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search facility name or barangay (e.g., Moriones Arena, Cawit)..."
            className="w-full bg-sand-50 border border-sand-300 rounded-lg pl-9 pr-3 py-2 text-xs focus:ring-1 focus:ring-marine-800 focus:outline-none"
          />
        </div>

        <select
          value={selectedMunicipalityFilter}
          onChange={(e) => setSelectedMunicipalityFilter(e.target.value as any)}
          className="bg-sand-50 border border-sand-300 rounded-lg px-3 py-2 text-xs font-semibold text-marine-900 focus:outline-none"
        >
          <option value="All">All Municipalities</option>
          {MUNICIPALITIES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-sand-50 border border-sand-300 rounded-lg px-3 py-2 text-xs text-charcoal-800 focus:outline-none"
        >
          <option value="All">All Facility Types</option>
          <option value="evacuation_center">Evacuation Centers Only</option>
          <option value="hospital_health_center">Hospitals & Health Centers</option>
          <option value="seaport_landing">Seaports & Fish Landings</option>
        </select>
      </div>

      {/* Facility Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredFacilities.map((fac) => {
          const isEvac = fac.type === 'evacuation_center';
          const isHospital = fac.type === 'hospital_health_center';
          const isPort = fac.type === 'seaport_landing';
          const occupancyRate = fac.capacity > 0 ? (fac.currentOccupancy / fac.capacity) * 100 : 0;

          return (
            <div
              key={fac.id}
              className="bg-white rounded-xl shadow-sm border border-sand-200 hover:border-sand-300 transition-all p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      isEvac
                        ? 'bg-sky-100 text-sky-800'
                        : isHospital
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-teal-100 text-teal-800'
                    }`}
                  >
                    {fac.type.replace(/_/g, ' ')}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded capitalize ${
                      fac.operatingStatus === 'operational'
                        ? 'bg-emerald-100 text-emerald-800'
                        : fac.operatingStatus === 'at_capacity'
                        ? 'bg-coral-100 text-coral-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {fac.operatingStatus.replace(/_/g, ' ')}
                  </span>
                </div>

                <h3 className="font-display font-bold text-base text-marine-900 mb-1">
                  {fac.name}
                </h3>
                <div className="text-xs text-charcoal-600 mb-3">
                  📍 {fac.barangay}, {fac.municipality}
                </div>

                {/* Capacity Gauge if Evacuation Center */}
                {isEvac && (
                  <div className="bg-sand-50 border border-sand-200 rounded-lg p-2.5 mb-3 text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-charcoal-500 flex items-center space-x-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>Current Occupancy</span>
                      </span>
                      <span className="font-bold text-marine-900">
                        {fac.currentOccupancy} / {fac.capacity} ({occupancyRate.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-sand-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          occupancyRate > 90
                            ? 'bg-coral-600'
                            : occupancyRate > 60
                            ? 'bg-amber-500'
                            : 'bg-emerald-600'
                        }`}
                        style={{ width: `${Math.min(100, occupancyRate)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Critical Utilities Checklist */}
                <div className="grid grid-cols-3 gap-1.5 text-[10px] font-semibold text-center mb-3">
                  <div
                    className={`py-1 rounded border flex items-center justify-center space-x-1 ${
                      fac.hasWater
                        ? 'bg-sky-50 text-sky-800 border-sky-200'
                        : 'bg-sand-100 text-charcoal-400 border-sand-200 line-through'
                    }`}
                  >
                    <Droplets className="w-3 h-3" />
                    <span>Water</span>
                  </div>
                  <div
                    className={`py-1 rounded border flex items-center justify-center space-x-1 ${
                      fac.hasPower
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-sand-100 text-charcoal-400 border-sand-200 line-through'
                    }`}
                  >
                    <Zap className="w-3 h-3" />
                    <span>Power</span>
                  </div>
                  <div
                    className={`py-1 rounded border flex items-center justify-center space-x-1 ${
                      fac.hasComms
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-sand-100 text-charcoal-400 border-sand-200 line-through'
                    }`}
                  >
                    <Radio className="w-3 h-3" />
                    <span>Comms</span>
                  </div>
                </div>

                {/* Accessibility Notes */}
                <p className="text-[11px] text-charcoal-600 line-clamp-2 mb-3">
                  {fac.accessibilityNotes}
                </p>
              </div>

              {/* Card Footer: Verified date & Contact */}
              <div className="pt-3 border-t border-sand-200 flex items-center justify-between text-xs">
                <span className="text-[10px] text-charcoal-400">
                  Verified: {fac.lastVerified}
                </span>
                <a
                  href={`tel:${fac.contactNumber}`}
                  className="font-bold text-marine-800 hover:text-marine-900 flex items-center space-x-1 text-xs"
                >
                  <Phone className="w-3.5 h-3.5 text-coral-600" />
                  <span>{fac.contactNumber}</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
