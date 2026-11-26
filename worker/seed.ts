import { slugify } from "./util";
import { AMENITIES } from "../shared/constants";

const L = (n: string) => `/img/${n}.webp`;
const U = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=70`;

export const CITIES: { name: string; state: string; image: string; localities: string[] }[] = [
  { name: "Hyderabad", state: "Telangana", image: U("photo-1572445271230-a78b5944a659"), localities: ["Gachibowli", "Kondapur", "Madhapur", "Banjara Hills", "Jubilee Hills", "Kokapet", "Miyapur", "Kukatpally", "Financial District", "Manikonda"] },
  { name: "Bengaluru", state: "Karnataka", image: U("photo-1596176530529-78163a4f7af2"), localities: ["Whitefield", "Koramangala", "Indiranagar", "HSR Layout", "Electronic City", "Sarjapur Road", "Hebbal", "JP Nagar"] },
  { name: "Mumbai", state: "Maharashtra", image: U("photo-1529253355930-ddbe423a2ac7"), localities: ["Bandra West", "Powai", "Andheri East", "Thane West", "Worli", "Chembur", "Navi Mumbai"] },
  { name: "Delhi NCR", state: "Delhi", image: U("photo-1587474260584-136574528ed5"), localities: ["Gurgaon Sector 56", "Noida Sector 150", "Dwarka", "Greater Noida West", "Saket", "Vasant Kunj"] },
  { name: "Pune", state: "Maharashtra", image: U("photo-1595658658481-d53d3f999875"), localities: ["Hinjewadi", "Baner", "Kharadi", "Wakad", "Viman Nagar", "Koregaon Park"] },
  { name: "Chennai", state: "Tamil Nadu", image: U("photo-1582510003544-4d00b7f74220"), localities: ["OMR", "Velachery", "Adyar", "Anna Nagar", "Porur", "Tambaram"] },
];

const IMG = {
  apt: [L("listing-apartment"), U("photo-1545324418-cc1a3fa10c00"), U("photo-1522708323590-d24dbb6b0267"), L("interior-living"), U("photo-1560448204-e02f11c3d0e2")],
  villa: [L("listing-villa"), U("photo-1613490493576-7fde63acd811"), U("photo-1600596542815-ffad4c1539a9"), L("amenity-clubhouse"), U("photo-1600585154340-be6161a56a0c")],
  house: [U("photo-1564013799919-ab600027ffc6"), U("photo-1570129477492-45c003edd2be"), L("interior-living"), U("photo-1502672260266-1c1ef2d93688")],
  plot: [L("listing-plot"), L("hero-skyline"), L("tenant-editorial")],
  office: [U("photo-1497366216548-37526070297c"), U("photo-1486406146926-c627a92ad1ab"), L("hero-skyline")],
  shop: [U("photo-1441986300917-64674bd600d8"), U("photo-1555529669-e69e7aa0ba9e"), L("hero-marketplace")],
};

type Seed = {
  title: string; lt: "sale" | "rent"; type: string; cat: string; city: string; loc: string; beds?: number; baths?: number;
  area: number; price: number; img: keyof typeof IMG; featured?: boolean; furn?: string; face?: string; floor?: number; floors?: number;
  age?: number; maint?: number; deposit?: number; poss?: string; owner?: "owner" | "agent" | "builder"; plot?: number; verified?: boolean;
};

const LISTINGS: Seed[] = [
  { title: "Luxury 3 BHK with skyline views in Kokapet", lt: "sale", type: "apartment", cat: "residential", city: "Hyderabad", loc: "Kokapet", beds: 3, baths: 3, area: 1850, price: 21500000, img: "apt", featured: true, furn: "semi", face: "East", floor: 18, floors: 32, age: 1, maint: 6500, verified: true, owner: "builder" },
  { title: "Spacious 2 BHK near IT corridor, Gachibowli", lt: "sale", type: "apartment", cat: "residential", city: "Hyderabad", loc: "Gachibowli", beds: 2, baths: 2, area: 1180, price: 9200000, img: "apt", furn: "semi", face: "North-East", floor: 7, floors: 14, age: 3, maint: 3200, verified: true },
  { title: "Premium 4 BHK villa with private pool", lt: "sale", type: "villa", cat: "residential", city: "Hyderabad", loc: "Jubilee Hills", beds: 4, baths: 5, area: 4200, price: 98000000, img: "villa", featured: true, furn: "full", face: "East", age: 2, plot: 4800, verified: true, owner: "agent" },
  { title: "Fully furnished 2 BHK for rent in Kondapur", lt: "rent", type: "apartment", cat: "residential", city: "Hyderabad", loc: "Kondapur", beds: 2, baths: 2, area: 1250, price: 38000, img: "apt", featured: true, furn: "full", face: "West", floor: 9, floors: 20, age: 4, deposit: 150000, maint: 0, verified: true },
  { title: "Ready-to-build DTCP plot in Miyapur", lt: "sale", type: "plot", cat: "plot", city: "Hyderabad", loc: "Miyapur", area: 2400, price: 14400000, img: "plot", face: "North", plot: 2400, owner: "owner" },
  { title: "Budget 1 BHK for rent in Madhapur", lt: "rent", type: "apartment", cat: "residential", city: "Hyderabad", loc: "Madhapur", beds: 1, baths: 1, area: 620, price: 16500, img: "apt", furn: "semi", floor: 3, floors: 5, age: 6, deposit: 66000, owner: "owner" },
  { title: "Grade-A office space in Financial District", lt: "rent", type: "office", cat: "commercial", city: "Hyderabad", loc: "Financial District", area: 3200, price: 256000, img: "office", furn: "full", floor: 6, floors: 12, age: 2, deposit: 1536000, verified: true, owner: "agent" },
  { title: "Gated community 3 BHK in Whitefield", lt: "sale", type: "apartment", cat: "residential", city: "Bengaluru", loc: "Whitefield", beds: 3, baths: 3, area: 1650, price: 15800000, img: "apt", featured: true, furn: "semi", face: "North", floor: 11, floors: 24, age: 2, maint: 5400, verified: true, owner: "builder" },
  { title: "Designer 2 BHK in Koramangala, walk to cafés", lt: "rent", type: "apartment", cat: "residential", city: "Bengaluru", loc: "Koramangala", beds: 2, baths: 2, area: 1100, price: 55000, img: "apt", featured: true, furn: "full", floor: 4, floors: 8, age: 5, deposit: 275000, verified: true },
  { title: "Independent house with garden, HSR Layout", lt: "sale", type: "independent_house", cat: "residential", city: "Bengaluru", loc: "HSR Layout", beds: 4, baths: 4, area: 2800, price: 52000000, img: "house", furn: "unfurnished", face: "East", age: 8, plot: 2400, owner: "owner" },
  { title: "Sunny 1 BHK studio near Indiranagar metro", lt: "rent", type: "studio", cat: "residential", city: "Bengaluru", loc: "Indiranagar", beds: 1, baths: 1, area: 520, price: 32000, img: "apt", furn: "full", floor: 2, floors: 4, age: 3, deposit: 160000 },
  { title: "Corner shop in a busy high-street, Sarjapur Road", lt: "sale", type: "shop", cat: "commercial", city: "Bengaluru", loc: "Sarjapur Road", area: 780, price: 18500000, img: "shop", floor: 0, floors: 3, age: 4, verified: true, owner: "agent" },
  { title: "Sea-facing 3 BHK in Bandra West", lt: "sale", type: "apartment", cat: "residential", city: "Mumbai", loc: "Bandra West", beds: 3, baths: 3, area: 1450, price: 78000000, img: "apt", featured: true, furn: "full", face: "West", floor: 15, floors: 26, age: 6, maint: 22000, verified: true, owner: "agent" },
  { title: "Lake-view 2 BHK in Powai", lt: "rent", type: "apartment", cat: "residential", city: "Mumbai", loc: "Powai", beds: 2, baths: 2, area: 980, price: 72000, img: "apt", furn: "semi", floor: 12, floors: 22, age: 5, deposit: 360000, verified: true },
  { title: "Affordable 2 BHK in Thane West", lt: "sale", type: "apartment", cat: "residential", city: "Mumbai", loc: "Thane West", beds: 2, baths: 2, area: 760, price: 12500000, img: "apt", furn: "unfurnished", face: "South", floor: 8, floors: 18, age: 1, maint: 2800, owner: "builder" },
  { title: "Spacious 4 BHK in Gurgaon Sector 56", lt: "sale", type: "apartment", cat: "residential", city: "Delhi NCR", loc: "Gurgaon Sector 56", beds: 4, baths: 4, area: 2900, price: 42000000, img: "apt", featured: true, furn: "semi", face: "North-East", floor: 14, floors: 30, age: 3, maint: 11000, verified: true, owner: "builder" },
  { title: "Brand-new 3 BHK in Noida Sector 150", lt: "sale", type: "apartment", cat: "residential", city: "Delhi NCR", loc: "Noida Sector 150", beds: 3, baths: 3, area: 1720, price: 16800000, img: "apt", furn: "unfurnished", face: "East", floor: 10, floors: 28, age: 0, maint: 4200, poss: "under_construction", owner: "builder" },
  { title: "Builder floor 3 BHK in Saket", lt: "rent", type: "builder_floor", cat: "residential", city: "Delhi NCR", loc: "Saket", beds: 3, baths: 3, area: 1800, price: 95000, img: "house", furn: "semi", floor: 2, floors: 4, age: 7, deposit: 285000 },
  { title: "Tech-park adjacent 2 BHK, Hinjewadi", lt: "rent", type: "apartment", cat: "residential", city: "Pune", loc: "Hinjewadi", beds: 2, baths: 2, area: 1020, price: 28000, img: "apt", furn: "semi", floor: 6, floors: 12, age: 4, deposit: 84000, owner: "owner" },
  { title: "Premium 3 BHK in Baner with clubhouse", lt: "sale", type: "apartment", cat: "residential", city: "Pune", loc: "Baner", beds: 3, baths: 3, area: 1480, price: 17500000, img: "apt", featured: true, furn: "semi", face: "North", floor: 9, floors: 18, age: 2, maint: 4500, verified: true },
  { title: "Row villa with terrace garden in Kharadi", lt: "sale", type: "villa", cat: "residential", city: "Pune", loc: "Kharadi", beds: 4, baths: 4, area: 3100, price: 38500000, img: "villa", furn: "semi", face: "East", age: 1, plot: 2000, owner: "builder", verified: true },
  { title: "Metro-connected 2 BHK on OMR", lt: "sale", type: "apartment", cat: "residential", city: "Chennai", loc: "OMR", beds: 2, baths: 2, area: 1090, price: 8900000, img: "apt", furn: "unfurnished", face: "East", floor: 5, floors: 15, age: 1, maint: 2600, owner: "builder" },
  { title: "Peaceful 3 BHK in Adyar, near the river", lt: "rent", type: "apartment", cat: "residential", city: "Chennai", loc: "Adyar", beds: 3, baths: 3, area: 1700, price: 62000, img: "apt", furn: "full", floor: 3, floors: 6, age: 8, deposit: 310000, verified: true },
  { title: "Corner plot with road on two sides, Porur", lt: "sale", type: "plot", cat: "plot", city: "Chennai", loc: "Porur", area: 1800, price: 11700000, img: "plot", face: "North-East", plot: 1800, owner: "owner", verified: true },
  { title: "Boutique PG for working women, Manikonda", lt: "rent", type: "pg", cat: "residential", city: "Hyderabad", loc: "Manikonda", beds: 1, area: 150, price: 9500, img: "apt", furn: "full", deposit: 9500, owner: "owner" },
  { title: "High-street retail showroom in Andheri East", lt: "rent", type: "shop", cat: "commercial", city: "Mumbai", loc: "Andheri East", area: 1100, price: 210000, img: "shop", floor: 0, floors: 2, age: 10, deposit: 1260000, owner: "agent" },
];

const PROJECTS = [
  { name: "Aurum Skyline Residences", builder: "Aurum Developers", city: "Hyderabad", loc: "Kokapet", cfg: "3, 4 BHK Apartments", pmin: 18500000, pmax: 34000000, amin: 1650, amax: 3100, poss: "Dec 2027", units: 420, featured: 1, img: [L("hero-skyline"), U("photo-1545324418-cc1a3fa10c00"), L("amenity-clubhouse")], desc: "Twin-tower high-rise living with a 40,000 sq ft clubhouse, sky lounge and uninterrupted views of the Financial District skyline." },
  { name: "Lakeview Greens", builder: "Greenfield Realty", city: "Bengaluru", loc: "Whitefield", cfg: "2, 3 BHK Apartments", pmin: 9800000, pmax: 17500000, amin: 1120, amax: 1780, poss: "Jun 2027", units: 640, featured: 1, img: [L("listing-apartment"), L("amenity-clubhouse"), L("interior-living")], desc: "A 12-acre gated enclave with 70% open space, walking trails around a restored lake and an international school next door." },
  { name: "Marina Bay Towers", builder: "Coastal Estates", city: "Mumbai", loc: "Navi Mumbai", cfg: "1, 2, 3 BHK Apartments", pmin: 8700000, pmax: 24500000, amin: 640, amax: 1500, poss: "Mar 2028", units: 900, featured: 1, img: [L("hero-marketplace"), U("photo-1486406146926-c627a92ad1ab"), L("interior-living")], desc: "Waterfront-inspired towers a short walk from the upcoming metro and airport corridor, with resort-style amenities." },
  { name: "The Orchard Villas", builder: "Vriksha Homes", city: "Pune", loc: "Kharadi", cfg: "4 BHK Villas", pmin: 32000000, pmax: 45000000, amin: 2800, amax: 3600, poss: "Ready to move", units: 64, featured: 0, img: [L("listing-villa"), U("photo-1613490493576-7fde63acd811"), L("tenant-editorial")], desc: "Low-density row villas with private terraces, EV-ready garages and a fruit-orchard central park." },
];

const POSTS = [
  { title: "First-time home buyer's checklist for 2027", excerpt: "From RERA verification to registration costs — everything to check before you pay a token amount.", cover: L("hero-marketplace"), body: "Buying your first home is exciting and overwhelming in equal measure. Start with a realistic budget: your EMI should ideally stay under 40% of take-home income. Verify the project on your state RERA portal, check the title chain for the last 30 years, and insist on a written agreement before paying any token.\n\nBudget for stamp duty, registration, GST (for under-construction), maintenance deposits and interiors — they add 8–12% on top of the price. Compare loan offers across at least three lenders; a 0.25% rate difference compounds into lakhs over 20 years.\n\nFinally, visit the property at different times of day. Traffic, noise, water pressure and light tell you things no brochure will." },
  { title: "Rent vs buy: what actually makes sense in Indian metros", excerpt: "A simple framework to decide using price-to-rent ratio, your time horizon and opportunity cost.", cover: L("interior-living"), body: "In most metros the rental yield is 2.5–3.5% while home loans cost 8.5–9%. That gap is the price you pay for ownership, offset by appreciation, forced savings and stability.\n\nIf you plan to stay 7+ years and the price-to-rent ratio is under 30, buying usually wins. If you're likely to relocate, or the ratio exceeds 35, renting and investing the difference can work out better.\n\nThere's no universal answer — but there is a way to compute yours. Use our EMI calculator and compare against your current rent." },
  { title: "How to spot a genuine listing (and avoid scams)", excerpt: "Fake photos, advance-token requests and 'urgent NRI sale' stories — red flags worth knowing.", cover: L("tenant-editorial"), body: "Genuine listings have consistent photos, a clear address and an owner willing to meet on site. Be wary of prices far below market, requests for advance money before a visit and photos that appear on multiple listings.\n\nOn our platform, listings marked Verified have been checked by our team for ownership documents and site photos. Always visit in person and pay only through traceable channels with a receipt." },
];

const AGENTS = [
  { name: "Ananya Rao", email: "ananya@krishhomes.in", phone: "+91 98000 11111", agency: "Krish Homes Hyderabad", bio: "10 years helping families settle in Hyderabad's West corridor.", rera: "RERA-TS-A-0001" },
  { name: "Rahul Mehta", email: "rahul@krishhomes.in", phone: "+91 98000 22222", agency: "Krish Homes Mumbai", bio: "Specialist in premium apartments across Bandra, Worli and Powai.", rera: "RERA-MH-A-0002" },
  { name: "Priya Nair", email: "priya@krishhomes.in", phone: "+91 98000 33333", agency: "Krish Homes Bengaluru", bio: "Rentals and resale expert for Koramangala, HSR and Whitefield.", rera: "RERA-KA-A-0003" },
];

const pick = <T,>(arr: readonly T[], seed: number, n: number): T[] => {
  const out: T[] = [];
  for (let i = 0; i < n; i++) out.push(arr[(seed * 7 + i * 5) % arr.length]);
  return [...new Set(out)];
};

export async function seedDemoData(db: D1Database, hashPassword: (p: string) => Promise<{ hash: string; salt: string }>) {
  const has = await db.prepare("SELECT COUNT(*) c FROM cities").first<{ c: number }>();
  if (has && has.c > 0) return;

  const stmts: D1PreparedStatement[] = [];
  CITIES.forEach((c, i) => {
    stmts.push(db.prepare("INSERT OR IGNORE INTO cities (slug,name,state,image,featured) VALUES (?,?,?,?,?)").bind(slugify(c.name), c.name, c.state, c.image, i < 6 ? 1 : 0));
  });
  await db.batch(stmts);
  const cityRows = (await db.prepare("SELECT id,slug,name FROM cities").all<{ id: number; slug: string; name: string }>()).results;
  const cityId = Object.fromEntries(cityRows.map((r) => [r.name, r.id]));
  await db.batch(CITIES.flatMap((c) => c.localities.map((l) =>
    db.prepare("INSERT OR IGNORE INTO localities (city_id,slug,name) VALUES (?,?,?)").bind(cityId[c.name], slugify(l), l))));
  const locRows = (await db.prepare("SELECT id,city_id,name FROM localities").all<{ id: number; city_id: number; name: string }>()).results;
  const locId = (city: string, name: string) => locRows.find((l) => l.city_id === cityId[city] && l.name === name)?.id ?? null;

  // Agents (public profiles; random password -> cannot sign in until a manager resets it)
  for (const a of AGENTS) {
    const junk = await hashPassword(crypto.randomUUID() + crypto.randomUUID());
    await db.prepare("INSERT OR IGNORE INTO staff (email,name,phone,role,password_hash,salt,agency,bio,rera_id,must_change_password) VALUES (?,?,?, 'agent', ?,?,?,?,?,1)")
      .bind(a.email, a.name, a.phone, junk.hash, junk.salt, a.agency, a.bio, a.rera).run();
  }
  const agentIds = (await db.prepare("SELECT id FROM staff WHERE role='agent' ORDER BY id").all<{ id: number }>()).results.map((r) => r.id);

  // Projects
  for (const p of PROJECTS) {
    await db.prepare(`INSERT OR IGNORE INTO projects (slug,name,builder,city_id,locality_id,description,configurations,price_min,price_max,area_min,area_max,possession,rera_id,total_units,amenities,images,featured)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(slugify(p.name), p.name, p.builder, cityId[p.city], locId(p.city, p.loc), p.desc, p.cfg, p.pmin, p.pmax, p.amin, p.amax, p.poss, "P" + slugify(p.name).slice(0, 6).toUpperCase() + "2026", p.units,
        JSON.stringify(pick(AMENITIES, p.units, 12)), JSON.stringify(p.img), p.featured).run();
  }

  // Properties
  const batch: D1PreparedStatement[] = [];
  LISTINGS.forEach((s, i) => {
    const imgs = IMG[s.img];
    const images = [...imgs.slice(i % 2), ...imgs.slice(0, i % 2)];
    const slug = `${slugify(s.title)}-${(1000 + i * 37).toString(36)}`;
    const ag = agentIds[i % agentIds.length];
    const desc = `${s.title}. Located in ${s.loc}, ${s.city}, this ${s.type.replace(/_/g, " ")} offers ${s.area.toLocaleString("en-IN")} sq ft of well-planned space${s.beds ? ` with ${s.beds} bedrooms` : ""}. ` +
      `Close to schools, hospitals, shopping and public transport, with excellent connectivity to the main business districts.\n\n` +
      `${s.lt === "rent" ? "Available for immediate move-in. Bachelors and families both welcome subject to owner approval." : "Clear title, bank-loan approved and ready for registration. Serious buyers can schedule a site visit any day of the week."}\n\n` +
      `Contact us to book a visit — our team will arrange everything from loan assistance to paperwork.`;
    batch.push(db.prepare(`INSERT OR IGNORE INTO properties
      (slug,title,description,listing_type,category,property_type,bedrooms,bathrooms,balconies,area_sqft,plot_area,price,maintenance,deposit,negotiable,furnishing,facing,floor,total_floors,age_years,possession,
       parking,city_id,locality_id,address,amenities,images,owner_type,staff_id,contact_name,contact_phone,status,featured,verified,views,published_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'active',?,?,?,datetime('now', ?))`)
      .bind(slug, s.title, desc, s.lt, s.cat, s.type, s.beds ?? null, s.baths ?? null, s.beds ? Math.min(3, s.beds) : null, s.area, s.plot ?? null, s.price, s.maint ?? null, s.deposit ?? null,
        i % 3 === 0 ? 1 : 0, s.furn ?? null, s.face ?? null, s.floor ?? null, s.floors ?? null, s.age ?? null, s.poss ?? "ready", s.cat === "plot" ? null : 1 + (i % 3),
        cityId[s.city], locId(s.city, s.loc), `${s.loc}, ${s.city}`, JSON.stringify(s.cat === "plot" ? ["Gated Community", "Rain Water Harvesting", "24x7 Security"] : pick(AMENITIES, i + 3, 10)),
        JSON.stringify(images), s.owner ?? "agent", ag, AGENTS[i % AGENTS.length].name, AGENTS[i % AGENTS.length].phone, s.featured ? 1 : 0, s.verified ? 1 : 0, 40 + ((i * 53) % 400), `-${i * 2} hours`));
  });
  await db.batch(batch);

  for (const [i, p] of POSTS.entries()) {
    await db.prepare("INSERT OR IGNORE INTO posts (slug,title,excerpt,content,cover,author,created_at) VALUES (?,?,?,?,?,?,datetime('now', ?))")
      .bind(slugify(p.title), p.title, p.excerpt, p.body, p.cover, "Krish Homes Editorial", `-${i * 6} days`).run();
  }
}
