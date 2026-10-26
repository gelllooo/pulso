import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  MUNICIPALITIES,
  BARANGAYS,
  CATEGORIES
} from '../data/marinduqueData';
import {
  Municipality,
  ReportCategory,
  UrgencyLevel
} from '../types';
import {
  Send,
  MapPin,
  Camera,
  AlertTriangle,
  Info,
  CheckCircle,
  ShieldCheck,
  Sprout,
  Anchor,
  Clock,
  Compass
} from 'lucide-react';

export const ReportForm: React.FC = () => {
  const { isOffline, submitReport, currentUser, setActiveTab } = useApp();

  const [category, setCategory] = useState<ReportCategory>('flooding');
  const [municipality, setMunicipality] = useState<Municipality>('Boac');
  const [barangay, setBarangay] = useState('Cawit');
  const [sitioOrLandmark, setSitioOrLandmark] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<UrgencyLevel>('elevated');
  const [immediateDanger, setImmediateDanger] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [reporterName, setReporterName] = useState(currentUser.name);
  const [reporterContact, setReporterContact] = useState(currentUser.contactNumber || '');
  
  // Livelihood fields
  const [cropType, setCropType] = useState('Coconut / Palay');
  const [affectedAreaHa, setAffectedAreaHa] = useState<number>(2.0);
  const [boatType, setBoatType] = useState<'motorized' | 'non_motorized' | 'fishing_gear'>('motorized');
  const [estimatedLoss, setEstimatedLoss] = useState<number>(50000);

  // GPS Coordinates
  const [lat, setLat] = useState<number>(13.4112);
  const [lng, setLng] = useState<number>(121.8156);
  const [locationCaptured, setLocationCaptured] = useState(true);

  // Photo simulation
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Privacy consent
  const [consentGiven, setConsentGiven] = useState(true);

  // Submitting state & Success Modal
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Filter barangays for selected municipality
  const availableBarangays = BARANGAYS.filter((b) => b.municipality === municipality);

  const handleMunicipalityChange = (m: Municipality) => {
    setMunicipality(m);
    const firstBgy = BARANGAYS.find((b) => b.municipality === m);
    if (firstBgy) {
      setBarangay(firstBgy.name);
      setLat(firstBgy.lat);
      setLng(firstBgy.lng);
    }
  };

  const handleBarangayChange = (bName: string) => {
    setBarangay(bName);
    const bgyObj = availableBarangays.find((b) => b.name === bName);
    if (bgyObj) {
      setLat(bgyObj.lat);
      setLng(bgyObj.lng);
    }
  };

  // Simulate acquiring current device GPS coordinates in Marinduque
  const captureCurrentLocation = () => {
    const selectedBgy = availableBarangays.find((b) => b.name === barangay);
    if (selectedBgy) {
      // Add slight micro-offset for realism
      const offsetLat = selectedBgy.lat + (Math.random() - 0.5) * 0.003;
      const offsetLng = selectedBgy.lng + (Math.random() - 0.5) * 0.003;
      setLat(Number(offsetLat.toFixed(5)));
      setLng(Number(offsetLng.toFixed(5)));
      setLocationCaptured(true);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!description.trim()) {
      setFormError('Add a short description of what you observed.');
      return;
    }
    if (!consentGiven) {
      setFormError('Accept the privacy notice before sending.');
      return;
    }

    setIsSubmitting(true);
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const reportPayload = {
      category,
      municipality,
      barangay,
      sitioOrLandmark: sitioOrLandmark.trim() || 'Central Purok',
      description: description.trim(),
      observationTime: nowStr,
      reportedTime: nowStr,
      lat,
      lng,
      urgency,
      immediateDanger,
      reporterRole: currentUser.role,
      reporterName: isAnonymous ? 'Anonymous Resident' : reporterName,
      reporterContact: isAnonymous ? '' : reporterContact,
      isAnonymous,
      photoUrl: photoPreview || undefined,
      livelihoodDetails:
        category === 'agriculture_damage'
          ? {
              cropType,
              affectedAreaHa,
              estimatedValueLossPhp: estimatedLoss
            }
          : category === 'fisheries_damage'
          ? {
              boatType,
              estimatedValueLossPhp: estimatedLoss
            }
          : undefined
    };

    try {
      const refNumber = await submitReport(reportPayload);
      setSubmittedRef(refNumber);
    } catch (err) {
      console.error(err);
      setFormError('The report could not be saved. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategoryMeta = CATEGORIES.find((c) => c.id === category);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Success Modal */}
      {submittedRef && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 text-center border-t-4 border-coral-500 animate-in zoom-in-95">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="font-display font-bold text-xl text-marine-900 mb-1">
              Report saved
            </h3>
            <p className="text-xs text-charcoal-600 mb-4">
              Reference:{' '}
              <span className="font-mono font-bold text-coral-600 bg-sand-100 px-2 py-0.5 rounded">
                {submittedRef}
              </span>
            </p>

            <div className="bg-sand-50 border border-sand-200 rounded-lg p-3 text-left text-xs space-y-1.5 mb-5 text-charcoal-700">
              <div className="flex justify-between">
                <span className="text-charcoal-500">Storage Status:</span>
                <span className="font-semibold text-marine-800">
                  {isOffline ? 'Waiting to send' : 'Saved'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-500">Location:</span>
                <span>
                  {barangay}, {municipality}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-500">Category:</span>
                <span className="capitalize">{selectedCategoryMeta?.label}</span>
              </div>
              <p className="text-[11px] text-charcoal-500 pt-2 border-t border-sand-200">
                {isOffline
                  ? 'It will be sent when you are connected.'
                  : 'Your report is ready for review.'}
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setSubmittedRef(null);
                  setDescription('');
                  setSitioOrLandmark('');
                  setPhotoPreview(null);
                }}
                className="flex-1 py-2.5 px-4 bg-sand-200 hover:bg-sand-300 text-marine-900 font-semibold text-xs rounded-lg transition-colors"
              >
                Submit Another Report
              </button>
              <button
                onClick={() => {
                  setSubmittedRef(null);
                  setActiveTab('map');
                }}
                className="flex-1 py-2.5 px-4 bg-marine-900 hover:bg-marine-800 text-white font-semibold text-xs rounded-lg transition-colors shadow-sm"
              >
                View on Map
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Info */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 text-coral-600 font-bold text-xs uppercase tracking-wider mb-1">
          <Send className="w-4 h-4" />
          <span>Structured Community Reporting</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-marine-900">
          Report an Incident or Hazard
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-600 mt-1">
          Your report assists barangay and municipal DRRMO teams in verifying real-time conditions on the ground across Marinduque.
        </p>

        {isOffline && (
          <div className="mt-3 bg-amber-50 border border-amber-300 text-amber-900 px-3 py-2 rounded-lg text-xs flex items-center space-x-2">
            <Info className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>You are offline.</strong> This report will be saved on this device and sent when connected.
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md border border-sand-200 p-5 sm:p-7 space-y-6">
        {formError && (
          <div role="alert" className="bg-coral-50 border border-coral-200 text-coral-700 px-3 py-2 rounded-lg text-xs">
            {formError}
          </div>
        )}
        {/* 1. Category Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-marine-900 mb-2">
            1. Incident or Damage Category <span className="text-coral-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                type="button"
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`p-2.5 text-left rounded-lg border text-xs flex flex-col justify-between transition-all ${
                  category === cat.id
                    ? 'border-marine-900 bg-marine-50/70 ring-2 ring-marine-900/20 font-bold text-marine-900'
                    : 'border-sand-200 hover:border-sand-300 bg-sand-50/50 text-charcoal-700'
                }`}
              >
                <div>
                  <div className="font-semibold text-xs leading-tight mb-0.5">{cat.label}</div>
                  <div className="text-[10px] text-charcoal-500 italic">{cat.tagalogLabel}</div>
                </div>
              </button>
            ))}
          </div>
          {selectedCategoryMeta && (
            <div className="mt-2 text-[11px] bg-sand-50 p-2.5 rounded border border-sand-200 text-charcoal-600">
              <strong>Scope:</strong> {selectedCategoryMeta.description}{' '}
              <span className="text-charcoal-500">e.g., {selectedCategoryMeta.examples}</span>
            </div>
          )}
        </div>

        {/* 2. Geographic Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-marine-900 mb-1.5">
              Municipality <span className="text-coral-500">*</span>
            </label>
            <select
              value={municipality}
              onChange={(e) => handleMunicipalityChange(e.target.value as Municipality)}
              className="w-full text-xs font-semibold bg-sand-50 border border-sand-300 rounded-lg p-2.5 text-marine-900 focus:ring-2 focus:ring-marine-800 focus:outline-none"
            >
              {MUNICIPALITIES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-marine-900 mb-1.5">
              Barangay <span className="text-coral-500">*</span>
            </label>
            <select
              value={barangay}
              onChange={(e) => handleBarangayChange(e.target.value)}
              className="w-full text-xs font-semibold bg-sand-50 border border-sand-300 rounded-lg p-2.5 text-marine-900 focus:ring-2 focus:ring-marine-800 focus:outline-none"
            >
              {availableBarangays.map((b) => (
                <option key={b.name} value={b.name}>
                  {b.name} (PSGC: {b.psgcCode})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sitio / Landmark & Coordinates */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-marine-900 mb-1.5">
            Sitio, Purok, or Specific Landmark
          </label>
          <input
            type="text"
            value={sitioOrLandmark}
            onChange={(e) => setSitioOrLandmark(e.target.value)}
            placeholder="e.g., Purok 4 near Cawit fish landing, or km 5 Laylay junction"
            className="w-full text-xs bg-sand-50 border border-sand-300 rounded-lg p-2.5 text-charcoal-900 focus:ring-2 focus:ring-marine-800 focus:outline-none"
          />
          <div className="mt-2 flex items-center justify-between text-[11px] text-charcoal-500">
            <span className="flex items-center space-x-1">
              <Compass className="w-3.5 h-3.5 text-marine-600" />
              <span>
                Coordinates: {lat.toFixed(4)}° N, {lng.toFixed(4)}° E
              </span>
            </span>
            <button
              type="button"
              onClick={captureCurrentLocation}
              className="text-marine-700 hover:text-marine-900 font-bold underline flex items-center space-x-1"
            >
              <MapPin className="w-3 h-3" />
              <span>Update GPS Pin</span>
            </button>
          </div>
        </div>

        {/* 3. Description */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-marine-900 mb-1.5">
            Incident Description & Situation <span className="text-coral-500">*</span>
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what happened, what is blocked, how deep the flood water is, or what assistance is requested..."
            className="w-full text-xs bg-sand-50 border border-sand-300 rounded-lg p-2.5 text-charcoal-900 focus:ring-2 focus:ring-marine-800 focus:outline-none"
            required
          />
        </div>

        {/* 4. Special Livelihood Sections if Agriculture or Fisheries */}
        {category === 'agriculture_damage' && (
          <div className="bg-forest-50/60 border border-forest-500/30 rounded-lg p-4 space-y-3">
            <div className="flex items-center space-x-2 text-forest-700 font-bold text-xs uppercase tracking-wider">
              <Sprout className="w-4 h-4" />
              <span>Agriculture Damage Specifics</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">
                  Crop Commodity
                </label>
                <select
                  value={cropType}
                  onChange={(e) => setCropType(e.target.value)}
                  className="w-full bg-white border border-sand-300 rounded p-1.5 text-xs font-medium"
                >
                  <option value="Coconut / Copra">Coconut / Copra</option>
                  <option value="Palay / Rice">Palay / Rice</option>
                  <option value="Banana Groves">Banana Groves</option>
                  <option value="Vegetables / Legumes">Vegetables / Legumes</option>
                  <option value="Root Tubers / Cassava">Root Tubers / Cassava</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">
                  Affected Area (Hectares)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={affectedAreaHa}
                  onChange={(e) => setAffectedAreaHa(Number(e.target.value))}
                  className="w-full bg-white border border-sand-300 rounded p-1.5 text-xs font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">
                  Est. Loss (₱ PHP)
                </label>
                <input
                  type="number"
                  step="5000"
                  value={estimatedLoss}
                  onChange={(e) => setEstimatedLoss(Number(e.target.value))}
                  className="w-full bg-white border border-sand-300 rounded p-1.5 text-xs font-medium"
                />
              </div>
            </div>
          </div>
        )}

        {category === 'fisheries_damage' && (
          <div className="bg-marine-50/80 border border-marine-500/30 rounded-lg p-4 space-y-3">
            <div className="flex items-center space-x-2 text-marine-700 font-bold text-xs uppercase tracking-wider">
              <Anchor className="w-4 h-4" />
              <span>Fisheries & Coastal Gear Specifics</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">
                  Damage Type
                </label>
                <select
                  value={boatType}
                  onChange={(e) => setBoatType(e.target.value as any)}
                  className="w-full bg-white border border-sand-300 rounded p-1.5 text-xs font-medium"
                >
                  <option value="motorized">Motorized Banca / Boat Hull Damage</option>
                  <option value="non_motorized">Non-motorized Paddle Boat</option>
                  <option value="fishing_gear">Fishing Nets / Fish Corral / Traps</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">
                  Est. Repair/Replacement Cost (₱ PHP)
                </label>
                <input
                  type="number"
                  step="5000"
                  value={estimatedLoss}
                  onChange={(e) => setEstimatedLoss(Number(e.target.value))}
                  className="w-full bg-white border border-sand-300 rounded p-1.5 text-xs font-medium"
                />
              </div>
            </div>
          </div>
        )}

        {/* 5. Urgency Level */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-marine-900 mb-1.5">
            Urgency Classification <span className="text-coral-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'routine', label: 'Routine', desc: 'No immediate threat; for planning.' },
              { id: 'elevated', label: 'Elevated', desc: 'Needs review or follow-up.' },
              { id: 'urgent', label: 'Urgent', desc: 'Requires prompt attention.' },
              { id: 'immediate_danger', label: 'Immediate Danger', desc: 'Active life safety threat.' }
            ].map((u) => (
              <button
                type="button"
                key={u.id}
                onClick={() => {
                  setUrgency(u.id as UrgencyLevel);
                  if (u.id === 'immediate_danger') setImmediateDanger(true);
                  else setImmediateDanger(false);
                }}
                className={`p-2 rounded-lg border text-left text-xs transition-all ${
                  urgency === u.id
                    ? u.id === 'immediate_danger'
                      ? 'border-coral-600 bg-coral-50 text-coral-700 font-bold ring-2 ring-coral-500/20'
                      : 'border-marine-900 bg-marine-50 text-marine-900 font-bold ring-2 ring-marine-900/20'
                    : 'border-sand-200 bg-sand-50/50 text-charcoal-700'
                }`}
              >
                <div className="font-semibold text-xs">{u.label}</div>
                <div className="text-[10px] text-charcoal-500 mt-0.5 leading-tight">{u.desc}</div>
              </button>
            ))}
          </div>

          {urgency === 'immediate_danger' && (
            <div className="mt-2.5 p-3 bg-coral-50 border border-coral-300 rounded-lg text-xs text-coral-800 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-coral-600 shrink-0 mt-0.5" />
              <div>
                <strong>Important Notice:</strong> Submitting "Immediate Danger" records the critical status in PULSO for verification, but <em>does not automatically dispatch emergency rescue teams</em>. If lives are in direct peril, please contact Marinduque PDRRMO Hotline: <strong>(042) 332-1011</strong> or Philippine National Police <strong>117</strong> immediately.
              </div>
            </div>
          )}
        </div>

        {/* 6. Photo / Visual Evidence */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-marine-900 mb-1.5">
            Attach Photo Evidence (Optional)
          </label>
          <div className="flex items-center space-x-3">
            <label className="cursor-pointer flex items-center space-x-1.5 bg-sand-100 hover:bg-sand-200 text-marine-900 text-xs font-semibold px-3 py-2 rounded-lg border border-sand-300 transition-colors">
              <Camera className="w-4 h-4 text-marine-700" />
              <span>Select Photo</span>
              <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
            </label>
            {photoPreview && (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-12 h-12 object-cover rounded border border-sand-300"
                />
                <button
                  type="button"
                  onClick={() => setPhotoPreview(null)}
                  className="absolute -top-1.5 -right-1.5 bg-coral-600 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center font-bold"
                >
                  &times;
                </button>
              </div>
            )}
            <span className="text-[11px] text-charcoal-500">
              {photoPreview ? 'Photo attached' : 'Add a photo if helpful.'}
            </span>
          </div>
        </div>

        {/* 7. Reporter Identity & Anonymous Mode */}
        <div className="border-t border-sand-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-marine-900">
              Reporter Identification
            </span>
            <label className="flex items-center space-x-2 text-xs text-charcoal-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded border-sand-300 text-marine-800 focus:ring-marine-800"
              />
              <span className="font-medium">Submit Anonymously</span>
            </label>
          </div>

          {!isAnonymous && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">
                  Reporter Name
                </label>
                <input
                  type="text"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  className="w-full bg-sand-50 border border-sand-300 rounded p-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">
                  Contact Number (for verification follow-up)
                </label>
                <input
                  type="text"
                  value={reporterContact}
                  onChange={(e) => setReporterContact(e.target.value)}
                  placeholder="09XX-XXX-XXXX"
                  className="w-full bg-sand-50 border border-sand-300 rounded p-2 text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* 8. Privacy Notice & Consent (NPC Circular 16-03 Compliance) */}
        <div className="bg-sand-50 border border-sand-200 rounded-lg p-3.5 text-[11px] text-charcoal-600 space-y-2">
          <div className="flex items-center space-x-1.5 font-bold text-marine-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Data Privacy Act of 2012 Notice</span>
          </div>
          <p>
            Information collected through PULSO is used solely by authorized Barangay and Municipal Disaster Risk Reduction and Management Councils (BDRRMC/MDRRMO) for incident verification, damage assessment, and humanitarian coordination. Reporter contact numbers are never published on open public map views.
          </p>
          <label className="flex items-center space-x-2 cursor-pointer font-semibold text-marine-900 pt-1">
            <input
              type="checkbox"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              className="rounded border-sand-300 text-marine-800 focus:ring-marine-800"
            />
            <span>I confirm this report reflects true community observations and consent to DRRM verification processing.</span>
          </label>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting || !consentGiven}
            className={`w-full py-3 px-4 rounded-xl font-bold text-sm text-white flex items-center justify-center space-x-2 transition-all shadow-md ${
              isOffline
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-marine-900 hover:bg-marine-800'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>
              {isSubmitting
                ? 'Saving Record...'
                : isOffline
                ? 'Save to Device Outbox (Offline Mode)'
                : 'Submit Verified Incident Report'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
