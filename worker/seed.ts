import { slugify } from "./util";
import { AMENITIES } from "../shared/constants";

const L = (n: string) => `/img/${n}.webp`;
const U = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=70`;

const HERO = [L("hero-skyline"), L("hero-marketplace"), L("tenant-editorial"), L("listing-villa"), L("amenity-clubhouse"), L("listing-apartment")];
const C = (name: string, state: string, localities: string[]) => ({ name, state, localities });
// Andhra Pradesh first, then Hyderabad (Telangana).
export const CITIES: { name: string; state: string; image?: string; localities: string[] }[] = [
  C("Visakhapatnam", "Andhra Pradesh", ["MVP Colony", "Madhurawada", "Rushikonda", "Gajuwaka", "Seethammadhara", "Beach Road", "Dwaraka Nagar", "Pendurthi", "Kommadi", "Bheemili"]),
  C("Vijayawada", "Andhra Pradesh", ["Benz Circle", "Patamata", "Auto Nagar", "Labbipet", "Gannavaram", "Poranki", "Governorpet", "Bhavanipuram", "Kanuru"]),
  C("Guntur", "Andhra Pradesh", ["Brodipet", "Arundelpet", "Pattabhipuram", "Lakshmipuram", "Nallapadu", "Gorantla", "Amaravathi Road"]),
  C("Tirupati", "Andhra Pradesh", ["Alipiri", "Korlagunta", "Renigunta", "Tiruchanur", "Air Bypass Road", "Leela Mahal Circle"]),
  C("Amaravati", "Andhra Pradesh", ["Mangalagiri", "Tadepalli", "Thullur", "Undavalli", "Kuragallu", "Nowluru"]),
  C("Nellore", "Andhra Pradesh", ["Stonehousepet", "Dargamitta", "Magunta Layout", "Pogathota", "Vedayapalem"]),
  C("Kakinada", "Andhra Pradesh", ["Bhanugudi", "Ramanayyapeta", "Suryaraopeta", "Jagannaickpur", "Samalkot Road"]),
  C("Rajahmundry", "Andhra Pradesh", ["Danavaipeta", "Innespeta", "Morampudi", "Lalacheruvu", "Kotipalli Bus Stand"]),
  C("Kurnool", "Andhra Pradesh", ["Nandyal Road", "Budhwarpet", "Kallur", "Ashok Nagar", "Venkataramana Colony"]),
  C("Kadapa", "Andhra Pradesh", ["Rims Road", "Marripadu", "Ravindranagar", "Yerramukkapalli"]),
  C("Anantapur", "Andhra Pradesh", ["Subash Road", "Rudrampeta", "Tapovanam", "Kamala Nagar"]),
  C("Ongole", "Andhra Pradesh", ["Trunk Road", "Kothapatnam", "Mangamuru Road", "Santhapeta"]),
  C("Eluru", "Andhra Pradesh", ["Powerpet", "Ashok Nagar", "Ramachandra Rao Peta", "Sanivarapupeta"]),
  C("Srikakulam", "Andhra Pradesh", ["Palakonda Road", "Day & Night Junction", "Narasannapeta"]),
  C("Vizianagaram", "Andhra Pradesh", ["Kothagrahaaram", "Dasannapeta", "Ring Road"]),
  C("Hyderabad", "Telangana", ["Gachibowli", "Kondapur", "Madhapur", "Banjara Hills", "Jubilee Hills", "Kokapet", "Miyapur", "Kukatpally", "Financial District", "Manikonda", "Uppal", "LB Nagar"]),
].map((c, i) => ({ ...c, image: HERO[i % HERO.length] }));

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
  { title: "Sea-facing 3 BHK in Rushikonda with beach access", lt: "sale", type: "apartment", cat: "residential", city: "Visakhapatnam", loc: "Rushikonda", beds: 3, baths: 3, area: 1720, price: 14500000, img: "apt", featured: true, furn: "semi", face: "East", floor: 9, floors: 14, age: 2, maint: 4500, verified: true, owner: "builder" },
  { title: "Spacious 2 BHK near Madhurawada IT Park", lt: "sale", type: "apartment", cat: "residential", city: "Visakhapatnam", loc: "Madhurawada", beds: 2, baths: 2, area: 1150, price: 6800000, img: "apt", furn: "unfurnished", face: "North-East", floor: 4, floors: 10, age: 1, maint: 2400, verified: true, owner: "owner" },
  { title: "Furnished 2 BHK for rent in MVP Colony", lt: "rent", type: "apartment", cat: "residential", city: "Visakhapatnam", loc: "MVP Colony", beds: 2, baths: 2, area: 1100, price: 24000, img: "apt", featured: true, furn: "full", floor: 3, floors: 6, age: 5, deposit: 72000, owner: "owner" },
  { title: "Independent house with garden in Seethammadhara", lt: "sale", type: "independent_house", cat: "residential", city: "Visakhapatnam", loc: "Seethammadhara", beds: 4, baths: 4, area: 2600, price: 19500000, img: "house", furn: "semi", face: "East", age: 6, plot: 2200, verified: true, owner: "owner" },
  { title: "Approved layout plot near Bheemili beach road", lt: "sale", type: "plot", cat: "plot", city: "Visakhapatnam", loc: "Bheemili", area: 2160, price: 8640000, img: "plot", face: "North", plot: 2160, owner: "owner" },
  { title: "Luxury 3 BHK with skyline views in Benz Circle", lt: "sale", type: "apartment", cat: "residential", city: "Vijayawada", loc: "Benz Circle", beds: 3, baths: 3, area: 1680, price: 11800000, img: "apt", featured: true, furn: "semi", face: "East", floor: 11, floors: 18, age: 2, maint: 3800, verified: true, owner: "builder" },
  { title: "Ready-to-move 2 BHK in Patamata", lt: "sale", type: "apartment", cat: "residential", city: "Vijayawada", loc: "Patamata", beds: 2, baths: 2, area: 1050, price: 5900000, img: "apt", furn: "unfurnished", face: "West", floor: 5, floors: 9, age: 3, maint: 2000, owner: "owner" },
  { title: "2 BHK flat for rent near Auto Nagar", lt: "rent", type: "apartment", cat: "residential", city: "Vijayawada", loc: "Auto Nagar", beds: 2, baths: 2, area: 1000, price: 16000, img: "apt", furn: "semi", floor: 2, floors: 5, age: 6, deposit: 48000, owner: "owner" },
  { title: "Premium villa plot in Gannavaram airport zone", lt: "sale", type: "plot", cat: "plot", city: "Vijayawada", loc: "Gannavaram", area: 2400, price: 7200000, img: "plot", face: "East", plot: 2400, verified: true, owner: "agent" },
  { title: "Corner shop on a busy road in Governorpet", lt: "sale", type: "shop", cat: "commercial", city: "Vijayawada", loc: "Governorpet", area: 620, price: 9800000, img: "shop", floor: 0, floors: 3, age: 8, owner: "agent" },
  { title: "Gated community 3 BHK in Brodipet", lt: "sale", type: "apartment", cat: "residential", city: "Guntur", loc: "Brodipet", beds: 3, baths: 3, area: 1550, price: 7900000, img: "apt", featured: true, furn: "semi", face: "North", floor: 6, floors: 12, age: 1, maint: 2800, verified: true, owner: "builder" },
  { title: "Spacious 2 BHK for rent in Pattabhipuram", lt: "rent", type: "apartment", cat: "residential", city: "Guntur", loc: "Pattabhipuram", beds: 2, baths: 2, area: 1050, price: 14000, img: "apt", furn: "semi", floor: 3, floors: 5, age: 4, deposit: 42000, owner: "owner" },
  { title: "Duplex villa near Gorantla with private garden", lt: "sale", type: "villa", cat: "residential", city: "Guntur", loc: "Gorantla", beds: 4, baths: 4, area: 3100, price: 21500000, img: "villa", furn: "semi", face: "East", age: 2, plot: 3000, verified: true, owner: "agent" },
  { title: "3 BHK near Alipiri, minutes from the temple", lt: "sale", type: "apartment", cat: "residential", city: "Tirupati", loc: "Alipiri", beds: 3, baths: 3, area: 1480, price: 8900000, img: "apt", featured: true, furn: "unfurnished", face: "East", floor: 4, floors: 8, age: 2, maint: 2500, verified: true, owner: "builder" },
  { title: "Student-friendly 1 BHK for rent near Korlagunta", lt: "rent", type: "apartment", cat: "residential", city: "Tirupati", loc: "Korlagunta", beds: 1, baths: 1, area: 640, price: 9000, img: "apt", furn: "semi", floor: 2, floors: 4, age: 5, deposit: 27000, owner: "owner" },
  { title: "Capital-region plot in Thullur, CRDA approved", lt: "sale", type: "plot", cat: "plot", city: "Amaravati", loc: "Thullur", area: 1800, price: 5400000, img: "plot", face: "North-East", plot: 1800, verified: true, owner: "owner" },
  { title: "New 3 BHK in Mangalagiri near AIIMS", lt: "sale", type: "apartment", cat: "residential", city: "Amaravati", loc: "Mangalagiri", beds: 3, baths: 3, area: 1620, price: 8600000, img: "apt", featured: true, furn: "unfurnished", face: "East", floor: 7, floors: 15, age: 0, maint: 2600, poss: "under_construction", owner: "builder" },
  { title: "Ready 2 BHK flat in Tadepalli on the river side", lt: "sale", type: "apartment", cat: "residential", city: "Amaravati", loc: "Tadepalli", beds: 2, baths: 2, area: 1120, price: 6200000, img: "apt", furn: "semi", face: "West", floor: 3, floors: 6, age: 3, owner: "owner" },
  { title: "Independent 3 BHK house in Stonehousepet", lt: "sale", type: "independent_house", cat: "residential", city: "Nellore", loc: "Stonehousepet", beds: 3, baths: 3, area: 2000, price: 9500000, img: "house", furn: "unfurnished", face: "East", age: 7, plot: 1800, owner: "owner" },
  { title: "2 BHK for rent near Dargamitta", lt: "rent", type: "apartment", cat: "residential", city: "Nellore", loc: "Dargamitta", beds: 2, baths: 2, area: 980, price: 12000, img: "apt", furn: "semi", floor: 1, floors: 4, age: 6, deposit: 36000, owner: "owner" },
  { title: "Modern 3 BHK in Bhanugudi, Kakinada", lt: "sale", type: "apartment", cat: "residential", city: "Kakinada", loc: "Bhanugudi", beds: 3, baths: 3, area: 1480, price: 7400000, img: "apt", furn: "semi", face: "East", floor: 5, floors: 9, age: 2, maint: 2200, verified: true, owner: "builder" },
  { title: "Spacious 2 BHK near Danavaipeta, Rajahmundry", lt: "sale", type: "apartment", cat: "residential", city: "Rajahmundry", loc: "Danavaipeta", beds: 2, baths: 2, area: 1080, price: 5600000, img: "apt", furn: "unfurnished", face: "North", floor: 3, floors: 7, age: 3, owner: "owner" },
  { title: "Commercial space on Nandyal Road, Kurnool", lt: "rent", type: "office", cat: "commercial", city: "Kurnool", loc: "Nandyal Road", area: 1500, price: 45000, img: "office", furn: "semi", floor: 1, floors: 3, age: 4, deposit: 270000, owner: "agent" },
  { title: "East-facing plot in a gated layout, Kadapa", lt: "sale", type: "plot", cat: "plot", city: "Kadapa", loc: "Rims Road", area: 1500, price: 3750000, img: "plot", face: "East", plot: 1500, owner: "owner" },
  { title: "Fully furnished 2 BHK for rent in Kondapur", lt: "rent", type: "apartment", cat: "residential", city: "Hyderabad", loc: "Kondapur", beds: 2, baths: 2, area: 1250, price: 38000, img: "apt", featured: true, furn: "full", face: "West", floor: 9, floors: 20, age: 4, deposit: 150000, verified: true },
  { title: "Luxury 3 BHK with skyline views in Kokapet", lt: "sale", type: "apartment", cat: "residential", city: "Hyderabad", loc: "Kokapet", beds: 3, baths: 3, area: 1850, price: 21500000, img: "apt", featured: true, furn: "semi", face: "East", floor: 18, floors: 32, age: 1, maint: 6500, verified: true, owner: "builder" },
  { title: "Spacious 2 BHK near IT corridor, Gachibowli", lt: "sale", type: "apartment", cat: "residential", city: "Hyderabad", loc: "Gachibowli", beds: 2, baths: 2, area: 1180, price: 9200000, img: "apt", furn: "semi", face: "North-East", floor: 7, floors: 14, age: 3, maint: 3200, verified: true },
  { title: "Premium 4 BHK villa with private pool", lt: "sale", type: "villa", cat: "residential", city: "Hyderabad", loc: "Jubilee Hills", beds: 4, baths: 5, area: 4200, price: 98000000, img: "villa", featured: true, furn: "full", face: "East", age: 2, plot: 4800, verified: true, owner: "agent" },
  { title: "Ready-to-build DTCP plot in Miyapur", lt: "sale", type: "plot", cat: "plot", city: "Hyderabad", loc: "Miyapur", area: 2400, price: 14400000, img: "plot", face: "North", plot: 2400, owner: "owner" },
  { title: "Budget 1 BHK for rent in Madhapur", lt: "rent", type: "apartment", cat: "residential", city: "Hyderabad", loc: "Madhapur", beds: 1, baths: 1, area: 620, price: 16500, img: "apt", furn: "semi", floor: 3, floors: 5, age: 6, deposit: 66000, owner: "owner" },
  { title: "Grade-A office space in Financial District", lt: "rent", type: "office", cat: "commercial", city: "Hyderabad", loc: "Financial District", area: 3200, price: 256000, img: "office", furn: "full", floor: 6, floors: 12, age: 2, deposit: 1536000, verified: true, owner: "agent" },
  { title: "Boutique PG for working women, Manikonda", lt: "rent", type: "pg", cat: "residential", city: "Hyderabad", loc: "Manikonda", beds: 1, area: 150, price: 9500, img: "apt", furn: "full", deposit: 9500, owner: "owner" },
];

const PROJECTS = [
  { name: "Aurum Bay Residences", builder: "Aurum Developers", city: "Visakhapatnam", loc: "Madhurawada", cfg: "2, 3 BHK Apartments", pmin: 6900000, pmax: 12500000, amin: 1120, amax: 1780, poss: "Dec 2027", units: 420, featured: 1, img: [L("hero-skyline"), L("listing-apartment"), L("amenity-clubhouse")], desc: "Hill-and-sea view high-rise towers minutes from the IT corridor, with a 30,000 sq ft clubhouse, sky deck and 70% open space." },
  { name: "Krishna Greens", builder: "Greenfield Realty", city: "Vijayawada", loc: "Benz Circle", cfg: "2, 3 BHK Apartments", pmin: 5800000, pmax: 10500000, amin: 1050, amax: 1680, poss: "Jun 2027", units: 320, featured: 1, img: [L("listing-apartment"), L("amenity-clubhouse"), L("interior-living")], desc: "A landscaped gated enclave close to the city's best schools and hospitals, with a podium garden, indoor games and 24x7 security." },
  { name: "Capital Heights", builder: "Amaravati Estates", city: "Amaravati", loc: "Mangalagiri", cfg: "2, 3 BHK Apartments", pmin: 5400000, pmax: 9800000, amin: 1080, amax: 1620, poss: "Mar 2028", units: 560, featured: 1, img: [L("hero-marketplace"), L("tenant-editorial"), L("interior-living")], desc: "Modern homes in the capital region with easy access to AIIMS, the expressway and upcoming government offices." },
  { name: "Venkatadri Villas", builder: "Vriksha Homes", city: "Tirupati", loc: "Air Bypass Road", cfg: "3, 4 BHK Villas", pmin: 12500000, pmax: 19500000, amin: 2200, amax: 3200, poss: "Ready to move", units: 64, featured: 0, img: [L("listing-villa"), L("tenant-editorial"), L("amenity-clubhouse")], desc: "Low-density villas with private gardens, a temple-view park and EV-ready garages, close to the railway station and highway." },
  { name: "Skyline Square", builder: "Aurum Developers", city: "Hyderabad", loc: "Kokapet", cfg: "3, 4 BHK Apartments", pmin: 18500000, pmax: 34000000, amin: 1650, amax: 3100, poss: "Dec 2027", units: 420, featured: 1, img: [L("hero-skyline"), L("listing-apartment"), L("amenity-clubhouse")], desc: "Twin-tower high-rise living with a 40,000 sq ft clubhouse and uninterrupted views of the Financial District skyline." },
];

const POSTS = [
  { title: "First-time home buyer's checklist for 2027", excerpt: "From RERA verification to registration costs — everything to check before you pay a token amount.", cover: L("hero-marketplace"), body: "Buying your first home is exciting and overwhelming in equal measure. Start with a realistic budget: your EMI should ideally stay under 40% of take-home income. Verify the project on your state RERA portal, check the title chain for the last 30 years, and insist on a written agreement before paying any token.\n\nBudget for stamp duty, registration, GST (for under-construction), maintenance deposits and interiors — they add 8–12% on top of the price. Compare loan offers across at least three lenders; a 0.25% rate difference compounds into lakhs over 20 years.\n\nFinally, visit the property at different times of day. Traffic, noise, water pressure and light tell you things no brochure will." },
  { title: "Rent vs buy: what actually makes sense in Indian metros", excerpt: "A simple framework to decide using price-to-rent ratio, your time horizon and opportunity cost.", cover: L("interior-living"), body: "In most metros the rental yield is 2.5–3.5% while home loans cost 8.5–9%. That gap is the price you pay for ownership, offset by appreciation, forced savings and stability.\n\nIf you plan to stay 7+ years and the price-to-rent ratio is under 30, buying usually wins. If you're likely to relocate, or the ratio exceeds 35, renting and investing the difference can work out better.\n\nThere's no universal answer — but there is a way to compute yours. Use our EMI calculator and compare against your current rent." },
  { title: "How to spot a genuine listing (and avoid scams)", excerpt: "Fake photos, advance-token requests and 'urgent NRI sale' stories — red flags worth knowing.", cover: L("tenant-editorial"), body: "Genuine listings have consistent photos, a clear address and an owner willing to meet on site. Be wary of prices far below market, requests for advance money before a visit and photos that appear on multiple listings.\n\nOn our platform, listings marked Verified have been checked by our team for ownership documents and site photos. Always visit in person and pay only through traceable channels with a receipt." },
];

const AGENTS = [
  { name: "Srinivas Reddy", email: "srinivas@krishhomes.in", phone: "+91 98000 11111", agency: "Krish Homes Visakhapatnam", bio: "12 years helping families find homes across Vizag — from Beach Road to Madhurawada.", rera: "RERA-AP-A-0001" },
  { name: "Lakshmi Prasanna", email: "lakshmi@krishhomes.in", phone: "+91 98000 22222", agency: "Krish Homes Vijayawada", bio: "Specialist in apartments, plots and capital-region investments around Vijayawada and Amaravati.", rera: "RERA-AP-A-0002" },
  { name: "Karthik Varma", email: "karthik@krishhomes.in", phone: "+91 98000 33333", agency: "Krish Homes Hyderabad", bio: "Rentals and resale expert for Gachibowli, Kondapur and Madhapur.", rera: "RERA-TS-A-0003" },
];

const agentFor = (city: string, i: number) => (city === "Hyderabad" ? 2 : ["Vijayawada", "Guntur", "Amaravati", "Eluru", "Nellore", "Ongole"].includes(city) ? 1 : city === "Visakhapatnam" ? 0 : i % 2);
const pick = <T,>(arr: readonly T[], seed: number, n: number): T[] => {
  const out: T[] = [];
  for (let i = 0; i < n; i++) out.push(arr[(seed * 7 + i * 5) % arr.length]);
  return [...new Set(out)];
};

export async function seedDemoData(db: D1Database, hashPassword: (p: string) => Promise<{ hash: string; salt: string }>) {
  const mark = await db.prepare("SELECT value FROM settings WHERE key='seed_v'").first();
  if (mark) return;
  const has = await db.prepare("SELECT COUNT(*) c FROM cities").first<{ c: number }>();
  if (has && has.c > 0) await retireV1Demo(db);

  const stmts: D1PreparedStatement[] = [];
  CITIES.forEach((c, i) => {
    stmts.push(db.prepare("INSERT OR IGNORE INTO cities (slug,name,state,image,featured) VALUES (?,?,?,?,?)").bind(slugify(c.name), c.name, c.state, c.image, i < 8 || c.name === "Hyderabad" ? 1 : 0));
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
  const agentRows = (await db.prepare("SELECT id,email FROM staff WHERE role='agent'").all<{ id: number; email: string }>()).results;
  const agentIds = AGENTS.map((a) => agentRows.find((r) => r.email === a.email)!.id);

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
    const ag = agentIds[agentFor(s.city, i)];
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
        JSON.stringify(images), s.owner ?? "agent", ag, AGENTS[agentFor(s.city, i)].name, AGENTS[agentFor(s.city, i)].phone, s.featured ? 1 : 0, s.verified ? 1 : 0, 40 + ((i * 53) % 400), `-${i * 2} hours`));
  });
  await db.batch(batch);

  for (const [i, p] of POSTS.entries()) {
    await db.prepare("INSERT OR IGNORE INTO posts (slug,title,excerpt,content,cover,author,created_at) VALUES (?,?,?,?,?,?,datetime('now', ?))")
      .bind(slugify(p.title), p.title, p.excerpt, p.body, p.cover, "Krish Homes Editorial", `-${i * 6} days`).run();
  }
  await db.prepare("INSERT OR REPLACE INTO settings (key,value) VALUES ('seed_v','2')").run();
}

/** One-time clean-up of the first demo data set (Mumbai/Bengaluru/etc.) so the catalogue starts with Andhra Pradesh + Hyderabad. Real (non-demo) listings are kept. */
async function retireV1Demo(db: D1Database) {
  const demoAgents = "(SELECT id FROM staff WHERE email IN ('ananya@krishhomes.in','rahul@krishhomes.in','priya@krishhomes.in'))";
  const demoProps = `(SELECT id FROM properties WHERE user_id IS NULL AND staff_id IN ${demoAgents})`;
  await db.batch([
    db.prepare(`DELETE FROM favorites WHERE property_id IN ${demoProps}`),
    db.prepare(`UPDATE leads SET property_id=NULL WHERE property_id IN ${demoProps}`),
    db.prepare(`DELETE FROM properties WHERE id IN ${demoProps}`),
    db.prepare("UPDATE leads SET project_id=NULL WHERE project_id IN (SELECT id FROM projects WHERE slug IN ('aurum-skyline-residences','lakeview-greens','marina-bay-towers','the-orchard-villas'))"),
    db.prepare("UPDATE properties SET project_id=NULL WHERE project_id IN (SELECT id FROM projects WHERE slug IN ('aurum-skyline-residences','lakeview-greens','marina-bay-towers','the-orchard-villas'))"),
    db.prepare("DELETE FROM projects WHERE slug IN ('aurum-skyline-residences','lakeview-greens','marina-bay-towers','the-orchard-villas')"),
    db.prepare(`UPDATE leads SET assigned_staff_id=NULL WHERE assigned_staff_id IN ${demoAgents}`),
    db.prepare(`UPDATE properties SET staff_id=NULL WHERE staff_id IN ${demoAgents}`),
    db.prepare("DELETE FROM staff WHERE email IN ('ananya@krishhomes.in','rahul@krishhomes.in','priya@krishhomes.in')"),
    db.prepare("DELETE FROM localities WHERE city_id IN (SELECT id FROM cities WHERE slug IN ('bengaluru','mumbai','delhi-ncr','pune','chennai') AND id NOT IN (SELECT city_id FROM properties) AND id NOT IN (SELECT city_id FROM projects WHERE city_id IS NOT NULL))"),
    db.prepare("DELETE FROM cities WHERE slug IN ('bengaluru','mumbai','delhi-ncr','pune','chennai') AND id NOT IN (SELECT city_id FROM properties) AND id NOT IN (SELECT city_id FROM projects WHERE city_id IS NOT NULL)"),
  ]);
}
