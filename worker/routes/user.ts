import { Hono } from "hono";
import type { HonoEnv } from "../env";
import { requireUser } from "../auth";
import { insertProperty, normaliseProperty, updateProperty } from "../property";
import { parseJson, str, isPhone, rateLimit } from "../util";
import { shapeProp } from "./public";

export const user = new Hono<HonoEnv>();
user.use("*", requireUser);

const LIST_COLS = `p.id,p.slug,p.title,p.listing_type,p.property_type,p.bedrooms,p.bathrooms,p.area_sqft,p.price,p.images,p.featured,p.verified,p.status,p.reject_reason,p.views,p.created_at,p.possession,p.furnishing,p.owner_type,p.category,p.negotiable,p.facing,p.floor,p.total_floors,p.address,p.published_at,p.deposit,p.maintenance,p.age_years,p.plot_area,
  c.name city_name,c.slug city_slug,l.name locality_name,l.slug locality_slug`;
const JOIN = "FROM properties p JOIN cities c ON c.id=p.city_id LEFT JOIN localities l ON l.id=p.locality_id";

user.get("/me", (c) => c.json({ user: c.get("user") }));
user.put("/me", async (c) => {
  const u = c.get("user")!;
  const b = await c.req.json().catch(() => ({}));
  const phone = str(b.phone, 20);
  if (phone && !isPhone(phone)) return c.json({ error: "Enter a valid phone number" }, 400);
  await c.env.DB.prepare("UPDATE users SET name=COALESCE(?,name), phone=COALESCE(?,phone), email=COALESCE(?,email) WHERE id=?")
    .bind(str(b.name, 80), phone, str(b.email, 120), u.id).run();
  return c.json({ user: await c.env.DB.prepare("SELECT * FROM users WHERE id=?").bind(u.id).first() });
});

user.get("/favorites", async (c) => {
  const rows = await c.env.DB.prepare(`SELECT ${LIST_COLS} ${JOIN} JOIN favorites f ON f.property_id=p.id WHERE f.user_id=? AND p.status='active' ORDER BY f.created_at DESC`).bind(c.get("user")!.id).all();
  return c.json({ items: rows.results.map(shapeProp) });
});
user.get("/favorites/ids", async (c) => {
  const rows = await c.env.DB.prepare("SELECT property_id FROM favorites WHERE user_id=?").bind(c.get("user")!.id).all<{ property_id: number }>();
  return c.json({ ids: rows.results.map((r) => r.property_id) });
});
user.put("/favorites/:id", async (c) => {
  await c.env.DB.prepare("INSERT OR IGNORE INTO favorites (user_id,property_id) VALUES (?,?)").bind(c.get("user")!.id, Number(c.req.param("id"))).run();
  return c.json({ ok: true });
});
user.delete("/favorites/:id", async (c) => {
  await c.env.DB.prepare("DELETE FROM favorites WHERE user_id=? AND property_id=?").bind(c.get("user")!.id, Number(c.req.param("id"))).run();
  return c.json({ ok: true });
});

user.get("/properties", async (c) => {
  const rows = await c.env.DB.prepare(`SELECT ${LIST_COLS},(SELECT COUNT(*) FROM leads WHERE property_id=p.id) AS leads ${JOIN} WHERE p.user_id=? ORDER BY p.created_at DESC`).bind(c.get("user")!.id).all();
  return c.json({ items: rows.results.map(shapeProp) });
});
user.get("/properties/:id", async (c) => {
  const r: any = await c.env.DB.prepare("SELECT * FROM properties WHERE id=? AND user_id=?").bind(Number(c.req.param("id")), c.get("user")!.id).first();
  if (!r) return c.json({ error: "Not found" }, 404);
  return c.json({ ...r, images: parseJson(r.images, []), amenities: parseJson(r.amenities, []) });
});
user.post("/properties", async (c) => {
  const u = c.get("user")!;
  if (!rateLimit(`post:${u.id}`, 10, 60 * 60_000)) return c.json({ error: "You're posting too fast. Try again later." }, 429);
  const b = await c.req.json().catch(() => null);
  const n = normaliseProperty(b ?? {});
  if ("error" in n) return c.json({ error: n.error }, 400);
  if (!n.data.contact_phone) n.data.contact_phone = u.phone;
  if (!n.data.contact_name) n.data.contact_name = u.name;
  const owner_type = ["owner", "agent", "builder"].includes(b.owner_type) ? b.owner_type : "owner";
  const r = await insertProperty(c.env.DB, n.data, { user_id: u.id, owner_type, status: "pending" });
  return c.json(r, 201);
});
user.put("/properties/:id", async (c) => {
  const u = c.get("user")!;
  const id = Number(c.req.param("id"));
  const own = await c.env.DB.prepare("SELECT id,status FROM properties WHERE id=? AND user_id=?").bind(id, u.id).first<{ id: number; status: string }>();
  if (!own) return c.json({ error: "Not found" }, 404);
  const b = await c.req.json().catch(() => null);
  const n = normaliseProperty(b ?? {});
  if ("error" in n) return c.json({ error: n.error }, 400);
  // Edits to a live listing go back to review so unverified changes never go straight out.
  await updateProperty(c.env.DB, id, n.data, { status: own.status === "archived" ? "archived" : "pending", verified: 0 });
  return c.json({ ok: true });
});
user.post("/properties/:id/status", async (c) => {
  const b = await c.req.json().catch(() => ({}));
  const status = b.status;
  if (!["sold", "archived"].includes(status)) return c.json({ error: "Invalid status" }, 400);
  const r = await c.env.DB.prepare("UPDATE properties SET status=?, updated_at=datetime('now') WHERE id=? AND user_id=?").bind(status, Number(c.req.param("id")), c.get("user")!.id).run();
  return c.json({ ok: r.meta.changes > 0 });
});
user.delete("/properties/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const u = c.get("user")!;
  const own = await c.env.DB.prepare("SELECT id FROM properties WHERE id=? AND user_id=?").bind(id, u.id).first();
  if (!own) return c.json({ error: "Not found" }, 404);
  await c.env.DB.batch([
    c.env.DB.prepare("DELETE FROM favorites WHERE property_id=?").bind(id),
    c.env.DB.prepare("UPDATE leads SET property_id=NULL WHERE property_id=?").bind(id),
    c.env.DB.prepare("DELETE FROM properties WHERE id=?").bind(id),
  ]);
  return c.json({ ok: true });
});

// Enquiries the user has sent + enquiries received on their own listings
user.get("/leads", async (c) => {
  const u = c.get("user")!;
  const sent = await c.env.DB.prepare(`SELECT l.id,l.kind,l.status,l.message,l.visit_at,l.created_at,p.title,p.slug FROM leads l LEFT JOIN properties p ON p.id=l.property_id WHERE l.user_id=? ORDER BY l.created_at DESC LIMIT 100`).bind(u.id).all();
  const received = await c.env.DB.prepare(`SELECT l.id,l.kind,l.name,l.phone,l.email,l.message,l.visit_at,l.created_at,p.title,p.slug FROM leads l JOIN properties p ON p.id=l.property_id WHERE p.user_id=? ORDER BY l.created_at DESC LIMIT 100`).bind(u.id).all();
  return c.json({ sent: sent.results, received: received.results });
});

// Reveal seller contact (login required; recorded as a lead so we can follow up)
user.post("/contact/:slug", async (c) => {
  const u = c.get("user")!;
  if (!rateLimit(`reveal:${u.id}`, 30, 60 * 60_000)) return c.json({ error: "Limit reached for now. Try again later." }, 429);
  const p = await c.env.DB.prepare(
    "SELECT p.id,p.staff_id,p.contact_name,p.contact_phone,s.name sname,s.phone sphone FROM properties p LEFT JOIN staff s ON s.id=p.staff_id WHERE p.slug=? AND p.status='active'",
  ).bind(c.req.param("slug")).first<any>();
  if (!p) return c.json({ error: "Listing not found" }, 404);
  const existing = await c.env.DB.prepare("SELECT id FROM leads WHERE property_id=? AND user_id=? AND kind='callback'").bind(p.id, u.id).first();
  if (!existing) {
    await c.env.DB.prepare("INSERT INTO leads (kind,property_id,user_id,name,phone,email,assigned_staff_id,source,message) VALUES ('callback',?,?,?,?,?,?,'contact-reveal','Viewed contact details')")
      .bind(p.id, u.id, u.name ?? "Guest", u.phone ?? "—", u.email, p.staff_id).run();
  }
  return c.json({ name: p.contact_name ?? p.sname, phone: p.contact_phone ?? p.sphone });
});

user.get("/saved-searches", async (c) => {
  const r = await c.env.DB.prepare("SELECT id,name,query,created_at FROM saved_searches WHERE user_id=? ORDER BY id DESC").bind(c.get("user")!.id).all();
  return c.json({ items: r.results });
});
user.post("/saved-searches", async (c) => {
  const b = await c.req.json().catch(() => ({}));
  const name = str(b.name, 80); const query = str(b.query, 1000);
  if (!name || query === null) return c.json({ error: "Name required" }, 400);
  await c.env.DB.prepare("INSERT INTO saved_searches (user_id,name,query) VALUES (?,?,?)").bind(c.get("user")!.id, name, query).run();
  return c.json({ ok: true }, 201);
});
user.delete("/saved-searches/:id", async (c) => {
  await c.env.DB.prepare("DELETE FROM saved_searches WHERE id=? AND user_id=?").bind(Number(c.req.param("id")), c.get("user")!.id).run();
  return c.json({ ok: true });
});
