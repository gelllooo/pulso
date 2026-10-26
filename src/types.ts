// PULSO Data Models and Enums for Marinduque

export type UserRole =
  | 'guest'
  | 'community_reporter'
  | 'barangay_official'
  | 'municipal_official'
  | 'provincial_official'
  | 'agriculture_officer'
  | 'fisheries_officer'
  | 'admin'
  | 'auditor';

export type AppTab =
  | 'overview'
  | 'report'
  | 'map'
  | 'verify'
  | 'facilities'
  | 'advisories'
  | 'livelihood'
  | 'sitrep'
  | 'audit';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  scopeMunicipality: string;
  scopeBarangay?: string;
  contactNumber?: string;
  agencyOrOffice?: string;
}

export type Municipality =
  | 'Boac'
  | 'Mogpog'
  | 'Gasan'
  | 'Santa Cruz'
  | 'Torrijos'
  | 'Buenavista';

export interface BarangayInfo {
  name: string;
  municipality: Municipality;
  psgcCode: string;
  lat: number;
  lng: number;
}

export type ReportCategory =
  | 'flooding'
  | 'blocked_road'
  | 'landslide'
  | 'fire'
  | 'damaged_structure'
  | 'power_outage'
  | 'telecom_outage'
  | 'water_sanitation'
  | 'medical_welfare'
  | 'missing_stranded'
  | 'agriculture_damage'
  | 'fisheries_damage'
  | 'other_concern';

export interface CategoryMetadata {
  id: ReportCategory;
  label: string;
  tagalogLabel: string;
  description: string;
  examples: string;
  color: string;
  iconName: string;
}

export type UrgencyLevel = 'routine' | 'elevated' | 'urgent' | 'immediate_danger';

export type ReportStatus =
  | 'draft'
  | 'pending_sync'
  | 'queued_offline'
  | 'received'
  | 'under_verification'
  | 'verified'
  | 'assigned'
  | 'action_in_progress'
  | 'resolved'
  | 'closed'
  | 'rejected'
  | 'duplicate';

export type VerificationBasis =
  | 'field_check'
  | 'official_source'
  | 'second_report'
  | 'phone_confirmation'
  | 'photo_evidence';

export interface VerificationData {
  verifierName: string;
  verifierRole: UserRole;
  verifierOffice: string;
  verifiedAt: string;
  basis: VerificationBasis;
  confidence: 'low' | 'medium' | 'high';
  severityAssessment: 'mild' | 'moderate' | 'severe' | 'critical';
  internalNotes?: string;
  publicUpdate?: string;
  duplicateOfId?: string;
}

export interface AssignmentData {
  assignedTo: string;
  assignedOffice: string;
  assignedAt: string;
  actionRequired: string;
  targetResolutionDate?: string;
}

export interface IncidentReport {
  id: string;
  clientReportId: string;
  referenceNumber: string;
  category: ReportCategory;
  description: string;
  observationTime: string;
  reportedTime: string;
  municipality: Municipality;
  barangay: string;
  sitioOrLandmark: string;
  lat: number;
  lng: number;
  urgency: UrgencyLevel;
  immediateDanger: boolean;
  status: ReportStatus;
  reporterRole: UserRole;
  reporterName?: string;
  reporterContact?: string;
  isAnonymous: boolean;
  photoUrl?: string;
  // Specific livelihood metadata
  livelihoodDetails?: {
    cropType?: string;
    affectedAreaHa?: number;
    boatType?: 'motorized' | 'non_motorized' | 'fishing_gear';
    livestockType?: string;
    estimatedValueLossPhp?: number;
  };
  verification?: VerificationData;
  assignment?: AssignmentData;
  idempotencyKey: string;
  syncedAt?: string;
  lastUpdatedAt: string;
}

export interface Facility {
  id: string;
  name: string;
  type:
    | 'evacuation_center'
    | 'hospital_health_center'
    | 'barangay_hall'
    | 'police_fire_rescue'
    | 'mdrrm_office'
    | 'seaport_landing'
    | 'water_source';
  municipality: Municipality;
  barangay: string;
  lat: number;
  lng: number;
  operatingStatus: 'operational' | 'at_capacity' | 'standby' | 'damaged' | 'closed';
  capacity: number;
  currentOccupancy: number;
  contactNumber: string;
  hasWater: boolean;
  hasPower: boolean;
  hasComms: boolean;
  accessibilityNotes: string;
  lastVerified: string;
  source: string;
}

export interface OfficialAdvisory {
  id: string;
  issuer: 'PAGASA' | 'PHIVOLCS' | 'NDRRMC' | 'PDRRMO Marinduque' | 'MDRRMO';
  title: string;
  category: 'weather' | 'evacuation' | 'hazard';
  sourceUrl?: string;
  issuanceTime: string;
  validityPeriod?: string;
  lastRetrievedAt?: string;
  verificationStatus: 'current' | 'expired' | 'unverified';
  scope: string;
  content: string;
  status: 'active' | 'superseded' | 'cancelled';
  severity: 'info' | 'warning' | 'severe' | 'emergency';
  signalNumber?: number; // For TCWS
}

export interface AuditEvent {
  id: string;
  reportId: string;
  actor: string;
  actorRole: UserRole;
  action: string;
  previousStatus: ReportStatus;
  newStatus: ReportStatus;
  timestamp: string;
  notes: string;
}

export interface SyncLog {
  id: string;
  clientReportId: string;
  attemptNumber: number;
  status: 'pending' | 'success' | 'failed';
  timestamp: string;
  message: string;
}
