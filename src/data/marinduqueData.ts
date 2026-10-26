import type {
  CategoryMetadata,
  Municipality,
  BarangayInfo,
  IncidentReport,
  Facility,
  OfficialAdvisory,
} from "../types";
import reference from "./marinduque-reference.json";
import facilities from "./facilities.json";
export const MUNICIPALITIES = reference.municipalities.map(
  (m) => m.name,
) as Municipality[];
export const BARANGAYS: BarangayInfo[] = reference.municipalities.flatMap((m) =>
  m.barangays.map((b) => ({
    name: b.name,
    municipality: m.name as Municipality,
    psgcCode: b.psgcCode,
  })),
);
export const CATEGORIES: CategoryMetadata[] = [
  {
    id: "flooding",
    label: "Flooding / Rising Water",
    tagalogLabel: "Baha o Pagtaas ng Tubig",
    description:
      "River overflow, flash flooding, coastal storm surge, or rising water in residential/farm areas.",
    examples:
      "Boac river swelling, ankle-to-chest water, submerged rice fields.",
    color: "#0284c7",
    iconName: "Waves",
  },
  {
    id: "blocked_road",
    label: "Blocked Road / Damaged Bridge",
    tagalogLabel: "Baradong Daan o Nasirang Tulay",
    description:
      "Downed electric posts, fallen trees, landslides, or road washouts preventing vehicle passage.",
    examples: "Cawit-Boac coastal road impassable, Laylay bridge debris.",
    color: "#d97706",
    iconName: "Construction",
  },
  {
    id: "landslide",
    label: "Landslide / Slope Concern",
    tagalogLabel: "Pagguho ng Lupa",
    description:
      "Active mudflow, rockfall, soil erosion, or hill slope tension cracks.",
    examples: "Erosion along mountain roads in Balimbing or Mogpog slopes.",
    color: "#b45309",
    iconName: "Mountain",
  },
  {
    id: "fire",
    label: "Fire Incident",
    tagalogLabel: "Sunog",
    description:
      "Structural fire, copra dryer ignition, grass or forest wildfire.",
    examples: "Residential fire or warehouse blaze needing BFP response.",
    color: "#dc2626",
    iconName: "Flame",
  },
  {
    id: "damaged_structure",
    label: "Damaged House or Facility",
    tagalogLabel: "Nasirang Bahay o Pasilidad",
    description:
      "Blown off roofs, collapsed walls, damaged barangay hall, school, or evacuation center.",
    examples: "Typhoon wind stripped GI sheet roofs in coastal Purok 3.",
    color: "#ea580c",
    iconName: "Home",
  },
  {
    id: "power_outage",
    label: "Power Outage",
    tagalogLabel: "Walang Kuryente",
    description:
      "Blackout, fallen distribution lines, blown transformer, or solar minigrid failure.",
    examples:
      "Feeder line down affecting MARELCO consumers across Boac/Mogpog.",
    color: "#ca8a04",
    iconName: "ZapOff",
  },
  {
    id: "telecom_outage",
    label: "Telecom / Signal Outage",
    tagalogLabel: "Walang Signal o Internet",
    description:
      "Loss of mobile cellular signal (Globe/Smart), fiber break, or tower generator shutdown.",
    examples:
      "No 4G/LTE connectivity in Cawit shoreline, satellite radio needed.",
    color: "#475569",
    iconName: "WifiOff",
  },
  {
    id: "water_sanitation",
    label: "Water / Sanitation Concern",
    tagalogLabel: "Problema sa Tubig at Kalinisan",
    description:
      "Contaminated well, broken pipeline, lack of drinking water, damaged latrines.",
    examples: "Level II water spring turbidity high after heavy rainfall.",
    color: "#0891b2",
    iconName: "Droplets",
  },
  {
    id: "medical_welfare",
    label: "Medical or Welfare Concern",
    tagalogLabel: "Medikal o Pangangailangan sa Pagkain",
    description:
      "Injuries, hypothermia, lack of infant formula, dialysis patient marooned, elderly needing care.",
    examples:
      "Post-disaster shortage of maintenance medications in evacuation center.",
    color: "#be123c",
    iconName: "HeartPulse",
  },
  {
    id: "missing_stranded",
    label: "Missing or Stranded Person",
    tagalogLabel: "Nawawala o Na-stranded na Tao",
    description:
      "Fisherfolk who did not return to shore, travelers stranded by port cancellations.",
    examples:
      "2 motorbancas overdue from fishing ground off Tres Reyes Islands.",
    color: "#9333ea",
    iconName: "UserX",
  },
  {
    id: "agriculture_damage",
    label: "Agriculture Damage",
    tagalogLabel: "Pinsala sa Pananim o Sakahan",
    description:
      "Fallen coconut palms, submerged palay (rice), banana toppling, vegetable field loss.",
    examples:
      "15 hectares of newly planted palay submerged; 400 bearing coconut trees uprooted.",
    color: "#15803d",
    iconName: "Sprout",
  },
  {
    id: "fisheries_damage",
    label: "Boat / Gear / Fisheries Damage",
    tagalogLabel: "Pinsala sa Bangka o Gamit Pangisda",
    description:
      "Damaged motorbancas, destroyed fish nets, washed away fish corrals, landing site damage.",
    examples:
      "Heavy surf damaged 8 motorized bancas lashed at Cawit beach landing.",
    color: "#0369a1",
    iconName: "Anchor",
  },
  {
    id: "other_concern",
    label: "Other Community Concern",
    tagalogLabel: "Iba pang Pangamba sa Komunidad",
    description:
      "Issues not covered by above categories requiring local authority attention.",
    examples: "Feral animal hazard or coastal debris accumulation.",
    color: "#64748b",
    iconName: "AlertCircle",
  },
];

export const INITIAL_FACILITIES = facilities as Facility[];
export const INITIAL_ADVISORIES: OfficialAdvisory[] = [];
export const INITIAL_REPORTS: IncidentReport[] = [];
