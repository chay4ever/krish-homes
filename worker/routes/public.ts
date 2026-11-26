import { Hono } from "hono";
import type { HonoEnv } from "../env";
import { getFirebaseConfig, userFromRequest } from "../auth";
import { DEFAULT_BRAND } from "../../shared/constants";
import { parseJson, str, isPhone, isEmail, rateLimit, toInt } from "../util";

export const pub = new Hono<HonoEnv>();

const PROP_COLS = `p.id,p.slug,p.title,p.listing_type,p.category,p.property_type,p.bedrooms,p.bathrooms,p.area_sqft,p.plot_area,p.price,p.maintenance,p.deposit,p.negotiable,
  p.furnishing,p.facing,p.floor,p.total_floors,p.age_years,p.possession,p.images,p.featured,p.verified,p.views,p.owner_type,p.status,p.published_at,p.created_at,
  c.name city_name,c.slug city_slug,l.name locality_name,l.slug locality_slug,p.address`;
const PROP_JOIN = `FROM properties p JOIN cities c ON c.id=p.city_id LEFT JOIN localities l ON l.id=p.locality_id`;

export const shapeProp = (r: any) => ({ ...r, images: parseJson<string[]>(r.images, []), amenities: r.amenities !== undefined ? parseJson<string[]>(r.amenities, []) : undefined });

export async function getBrand(db: D1Database) {
  const row = await db.prepare("SELECT value FROM settings WHERE key='brand'").first<{ value: string }>();
  return { ...DEFAULT_BRAND, ...parseJson(row?.value, {}) };
}

pub.get("/config", async (c) => {
  const e = c.env;
  const firebase = await getFirebaseConfig(e);
  return c.json({ brand: await getBrand(e.DB), firebase });
});

pub.get("/meta", async (c) => {
  const db = c.env.DB;
  const [cities, localities] = await Promise.all([
    db.prepare("SELECT id,slug,name,state,image,featured,(SELECT COUNT(*) FROM properties p WHERE p.city_id=cities.id AND p.status='active') AS listings FROM cities ORDER BY (state!='Andhra Pradesh'), name").all(),
    db.prepare("SELECT id,city_id,slug,name FROM localities ORDER BY name").all(),
  ]);
  c.header("Cache-Control", "public, max-age=120");
  return c.json({ cities: cities.results, localities: localities.results });
});

pub.get("/home", async (c) => {
  const db = c.env.DB;
  const citySlug = c.req.query("city") || "";
  const city = citySlug ? await db.prepare("SELECT id,slug,name,state FROM cities WHERE slug=?").bind(citySlug).first<{ id: number; slug: string; name: string; state: string }>() : null;
  const cw = city ? "AND p.city_id=?" : ""; const ca = city ? [city.id] : [];
  const list = async (extra: string, limit: number) => {
    const q = (scoped: boolean) => db.prepare(`SELECT ${PROP_COLS} ${PROP_JOIN} WHERE p.status='active' ${extra} ${scoped ? cw : ""} ORDER BY p.featured DESC, p.published_at DESC LIMIT ?`).bind(...(scoped ? ca : []), limit).all();
    let r = await q(!!city);
    // Nothing in this city yet? show the best of everywhere rather than an empty section.
    if (city && r.results.length === 0) r = await q(false);
    return r.results.map(shapeProp);
  };
  const [featured, latestSale, latestRent, owner, projects, posts, stats, types, localities, nearby] = await Promise.all([
    list("AND p.featured=1", 10), list("AND p.listing_type='sale'", 8), list("AND p.listing_type='rent'", 8), list("AND p.owner_type='owner'", 8),
    db.prepare(`SELECT pr.id,pr.slug,pr.name,pr.builder,pr.configurations,pr.price_min,pr.price_max,pr.possession,pr.images,c.name city_name,l.name locality_name FROM projects pr LEFT JOIN cities c ON c.id=pr.city_id LEFT JOIN localities l ON l.id=pr.locality_id WHERE pr.status='active' ${city ? "AND pr.city_id=?" : ""} ORDER BY pr.featured DESC, pr.id DESC LIMIT 6`).bind(...(city ? [city.id] : [])).all(),
    db.prepare("SELECT slug,title,excerpt,cover,author,created_at FROM posts WHERE published=1 ORDER BY created_at DESC LIMIT 3").all(),
    db.prepare(`SELECT COUNT(*) AS properties, SUM(owner_type='owner') AS owners, SUM(listing_type='sale') AS sale, SUM(listing_type='rent') AS rent FROM properties p WHERE p.status='active' ${cw}`).bind(...ca).first(),
    db.prepare(`SELECT p.property_type AS type, p.category, p.listing_type, COUNT(*) AS n FROM properties p WHERE p.status='active' ${cw} GROUP BY p.property_type, p.category, p.listing_type`).bind(...ca).all(),
    city ? db.prepare("SELECT l.name,l.slug,COUNT(p.id) AS n FROM localities l LEFT JOIN properties p ON p.locality_id=l.id AND p.status='active' WHERE l.city_id=? GROUP BY l.id ORDER BY n DESC, l.name LIMIT 12").bind(city.id).all() : Promise.resolve({ results: [] }),
    db.prepare("SELECT c.slug,c.name,c.state,c.image,(SELECT COUNT(*) FROM properties p WHERE p.city_id=c.id AND p.status='active') AS listings FROM cities c ORDER BY listings DESC, c.name LIMIT 16").all(),
  ]);
  return c.json({
    city, featured, latestSale, latestRent, owner, projects: projects.results.map((p: any) => ({ ...p, images: parseJson(p.images, []) })), posts: posts.results, stats, types: types.results, localities: localities.results, cities: nearby.results,
  });
});

const SORTS: Record<string, string> = {
  new: "p.published_at DESC, p.id DESC",
  price_asc: "p.price ASC",
  price_desc: "p.price DESC",
  area_desc: "p.area_sqft DESC",
  popular: "p.views DESC",
  featured: "p.featured DESC, p.published_at DESC",
};

export function buildSearch(q: Record<string, string | string[] | undefined>) {
  const where: string[] = ["p.status='active'"];
  const args: unknown[] = [];
  const one = (k: string) => { const v = q[k]; return Array.isArray(v) ? v[0] : v; };
  const many = (k: string) => (one(k) ? one(k)!.split(",").filter(Boolean) : []);

  const lt = one("type");
  if (lt === "sale" || lt === "rent") { where.push("p.listing_type=?"); args.push(lt); }
  const cat = one("category");
  if (cat === "residential" || cat === "commercial" || cat === "plot") { where.push("p.category=?"); args.push(cat); }
  const city = one("city");
  if (city) { where.push("c.slug=?"); args.push(city); }
  const locs = many("locality");
  if (locs.length) { where.push(`l.slug IN (${locs.map(() => "?").join(",")})`); args.push(...locs); }
  const pts = many("pt");
  if (pts.length) { where.push(`p.property_type IN (${pts.map(() => "?").join(",")})`); args.push(...pts); }
  const beds = many("beds").map(Number).filter((n) => n > 0);
  if (beds.length) {
    const parts = beds.map((b) => (b >= 4 ? "p.bedrooms>=4" : "p.bedrooms=?"));
    where.push(`(${parts.join(" OR ")})`);
    beds.filter((b) => b < 4).forEach((b) => args.push(b));
  }
  const min = toInt(one("min")); const max = toInt(one("max"));
  if (min) { where.push("p.price>=?"); args.push(min); }
  if (max) { where.push("p.price<=?"); args.push(max); }
  const amin = toInt(one("amin")); const amax = toInt(one("amax"));
  if (amin) { where.push("p.area_sqft>=?"); args.push(amin); }
  if (amax) { where.push("p.area_sqft<=?"); args.push(amax); }
  const furn = many("furnishing");
  if (furn.length) { where.push(`p.furnishing IN (${furn.map(() => "?").join(",")})`); args.push(...furn); }
  if (one("poss") === "ready" || one("poss") === "under_construction") { where.push("p.possession=?"); args.push(one("poss")); }
  if (one("verified") === "1") where.push("p.verified=1");
  if (one("owner") === "1") where.push("p.owner_type='owner'");
  const kw = str(one("q"), 80);
  if (kw) {
    where.push("(p.title LIKE ? OR l.name LIKE ? OR c.name LIKE ? OR p.address LIKE ?)");
    const k = `%${kw}%`; args.push(k, k, k, k);
  }
  const order = SORTS[one("sort") ?? "new"] ?? SORTS.new;
  return { where: where.join(" AND "), args, order };
}

pub.get("/properties", async (c) => {
  const db = c.env.DB;
  const q = c.req.query();
  const { where, args, order } = buildSearch(q);
  const limit = Math.min(Math.max(toInt(q.limit) ?? 12, 1), 40);
  const page = Math.max(toInt(q.page) ?? 1, 1);
  const [rows, total] = await Promise.all([
    db.prepare(`SELECT ${PROP_COLS} ${PROP_JOIN} WHERE ${where} ORDER BY ${order} LIMIT ? OFFSET ?`).bind(...args, limit, (page - 1) * limit).all(),
    db.prepare(`SELECT COUNT(*) n ${PROP_JOIN} WHERE ${where}`).bind(...args).first<{ n: number }>(),
  ]);
  return c.json({ items: rows.results.map(shapeProp), total: total?.n ?? 0, page, limit });
});

pub.get("/properties/:slug", async (c) => {
  const db = c.env.DB;
  const slug = c.req.param("slug");
  const row: any = await db.prepare(
    `SELECT p.*,c.name city_name,c.slug city_slug,l.name locality_name,l.slug locality_slug,
      s.name agent_name,s.phone agent_phone,s.photo agent_photo,s.agency agent_agency,s.rera_id agent_rera,s.id agent_id,
      pr.name project_name,pr.slug project_slug
     FROM properties p JOIN cities c ON c.id=p.city_id LEFT JOIN localities l ON l.id=p.locality_id
     LEFT JOIN staff s ON s.id=p.staff_id LEFT JOIN projects pr ON pr.id=p.project_id
     WHERE p.slug=?`,
  ).bind(slug).first();
  if (!row) return c.json({ error: "Property not found" }, 404);
  const user = await userFromRequest(c);
  const isOwner = user && row.user_id === user.id;
  if (row.status !== "active" && !isOwner) return c.json({ error: "This listing is no longer available" }, 404);
  c.executionCtx.waitUntil(db.prepare("UPDATE properties SET views=views+1 WHERE id=?").bind(row.id).run());
  const { user_id, staff_id, ...safe } = row;
  const similar = await db.prepare(
    `SELECT ${PROP_COLS} ${PROP_JOIN} WHERE p.status='active' AND p.id!=? AND p.listing_type=? AND p.city_id=? ORDER BY (p.property_type=?) DESC, ABS(p.price-?) ASC LIMIT 6`,
  ).bind(row.id, row.listing_type, row.city_id, row.property_type, row.price).all();
  let saved = false;
  if (user) saved = !!(await db.prepare("SELECT 1 x FROM favorites WHERE user_id=? AND property_id=?").bind(user.id, row.id).first());
  // Seller contact is only revealed through the enquiry flow; expose the public agent card only.
  const { contact_phone, contact_name, ...rest } = safe;
  return c.json({ ...shapeProp(rest), contact_name, similar: similar.results.map(shapeProp), saved });
});

pub.get("/projects", async (c) => {
  const city = c.req.query("city");
  const rows = await c.env.DB.prepare(
    `SELECT pr.id,pr.slug,pr.name,pr.builder,pr.configurations,pr.price_min,pr.price_max,pr.area_min,pr.area_max,pr.possession,pr.images,pr.total_units,c.name city_name,c.slug city_slug,l.name locality_name
     FROM projects pr LEFT JOIN cities c ON c.id=pr.city_id LEFT JOIN localities l ON l.id=pr.locality_id
     WHERE pr.status='active' ${city ? "AND c.slug=?" : ""} ORDER BY pr.featured DESC, pr.id DESC`,
  ).bind(...(city ? [city] : [])).all();
  return c.json({ items: rows.results.map((p: any) => ({ ...p, images: parseJson(p.images, []) })) });
});

pub.get("/projects/:slug", async (c) => {
  const db = c.env.DB;
  const p: any = await db.prepare(
    `SELECT pr.*,c.name city_name,c.slug city_slug,l.name locality_name FROM projects pr LEFT JOIN cities c ON c.id=pr.city_id LEFT JOIN localities l ON l.id=pr.locality_id WHERE pr.slug=? AND pr.status='active'`,
  ).bind(c.req.param("slug")).first();
  if (!p) return c.json({ error: "Project not found" }, 404);
  const props = await db.prepare(`SELECT ${PROP_COLS} ${PROP_JOIN} WHERE p.status='active' AND p.project_id=? LIMIT 12`).bind(p.id).all();
  return c.json({ ...p, images: parseJson(p.images, []), amenities: parseJson(p.amenities, []), properties: props.results.map(shapeProp) });
});

pub.get("/agents", async (c) => {
  const rows = await c.env.DB.prepare(
    `SELECT s.id,s.name,s.photo,s.agency,s.bio,s.rera_id,(SELECT COUNT(*) FROM properties p WHERE p.staff_id=s.id AND p.status='active') AS listings
     FROM staff s WHERE s.role='agent' AND s.active=1 ORDER BY listings DESC, s.name`,
  ).all();
  return c.json({ items: rows.results });
});

pub.get("/posts", async (c) => {
  const rows = await c.env.DB.prepare("SELECT slug,title,excerpt,cover,author,created_at FROM posts WHERE published=1 ORDER BY created_at DESC").all();
  return c.json({ items: rows.results });
});
pub.get("/posts/:slug", async (c) => {
  const r = await c.env.DB.prepare("SELECT * FROM posts WHERE slug=? AND published=1").bind(c.req.param("slug")).first();
  return r ? c.json(r) : c.json({ error: "Not found" }, 404);
});

// Lead capture (enquiry / visit / callback). Auth optional; Firebase user is linked when present.
pub.post("/leads", async (c) => {
  const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
  if (!rateLimit(`lead:${ip}`, 8, 10 * 60_000)) return c.json({ error: "Too many requests. Please try again in a few minutes." }, 429);
  const b = await c.req.json().catch(() => null);
  if (!b) return c.json({ error: "Invalid request" }, 400);
  const name = str(b.name, 80); const phone = str(b.phone, 20); const email = str(b.email, 120);
  if (!name) return c.json({ error: "Please enter your name" }, 400);
  if (!phone || !isPhone(phone)) return c.json({ error: "Please enter a valid phone number" }, 400);
  if (email && !isEmail(email)) return c.json({ error: "Please enter a valid email" }, 400);
  const kind = ["enquiry", "visit", "callback", "general"].includes(b.kind) ? b.kind : "enquiry";
  const db = c.env.DB;
  let propertyId: number | null = null; let projectId: number | null = null; let assigned: number | null = null;
  if (b.propertySlug) {
    const p = await db.prepare("SELECT id,staff_id FROM properties WHERE slug=? AND status='active'").bind(String(b.propertySlug)).first<{ id: number; staff_id: number | null }>();
    if (!p) return c.json({ error: "Listing not found" }, 404);
    propertyId = p.id; assigned = p.staff_id;
  }
  if (b.projectSlug) {
    const p = await db.prepare("SELECT id FROM projects WHERE slug=?").bind(String(b.projectSlug)).first<{ id: number }>();
    projectId = p?.id ?? null;
  }
  const user = await userFromRequest(c);
  await db.prepare(
    "INSERT INTO leads (kind,property_id,project_id,user_id,name,phone,email,message,visit_at,assigned_staff_id,source) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
  ).bind(kind, propertyId, projectId, user?.id ?? null, name, phone, email, str(b.message, 1000), str(b.visitAt, 40), assigned, str(b.source, 40) ?? "web").run();
  return c.json({ ok: true });
});

