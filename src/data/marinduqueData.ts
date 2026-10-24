import {
  CategoryMetadata,
  Municipality,
  BarangayInfo,
  IncidentReport,
  Facility,
  OfficialAdvisory
} from '../types';

export const MUNICIPALITIES: Municipality[] = [
  'Boac',
  'Mogpog',
  'Gasan',
  'Santa Cruz',
  'Torrijos',
  'Buenavista'
];

export const BARANGAYS: BarangayInfo[] = [
  // Boac (Pilot Municipality)
  { name: 'Cawit', municipality: 'Boac', psgcCode: '174001008', lat: 13.4112, lng: 121.8156 },
  { name: 'Laylay', municipality: 'Boac', psgcCode: '174001021', lat: 13.4398, lng: 121.8179 },
  { name: 'Balimbing', municipality: 'Boac', psgcCode: '174001003', lat: 13.4568, lng: 121.8542 },
  { name: 'Murallon', municipality: 'Boac', psgcCode: '174001032', lat: 13.4479, lng: 121.8414 },
  { name: 'Poras', municipality: 'Boac', psgcCode: '174001037', lat: 13.4312, lng: 121.8567 },
  { name: 'Mercado (Poblacion)', municipality: 'Boac', psgcCode: '174001031', lat: 13.4485, lng: 121.8432 },
  
  // Mogpog
  { name: 'Balanacan', municipality: 'Mogpog', psgcCode: '174004005', lat: 13.5283, lng: 121.8572 },
  { name: 'Silangan', municipality: 'Mogpog', psgcCode: '174004033', lat: 13.4789, lng: 121.8631 },
  { name: 'Capayang', municipality: 'Mogpog', psgcCode: '174004011', lat: 13.4981, lng: 121.8794 },

  // Gasan
  { name: 'Bunganay', municipality: 'Gasan', psgcCode: '174002007', lat: 13.3124, lng: 121.8456 },
  { name: 'Pinggan', municipality: 'Gasan', psgcCode: '174002018', lat: 13.3421, lng: 121.8512 },
  { name: 'Pangi', municipality: 'Gasan', psgcCode: '174002016', lat: 13.3289, lng: 121.8398 },

  // Santa Cruz
  { name: 'Buyabod', municipality: 'Santa Cruz', psgcCode: '174005011', lat: 13.5123, lng: 122.0543 },
  { name: 'Lapu-lapu', municipality: 'Santa Cruz', psgcCode: '174005027', lat: 13.4812, lng: 122.0289 },
  { name: 'Maharlika', municipality: 'Santa Cruz', psgcCode: '174005030', lat: 13.4691, lng: 122.0412 },

  // Torrijos
  { name: 'Poctoy', municipality: 'Torrijos', psgcCode: '174006020', lat: 13.3082, lng: 122.0912 },
  { name: 'Marlanga', municipality: 'Torrijos', psgcCode: '174006014', lat: 13.2845, lng: 122.0721 },

  // Buenavista
  { name: 'Lipata', municipality: 'Buenavista', psgcCode: '174003009', lat: 13.2381, lng: 121.9324 },
  { name: 'Malbog', municipality: 'Buenavista', psgcCode: '174003013', lat: 13.2678, lng: 121.9612 }
];

export const CATEGORIES: CategoryMetadata[] = [
  {
    id: 'flooding',
    label: 'Flooding / Rising Water',
    tagalogLabel: 'Baha o Pagtaas ng Tubig',
    description: 'River overflow, flash flooding, coastal storm surge, or rising water in residential/farm areas.',
    examples: 'Boac river swelling, ankle-to-chest water, submerged rice fields.',
    color: '#0284c7',
    iconName: 'Waves'
  },
  {
    id: 'blocked_road',
    label: 'Blocked Road / Damaged Bridge',
    tagalogLabel: 'Baradong Daan o Nasirang Tulay',
    description: 'Downed electric posts, fallen trees, landslides, or road washouts preventing vehicle passage.',
    examples: 'Cawit-Boac coastal road impassable, Laylay bridge debris.',
    color: '#d97706',
    iconName: 'Construction'
  },
  {
    id: 'landslide',
    label: 'Landslide / Slope Concern',
    tagalogLabel: 'Pagguho ng Lupa',
    description: 'Active mudflow, rockfall, soil erosion, or hill slope tension cracks.',
    examples: 'Erosion along mountain roads in Balimbing or Mogpog slopes.',
    color: '#b45309',
    iconName: 'Mountain'
  },
  {
    id: 'fire',
    label: 'Fire Incident',
    tagalogLabel: 'Sunog',
    description: 'Structural fire, copra dryer ignition, grass or forest wildfire.',
    examples: 'Residential fire or warehouse blaze needing BFP response.',
    color: '#dc2626',
    iconName: 'Flame'
  },
  {
    id: 'damaged_structure',
    label: 'Damaged House or Facility',
    tagalogLabel: 'Nasirang Bahay o Pasilidad',
    description: 'Blown off roofs, collapsed walls, damaged barangay hall, school, or evacuation center.',
    examples: 'Typhoon wind stripped GI sheet roofs in coastal Purok 3.',
    color: '#ea580c',
    iconName: 'Home'
  },
  {
    id: 'power_outage',
    label: 'Power Outage',
    tagalogLabel: 'Walang Kuryente',
    description: 'Blackout, fallen distribution lines, blown transformer, or solar minigrid failure.',
    examples: 'Feeder line down affecting MARELCO consumers across Boac/Mogpog.',
    color: '#ca8a04',
    iconName: 'ZapOff'
  },
  {
    id: 'telecom_outage',
    label: 'Telecom / Signal Outage',
    tagalogLabel: 'Walang Signal o Internet',
    description: 'Loss of mobile cellular signal (Globe/Smart), fiber break, or tower generator shutdown.',
    examples: 'No 4G/LTE connectivity in Cawit shoreline, satellite radio needed.',
    color: '#475569',
    iconName: 'WifiOff'
  },
  {
    id: 'water_sanitation',
    label: 'Water / Sanitation Concern',
    tagalogLabel: 'Problema sa Tubig at Kalinisan',
    description: 'Contaminated well, broken pipeline, lack of drinking water, damaged latrines.',
    examples: 'Level II water spring turbidity high after heavy rainfall.',
    color: '#0891b2',
    iconName: 'Droplets'
  },
  {
    id: 'medical_welfare',
    label: 'Medical or Welfare Concern',
    tagalogLabel: 'Medikal o Pangangailangan sa Pagkain',
    description: 'Injuries, hypothermia, lack of infant formula, dialysis patient marooned, elderly needing care.',
    examples: 'Post-disaster shortage of maintenance medications in evacuation center.',
    color: '#be123c',
    iconName: 'HeartPulse'
  },
  {
    id: 'missing_stranded',
    label: 'Missing or Stranded Person',
    tagalogLabel: 'Nawawala o Na-stranded na Tao',
    description: 'Fisherfolk who did not return to shore, travelers stranded by port cancellations.',
    examples: '2 motorbancas overdue from fishing ground off Tres Reyes Islands.',
    color: '#9333ea',
    iconName: 'UserX'
  },
  {
    id: 'agriculture_damage',
    label: 'Agriculture Damage',
    tagalogLabel: 'Pinsala sa Pananim o Sakahan',
    description: 'Fallen coconut palms, submerged palay (rice), banana toppling, vegetable field loss.',
    examples: '15 hectares of newly planted palay submerged; 400 bearing coconut trees uprooted.',
    color: '#15803d',
    iconName: 'Sprout'
  },
  {
    id: 'fisheries_damage',
    label: 'Boat / Gear / Fisheries Damage',
    tagalogLabel: 'Pinsala sa Bangka o Gamit Pangisda',
    description: 'Damaged motorbancas, destroyed fish nets, washed away fish corrals, landing site damage.',
    examples: 'Heavy surf damaged 8 motorized bancas lashed at Cawit beach landing.',
    color: '#0369a1',
    iconName: 'Anchor'
  },
  {
    id: 'other_concern',
    label: 'Other Community Concern',
    tagalogLabel: 'Iba pang Pangamba sa Komunidad',
    description: 'Issues not covered by above categories requiring local authority attention.',
    examples: 'Feral animal hazard or coastal debris accumulation.',
    color: '#64748b',
    iconName: 'AlertCircle'
  }
];

export const INITIAL_FACILITIES: Facility[] = [
  {
    id: 'FAC-001',
    name: 'Boac Evacuation Center (Moriones Arena Complex)',
    type: 'evacuation_center',
    municipality: 'Boac',
    barangay: 'Murallon',
    lat: 13.4491,
    lng: 121.8425,
    operatingStatus: 'operational',
    capacity: 450,
    currentOccupancy: 85,
    contactNumber: '(042) 332-1011',
    hasWater: true,
    hasPower: true,
    hasComms: true,
    accessibilityNotes: 'Ramped entrance, generator backup installed, child-friendly space designated.',
    lastVerified: '2026-10-24 09:30',
    source: 'MDRRMO Boac Log'
  },
  {
    id: 'FAC-002',
    name: 'Marinduque Provincial Hospital (MPH)',
    type: 'hospital_health_center',
    municipality: 'Boac',
    barangay: 'Santol',
    lat: 13.4432,
    lng: 121.8488,
    operatingStatus: 'operational',
    capacity: 120,
    currentOccupancy: 95,
    contactNumber: '(042) 332-1456',
    hasWater: true,
    hasPower: true,
    hasComms: true,
    accessibilityNotes: 'Level 2 provincial hospital with emergency surgical & trauma unit.',
    lastVerified: '2026-10-24 11:00',
    source: 'Provincial Health Office'
  },
  {
    id: 'FAC-003',
    name: 'Cawit Elementary School Evacuation Facility',
    type: 'evacuation_center',
    municipality: 'Boac',
    barangay: 'Cawit',
    lat: 13.4125,
    lng: 121.8168,
    operatingStatus: 'operational',
    capacity: 200,
    currentOccupancy: 42,
    contactNumber: '0919-456-7890',
    hasWater: true,
    hasPower: false,
    hasComms: true,
    accessibilityNotes: 'Ground floor classrooms accessible; coastal perimeter guarded against high tide.',
    lastVerified: '2026-10-24 08:15',
    source: 'Barangay Cawit DRRM Committee'
  },
  {
    id: 'FAC-004',
    name: 'Balanacan Port Terminal & Holding Area',
    type: 'seaport_landing',
    municipality: 'Mogpog',
    barangay: 'Balanacan',
    lat: 13.5298,
    lng: 121.8565,
    operatingStatus: 'standby',
    capacity: 350,
    currentOccupancy: 0,
    contactNumber: '(042) 332-2311',
    hasWater: true,
    hasPower: true,
    hasComms: true,
    accessibilityNotes: 'RoRo vessels suspended per Coast Guard advisory due to rough seas.',
    lastVerified: '2026-10-24 10:45',
    source: 'Philippine Ports Authority / PCG'
  },
  {
    id: 'FAC-005',
    name: 'Poctoy Community Evacuation Hall',
    type: 'evacuation_center',
    municipality: 'Torrijos',
    barangay: 'Poctoy',
    lat: 13.3094,
    lng: 122.0921,
    operatingStatus: 'standby',
    capacity: 150,
    currentOccupancy: 0,
    contactNumber: '0928-123-4567',
    hasWater: true,
    hasPower: true,
    hasComms: false,
    accessibilityNotes: 'Located 300m inland from Poctoy White Beach, elevated foundation.',
    lastVerified: '2026-10-23 16:00',
    source: 'MDRRMO Torrijos'
  },
  {
    id: 'FAC-006',
    name: 'Gasan Rural Health Unit (RHU)',
    type: 'hospital_health_center',
    municipality: 'Gasan',
    barangay: 'Mahunig',
    lat: 13.3211,
    lng: 121.8482,
    operatingStatus: 'operational',
    capacity: 40,
    currentOccupancy: 12,
    contactNumber: '(042) 342-1209',
    hasWater: true,
    hasPower: true,
    hasComms: true,
    accessibilityNotes: 'First aid, basic trauma care, and maternal health beds operational.',
    lastVerified: '2026-10-24 07:00',
    source: 'Gasan Municipal Health'
  }
];

export const INITIAL_ADVISORIES: OfficialAdvisory[] = [
  {
    id: 'ADV-PAGASA-001',
    issuer: 'PAGASA',
    title: 'Tropical Cyclone Wind Signal No. 2 Raised over Marinduque',
    sourceUrl: 'https://www.pagasa.dost.gov.ph/tropical-cyclone/severe-weather-bulletin',
    issuanceTime: '2026-10-24 11:00 PHT',
    validityPeriod: 'Next bulletin at 17:00 PHT',
    scope: 'Province of Marinduque (All Municipalities)',
    content: 'Winds of 62 to 88 km/h may be expected in at least 24 hours. Minor to moderate threat to life and property. Coastal communities are warned against waves 2.5m to 4.5m.',
    status: 'active',
    severity: 'warning',
    signalNumber: 2
  },
  {
    id: 'ADV-PDRRMO-002',
    issuer: 'PDRRMO Marinduque',
    title: 'Pre-emptive Evacuation Advisory for Coastal and Flood-Prone Barangays',
    sourceUrl: 'https://marinduquegov.ph/disaster-bulletin',
    issuanceTime: '2026-10-24 08:30 PHT',
    validityPeriod: 'Effective immediately until storm signal is lifted',
    scope: 'Boac (Laylay, Cawit), Mogpog (Balanacan), Gasan (Bunganay), Torrijos (Poctoy)',
    content: 'Residents in low-lying coastal and riverbank areas are strongly advised to coordinate with their Barangay DRRM committees for orderly pre-emptive evacuation to designated centers.',
    status: 'active',
    severity: 'emergency'
  },
  {
    id: 'ADV-PHIVOLCS-003',
    issuer: 'PHIVOLCS',
    title: 'Indicative Hazard Assessment: Soil Saturation & Landslide Reference',
    sourceUrl: 'https://hazardhunter.georisk.gov.ph/',
    issuanceTime: '2026-10-24 06:00 PHT',
    validityPeriod: 'Planning reference layer',
    scope: 'Mountainous terrain in Torrijos, Buenavista, and interior Boac',
    content: 'Cumulative 48-hour rainfall exceeds 150mm. Saturated slopes have elevated susceptibility to shallow translational slides. This is indicative reference data from HazardHunterPH.',
    status: 'active',
    severity: 'info'
  }
];

export const INITIAL_REPORTS: IncidentReport[] = [
  {
    id: 'REP-001',
    clientReportId: 'client-uuid-001',
    referenceNumber: 'PULSO-2026-BOAC-001',
    category: 'flooding',
    description: 'Boac River water level reached critical gauge mark near Murallon dike. Low-lying farms in Purok 2 experiencing 0.5m water rise.',
    observationTime: '2026-10-24 08:45',
    reportedTime: '2026-10-24 08:50',
    municipality: 'Boac',
    barangay: 'Murallon',
    sitioOrLandmark: 'Near Murallon dike floodway',
    lat: 13.4485,
    lng: 121.8421,
    urgency: 'urgent',
    immediateDanger: false,
    status: 'verified',
    reporterRole: 'community_reporter',
    reporterName: 'Juan Dela Cruz',
    reporterContact: '0917-123-4567',
    isAnonymous: false,
    verification: {
      verifierName: 'Capt. E. Madrigal',
      verifierRole: 'barangay_official',
      verifierOffice: 'Barangay Murallon Council',
      verifiedAt: '2026-10-24 09:10',
      basis: 'field_check',
      confidence: 'high',
      severityAssessment: 'severe',
      internalNotes: 'River gauge confirmed at 4.2m. Sandbags mobilized by BDRRMC.',
      publicUpdate: 'River dike alert active. Road passing Murallon remains open with caution.'
    },
    assignment: {
      assignedTo: 'MDRRMO Quick Response Unit',
      assignedOffice: 'Boac MDRRMO',
      assignedAt: '2026-10-24 09:15',
      actionRequired: 'Monitor dike spillover and maintain sandbag wall.'
    },
    idempotencyKey: 'idem-key-001',
    syncedAt: '2026-10-24 08:51',
    lastUpdatedAt: '2026-10-24 09:15'
  },
  {
    id: 'REP-002',
    clientReportId: 'client-uuid-002',
    referenceNumber: 'PULSO-2026-BOAC-002',
    category: 'fisheries_damage',
    description: 'High tidal surge and heavy swells caused damage to 5 small motorized fishing boats (bancas) at Cawit fish landing area. Fishing gear washed into sea.',
    observationTime: '2026-10-24 09:30',
    reportedTime: '2026-10-24 09:40',
    municipality: 'Boac',
    barangay: 'Cawit',
    sitioOrLandmark: 'Cawit Shoreline Fish Landing Port',
    lat: 13.4118,
    lng: 121.8152,
    urgency: 'elevated',
    immediateDanger: false,
    status: 'under_verification',
    reporterRole: 'community_reporter',
    reporterName: 'Mang Tomas (Fisherfolk Assoc)',
    reporterContact: '0928-888-9999',
    isAnonymous: false,
    livelihoodDetails: {
      boatType: 'motorized',
      estimatedValueLossPhp: 185000
    },
    idempotencyKey: 'idem-key-002',
    syncedAt: '2026-10-24 09:42',
    lastUpdatedAt: '2026-10-24 09:42'
  },
  {
    id: 'REP-003',
    clientReportId: 'client-uuid-003',
    referenceNumber: 'PULSO-2026-BOAC-003',
    category: 'blocked_road',
    description: 'Fallen electric post and large mango tree blocking the provincial road connecting Laylay to Boac Poblacion. Wires still on asphalt.',
    observationTime: '2026-10-24 10:15',
    reportedTime: '2026-10-24 10:20',
    municipality: 'Boac',
    barangay: 'Laylay',
    sitioOrLandmark: 'Km 3 Laylay-Poblacion Road junction',
    lat: 13.4412,
    lng: 121.8195,
    urgency: 'urgent',
    immediateDanger: false,
    status: 'assigned',
    reporterRole: 'community_reporter',
    reporterName: 'Maria Santos',
    isAnonymous: false,
    verification: {
      verifierName: 'Engr. R. Sena',
      verifierRole: 'municipal_official',
      verifierOffice: 'Boac Engineering / DRRM',
      verifiedAt: '2026-10-24 10:30',
      basis: 'phone_confirmation',
      confidence: 'high',
      severityAssessment: 'moderate',
      internalNotes: 'MARELCO notified to de-energize segment before chainsaw clearing.',
      publicUpdate: 'Laylay road impassable to 4-wheel vehicles. Motorbikes can take interior trail.'
    },
    assignment: {
      assignedTo: 'MARELCO Emergency Line Crew & Boac Engineering',
      assignedOffice: 'MARELCO / Municipal Engineering',
      assignedAt: '2026-10-24 10:35',
      actionRequired: 'Cut power and clear fallen tree from road.'
    },
    idempotencyKey: 'idem-key-003',
    syncedAt: '2026-10-24 10:21',
    lastUpdatedAt: '2026-10-24 10:35'
  },
  {
    id: 'REP-004',
    clientReportId: 'client-uuid-004',
    referenceNumber: 'PULSO-2026-GASAN-004',
    category: 'agriculture_damage',
    description: 'Sustained gale winds uprooted 35 mature coconut palms and damaged young banana groves in upland Sitio Ilaya.',
    observationTime: '2026-10-24 07:30',
    reportedTime: '2026-10-24 11:05',
    municipality: 'Gasan',
    barangay: 'Bunganay',
    sitioOrLandmark: 'Sitio Ilaya Coconut Cooperative Area',
    lat: 13.3135,
    lng: 121.8462,
    urgency: 'routine',
    immediateDanger: false,
    status: 'received',
    reporterRole: 'community_reporter',
    reporterName: 'Gasan Farmers Cooperative',
    isAnonymous: false,
    livelihoodDetails: {
      cropType: 'Coconut / Copra & Banana',
      affectedAreaHa: 4.5,
      estimatedValueLossPhp: 120000
    },
    idempotencyKey: 'idem-key-004',
    syncedAt: '2026-10-24 11:06',
    lastUpdatedAt: '2026-10-24 11:06'
  }
];
