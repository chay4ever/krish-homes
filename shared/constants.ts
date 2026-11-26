export type ListingType = "sale" | "rent";

export interface PropertyTypeDef {
  value: string;
  label: string;
  category: "residential" | "commercial" | "plot";
  beds?: boolean;
}

export const PROPERTY_TYPES: PropertyTypeDef[] = [
  { value: "apartment", label: "Apartment / Flat", category: "residential", beds: true },
  { value: "villa", label: "Villa", category: "residential", beds: true },
  { value: "independent_house", label: "Independent House", category: "residential", beds: true },
  { value: "builder_floor", label: "Builder Floor", category: "residential", beds: true },
  { value: "studio", label: "Studio", category: "residential", beds: true },
  { value: "penthouse", label: "Penthouse", category: "residential", beds: true },
  { value: "pg", label: "PG / Co-living", category: "residential" },
  { value: "plot", label: "Residential Plot", category: "plot" },
  { value: "agri_land", label: "Agricultural Land", category: "plot" },
  { value: "office", label: "Office Space", category: "commercial" },
  { value: "shop", label: "Shop / Showroom", category: "commercial" },
  { value: "coworking", label: "Co-working", category: "commercial" },
  { value: "warehouse", label: "Warehouse / Godown", category: "commercial" },
];

export const typeLabel = (v: string) => PROPERTY_TYPES.find((t) => t.value === v)?.label ?? v;

export const AMENITIES = [
  "Lift", "Power Backup", "24x7 Security", "CCTV", "Covered Parking", "Visitor Parking",
  "Swimming Pool", "Gym", "Clubhouse", "Children's Play Area", "Garden / Park", "Jogging Track",
  "Indoor Games", "Rain Water Harvesting", "Gas Pipeline", "Intercom", "Fire Safety", "Wi-Fi",
  "Air Conditioning", "Modular Kitchen", "Wardrobes", "Servant Room", "Vastu Compliant",
  "Gated Community", "Sewage Treatment", "EV Charging", "Tennis / Badminton Court", "Amphitheatre",
] as const;

export const FURNISHING = [
  { value: "unfurnished", label: "Unfurnished" },
  { value: "semi", label: "Semi-furnished" },
  { value: "full", label: "Fully furnished" },
];

export const FACINGS = ["East", "West", "North", "South", "North-East", "North-West", "South-East", "South-West"];

export const LEAD_STATUSES = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "visit_done", label: "Visit done" },
  { value: "closed", label: "Closed – won" },
  { value: "lost", label: "Lost" },
];

export const PROPERTY_STATUSES = [
  { value: "pending", label: "Pending review" },
  { value: "active", label: "Live" },
  { value: "rejected", label: "Rejected" },
  { value: "sold", label: "Sold / Rented" },
  { value: "archived", label: "Archived" },
  { value: "draft", label: "Draft" },
];

export type StaffRole = "super_admin" | "admin" | "agent";
export const ROLE_LABEL: Record<StaffRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin Manager",
  agent: "Agent",
};

export const DEFAULT_BRAND = {
  name: "Krish Homes",
  tagline: "Find a home you'll love",
  phone: "+91 90000 00000",
  email: "hello@krishhomes.in",
  address: "Hyderabad, Telangana, India",
  whatsapp: "919000000000",
  heroTitle: "Skip the broker. Find the home you'll love.",
  heroSubtitle: "Verified listings, direct owner contact and free site visits — with a team that actually picks up the phone.",
};
export type Brand = typeof DEFAULT_BRAND;

/** Approximate city-centre coordinates (lat, lng) — used for "detect my location". */
export const CITY_COORDS: Record<string, [number, number]> = {
  visakhapatnam: [17.6868, 83.2185], vijayawada: [16.5062, 80.648], guntur: [16.3067, 80.4365], tirupati: [13.6288, 79.4192],
  amaravati: [16.5731, 80.3575], nellore: [14.4426, 79.9865], kakinada: [16.9891, 82.2475], rajahmundry: [17.0005, 81.804],
  kurnool: [15.8281, 78.0373], kadapa: [14.4673, 78.8242], anantapur: [14.6819, 77.6006], ongole: [15.5057, 80.0499],
  eluru: [16.7107, 81.0952], srikakulam: [18.2949, 83.8938], vizianagaram: [18.1067, 83.3956], hyderabad: [17.385, 78.4867],
};
export const SERVICES = [
  { key: "home-loan", label: "Home loans", desc: "Compare lenders, lower rates", icon: "landmark" },
  { key: "rental-agreement", label: "Rental agreement", desc: "Doorstep e-stamped agreements", icon: "file" },
  { key: "packers-movers", label: "Packers & movers", desc: "Insured, fixed-price moves", icon: "truck" },
  { key: "interiors", label: "Home interiors", desc: "Design + build, 45-day delivery", icon: "paint" },
  { key: "legal", label: "Legal & registration", desc: "Title check, sale deed help", icon: "scale" },
  { key: "valuation", label: "Property valuation", desc: "Know what your home is worth", icon: "chart" },
] as const;
