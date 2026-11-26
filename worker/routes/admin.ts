import { Hono } from "hono";
import type { HonoEnv } from "../env";
import { hashPassword, requireStaff } from "../auth";
import { insertProperty, normaliseProperty, updateProperty } from "../property";
import { bool, isEmail, isPhone, parseJson, slugify, str, strArray, toInt, randomId } from "../util";
import { shapeProp } from "./public";

export const admin = new Hono<HonoEnv>();
admin.use("*", requireStaff());
const mgr = requireStaff("super_admin", "admin");
const sup = requireStaff("super_admin");

const isMgr = (r: string) => r === "super_admin" || r === "admin";
const audit = (c: any, action: string, detail?: string) =>
  c.executionCtx.waitUntil(c.env.DB.prepare("INSERT INTO audit_log (staff_id,action,detail) VALUES (?,?,?)").bind(c.get("staff").id, action, detail ?? null).run());

admin.get("/stats", async (c) => {
  const s = c.get("staff")!;
  const db = c.env.DB;
  const own = !isMgr(s.role);
  const pw = own ? "WHERE staff_id=?" : ""; const pa = own ? [s.id] : [];
  const lw = own ? "WHERE assigned_staff_id=?" : ""; const la = own ? [s.id] : [];
  const [props, leads, users, byStatus, leadsByDay, recent, topCities] = await Promise.all([
    db.prepare(`SELECT COUNT(*) total, SUM(status='active') active, SUM(status='pending') pending, SUM(featured=1 AND status='active') featured, COALESCE(SUM(views),0) views FROM properties ${pw}`).bind(...pa).first(),
    db.prepare(`SELECT COUNT(*) total, SUM(status='new') new, SUM(created_at>=datetime('now','-7 days')) week, SUM(status='closed') won FROM leads ${lw}`).bind(...la).first(),
    isMgr(s.role) ? db.prepare("SELECT COUNT(*) total, SUM(created_at>=datetime('now','-7 days')) week FROM users").first() : Promise.resolve(null),
    db.prepare(`SELECT status, COUNT(*) n FROM leads ${lw} GROUP BY status`).bind(...la).all(),
    db.prepare(`SELECT date(created_at) d, COUNT(*) n FROM leads ${lw ? lw + " AND" : "WHERE"} created_at>=datetime('now','-14 days') GROUP BY d ORDER BY d`).bind(...la).all(),
    db.prepare(`SELECT l.id,l.kind,l.name,l.phone,l.status,l.created_at,p.title FROM leads l LEFT JOIN properties p ON p.id=l.property_id ${own ? "WHERE l.assigned_staff_id=?" : ""} ORDER BY l.created_at DESC LIMIT 6`).bind(...la).all(),
    db.prepare(`SELECT c.name, COUNT(*) n FROM properties p JOIN cities c ON c.id=p.city_id ${own ? "WHERE p.staff_id=? AND" : "WHERE"} p.status='active' GROUP BY c.id ORDER BY n DESC LIMIT 6`).bind(...pa).all(),
  ]);
  return c.json({ props, leads, users, leadsByStatus: byStatus.results, leadsByDay: leadsByDay.results, recentLeads: recent.results, topCities: topCities.results });
});

// ---- Properties
admin.get("/properties", async (c) => {
  const s = c.get("staff")!;
  const q = c.req.query();
  const where: string[] = []; const args: unknown[] = [];
  if (!isMgr(s.role)) { where.push("p.staff_id=?"); args.push(s.id); }
  if (q.status) { where.push("p.status=?"); args.push(q.status); }
  if (q.type === "sale" || q.type === "rent") { where.push("p.listing_type=?"); args.push(q.type); }
  if (q.q) { where.push("(p.title LIKE ? OR p.slug LIKE ? OR p.contact_name LIKE ?)"); const k = `%${q.q.slice(0, 60)}%`; args.push(k, k, k); }
  const limit = Math.min(toInt(q.limit) ?? 20, 100); const page = Math.max(toInt(q.page) ?? 1, 1);
  const W = where.length ? "WHERE " + where.join(" AND ") : "";
  const J = "FROM properties p JOIN cities c ON c.id=p.city_id LEFT JOIN localities l ON l.id=p.locality_id LEFT JOIN staff s ON s.id=p.staff_id LEFT JOIN users u ON u.id=p.user_id";
  const [rows, total] = await Promise.all([
    c.env.DB.prepare(`SELECT p.id,p.slug,p.title,p.listing_type,p.property_type,p.price,p.status,p.featured,p.verified,p.views,p.images,p.created_at,p.owner_type,p.reject_reason,c.name city_name,l.name locality_name,s.name agent_name,u.name poster_name,u.email poster_email,
      (SELECT COUNT(*) FROM leads WHERE property_id=p.id) leads ${J} ${W} ORDER BY (p.status='pending') DESC, p.created_at DESC LIMIT ? OFFSET ?`).bind(...args, limit, (page - 1) * limit).all(),
    c.env.DB.prepare(`SELECT COUNT(*) n ${J} ${W}`).bind(...args).first<{ n: number }>(),
  ]);
  return c.json({ items: rows.results.map(shapeProp), total: total?.n ?? 0, page, limit });
});
admin.get("/properties/:id", async (c) => {
  const s = c.get("staff")!;
  const r: any = await c.env.DB.prepare("SELECT * FROM properties WHERE id=?").bind(Number(c.req.param("id"))).first();
  if (!r || (!isMgr(s.role) && r.staff_id !== s.id)) return c.json({ error: "Not found" }, 404);
  return c.json({ ...r, images: parseJson(r.images, []), amenities: parseJson(r.amenities, []) });
});
admin.post("/properties", async (c) => {
  const s = c.get("staff")!;
  const b = await c.req.json().catch(() => ({}));
  const n = normaliseProperty(b);
  if ("error" in n) return c.json({ error: n.error }, 400);
  const staffId = isMgr(s.role) && toInt(b.staff_id) ? toInt(b.staff_id) : s.id;
  const owner_type = ["owner", "agent", "builder"].includes(b.owner_type) ? b.owner_type : "agent";
  const live = isMgr(s.role);
  const r = await insertProperty(c.env.DB, n.data, {
    staff_id: staffId, owner_type, status: live ? "active" : "pending", verified: live ? bool(b.verified) : 0, featured: live ? bool(b.featured) : 0,
    published_at: live ? new Date().toISOString().slice(0, 19).replace("T", " ") : null,
  });
  audit(c, "property.create", r.slug);
  return c.json(r, 201);
});
admin.put("/properties/:id", async (c) => {
  const s = c.get("staff")!;
  const id = Number(c.req.param("id"));
  const cur: any = await c.env.DB.prepare("SELECT staff_id,status FROM properties WHERE id=?").bind(id).first();
  if (!cur || (!isMgr(s.role) && cur.staff_id !== s.id)) return c.json({ error: "Not found" }, 404);
  const b = await c.req.json().catch(() => ({}));
  const n = normaliseProperty(b);
  if ("error" in n) return c.json({ error: n.error }, 400);
  const extra: Record<string, unknown> = {};
  if (isMgr(s.role)) {
    extra.featured = bool(b.featured); extra.verified = bool(b.verified);
    if (toInt(b.staff_id)) extra.staff_id = toInt(b.staff_id);
  } else if (cur.status === "active") extra.status = "pending";
  await updateProperty(c.env.DB, id, n.data, extra);
  audit(c, "property.update", String(id));
  return c.json({ ok: true });
});
admin.post("/properties/:id/status", mgr, async (c) => {
  const id = Number(c.req.param("id"));
  const b = await c.req.json().catch(() => ({}));
  const status = b.status;
  if (!["pending", "active", "rejected", "sold", "archived", "draft"].includes(status)) return c.json({ error: "Invalid status" }, 400);
  await c.env.DB.prepare(
    `UPDATE properties SET status=?, reject_reason=?, updated_at=datetime('now'), published_at=CASE WHEN ?='active' AND published_at IS NULL THEN datetime('now') ELSE published_at END WHERE id=?`,
  ).bind(status, status === "rejected" ? str(b.reason, 300) : null, status, id).run();
  if (b.verified !== undefined) await c.env.DB.prepare("UPDATE properties SET verified=? WHERE id=?").bind(bool(b.verified), id).run();
  if (b.featured !== undefined) await c.env.DB.prepare("UPDATE properties SET featured=? WHERE id=?").bind(bool(b.featured), id).run();
  audit(c, "property.status", `${id}:${status}`);
  return c.json({ ok: true });
});
admin.delete("/properties/:id", mgr, async (c) => {
  const id = Number(c.req.param("id"));
  await c.env.DB.batch([
    c.env.DB.prepare("DELETE FROM favorites WHERE property_id=?").bind(id),
    c.env.DB.prepare("UPDATE leads SET property_id=NULL WHERE property_id=?").bind(id),
    c.env.DB.prepare("DELETE FROM properties WHERE id=?").bind(id),
  ]);
  audit(c, "property.delete", String(id));
  return c.json({ ok: true });
});

// ---- Leads
admin.get("/leads", async (c) => {
  const s = c.get("staff")!;
  const q = c.req.query();
  const where: string[] = []; const args: unknown[] = [];
  if (!isMgr(s.role)) { where.push("l.assigned_staff_id=?"); args.push(s.id); }
  else if (q.assigned) { where.push("l.assigned_staff_id=?"); args.push(Number(q.assigned)); }
  if (q.status) { where.push("l.status=?"); args.push(q.status); }
  if (q.kind) { where.push("l.kind=?"); args.push(q.kind); }
  if (q.q) { where.push("(l.name LIKE ? OR l.phone LIKE ? OR l.email LIKE ?)"); const k = `%${q.q.slice(0, 60)}%`; args.push(k, k, k); }
  const limit = Math.min(toInt(q.limit) ?? 30, 200); const page = Math.max(toInt(q.page) ?? 1, 1);
  const W = where.length ? "WHERE " + where.join(" AND ") : "";
  const J = "FROM leads l LEFT JOIN properties p ON p.id=l.property_id LEFT JOIN projects pr ON pr.id=l.project_id LEFT JOIN staff s ON s.id=l.assigned_staff_id";
  const [rows, total] = await Promise.all([
    c.env.DB.prepare(`SELECT l.*,p.title property_title,p.slug property_slug,pr.name project_name,s.name assigned_name ${J} ${W} ORDER BY l.created_at DESC LIMIT ? OFFSET ?`).bind(...args, limit, (page - 1) * limit).all(),
    c.env.DB.prepare(`SELECT COUNT(*) n ${J} ${W}`).bind(...args).first<{ n: number }>(),
  ]);
  return c.json({ items: rows.results, total: total?.n ?? 0, page, limit });
});
admin.patch("/leads/:id", async (c) => {
  const s = c.get("staff")!;
  const id = Number(c.req.param("id"));
  const cur: any = await c.env.DB.prepare("SELECT assigned_staff_id FROM leads WHERE id=?").bind(id).first();
  if (!cur || (!isMgr(s.role) && cur.assigned_staff_id !== s.id)) return c.json({ error: "Not found" }, 404);
  const b = await c.req.json().catch(() => ({}));
  const sets: string[] = []; const args: unknown[] = [];
  if (b.status && ["new", "contacted", "qualified", "visit_done", "closed", "lost"].includes(b.status)) { sets.push("status=?"); args.push(b.status); }
  if (b.notes !== undefined) { sets.push("notes=?"); args.push(str(b.notes, 2000)); }
  if (isMgr(s.role) && b.assigned_staff_id !== undefined) { sets.push("assigned_staff_id=?"); args.push(toInt(b.assigned_staff_id)); }
  if (!sets.length) return c.json({ ok: true });
  await c.env.DB.prepare(`UPDATE leads SET ${sets.join(",")}, updated_at=datetime('now') WHERE id=?`).bind(...args, id).run();
  return c.json({ ok: true });
});
admin.get("/leads.csv", mgr, async (c) => {
  const rows = await c.env.DB.prepare(`SELECT l.id,l.created_at,l.kind,l.status,l.name,l.phone,l.email,l.message,p.title property FROM leads l LEFT JOIN properties p ON p.id=l.property_id ORDER BY l.created_at DESC LIMIT 5000`).all<any>();
  const esc = (v: unknown) => { let t = String(v ?? ""); if (/^[=+\-@]/.test(t)) t = "'" + t; return `"${t.replace(/"/g, '""')}"`; };
  const head = "id,created_at,kind,status,name,phone,email,message,property\n";
  return new Response(head + rows.results.map((r) => [r.id, r.created_at, r.kind, r.status, r.name, r.phone, r.email, r.message, r.property].map(esc).join(",")).join("\n"),
    { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=leads.csv" } });
});

// ---- Users (end users from Firebase)
admin.get("/users", mgr, async (c) => {
  const q = c.req.query("q");
  const rows = await c.env.DB.prepare(
    `SELECT u.id,u.name,u.email,u.phone,u.photo,u.blocked,u.created_at,u.last_seen_at,(SELECT COUNT(*) FROM properties WHERE user_id=u.id) listings,(SELECT COUNT(*) FROM leads WHERE user_id=u.id) enquiries
     FROM users u ${q ? "WHERE u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?" : ""} ORDER BY u.id DESC LIMIT 200`,
  ).bind(...(q ? [`%${q}%`, `%${q}%`, `%${q}%`] : [])).all();
  return c.json({ items: rows.results });
});
admin.post("/users/:id/block", mgr, async (c) => {
  const b = await c.req.json().catch(() => ({}));
  await c.env.DB.prepare("UPDATE users SET blocked=? WHERE id=?").bind(bool(b.blocked), Number(c.req.param("id"))).run();
  audit(c, "user.block", `${c.req.param("id")}:${b.blocked}`);
  return c.json({ ok: true });
});

// ---- Staff
admin.get("/staff", async (c) => {
  const s = c.get("staff")!;
  const rows = await c.env.DB.prepare(
    `SELECT id,email,name,phone,role,active,agency,rera_id,bio,photo,created_at,(SELECT COUNT(*) FROM properties WHERE staff_id=staff.id) listings,(SELECT COUNT(*) FROM leads WHERE assigned_staff_id=staff.id) leads FROM staff ${isMgr(s.role) ? "" : "WHERE role='agent'"} ORDER BY role, name`,
  ).all();
  return c.json({ items: rows.results });
});
admin.post("/staff", mgr, async (c) => {
  const me = c.get("staff")!;
  const b = await c.req.json().catch(() => ({}));
  const role = b.role;
  if (!["admin", "agent"].includes(role)) return c.json({ error: "Role must be admin or agent" }, 400);
  if (role === "admin" && me.role !== "super_admin") return c.json({ error: "Only a Super Admin can create admin managers" }, 403);
  const email = String(b.email ?? "").trim().toLowerCase(); const name = str(b.name, 80);
  if (!isEmail(email) || !name) return c.json({ error: "Name and a valid email are required" }, 400);
  const phone = str(b.phone, 20);
  if (phone && !isPhone(phone)) return c.json({ error: "Invalid phone" }, 400);
  const password = String(b.password ?? "") || randomId(10) + "A1";
  if (password.length < 8) return c.json({ error: "Password must be at least 8 characters" }, 400);
  const h = await hashPassword(password);
  try {
    await c.env.DB.prepare("INSERT INTO staff (email,name,phone,role,password_hash,salt,agency,rera_id,bio,must_change_password) VALUES (?,?,?,?,?,?,?,?,?,1)")
      .bind(email, name, phone, role, h.hash, h.salt, str(b.agency, 100), str(b.rera_id, 60), str(b.bio, 400)).run();
  } catch { return c.json({ error: "A staff member with this email already exists" }, 409); }
  audit(c, "staff.create", `${email}:${role}`);
  return c.json({ ok: true, temporaryPassword: b.password ? undefined : password }, 201);
});
admin.put("/staff/:id", mgr, async (c) => {
  const me = c.get("staff")!;
  const id = Number(c.req.param("id"));
  const t: any = await c.env.DB.prepare("SELECT role FROM staff WHERE id=?").bind(id).first();
  if (!t) return c.json({ error: "Not found" }, 404);
  if (t.role === "super_admin" && me.role !== "super_admin") return c.json({ error: "Not allowed" }, 403);
  if (t.role === "admin" && me.role !== "super_admin") return c.json({ error: "Only a Super Admin can edit admin managers" }, 403);
  const b = await c.req.json().catch(() => ({}));
  if (id === me.id && b.active === false) return c.json({ error: "You can't deactivate yourself" }, 400);
  await c.env.DB.prepare("UPDATE staff SET name=COALESCE(?,name),phone=?,agency=?,rera_id=?,bio=?,active=COALESCE(?,active) WHERE id=?")
    .bind(str(b.name, 80), str(b.phone, 20), str(b.agency, 100), str(b.rera_id, 60), str(b.bio, 400), b.active === undefined ? null : bool(b.active), id).run();
  if (b.password) {
    if (String(b.password).length < 8) return c.json({ error: "Password must be at least 8 characters" }, 400);
    const h = await hashPassword(String(b.password));
    await c.env.DB.prepare("UPDATE staff SET password_hash=?,salt=?,must_change_password=1 WHERE id=?").bind(h.hash, h.salt, id).run();
  }
  audit(c, "staff.update", String(id));
  return c.json({ ok: true });
});

// ---- Projects
admin.get("/projects", mgr, async (c) => {
  const rows = await c.env.DB.prepare("SELECT pr.*,c.name city_name FROM projects pr LEFT JOIN cities c ON c.id=pr.city_id ORDER BY pr.id DESC").all();
  return c.json({ items: rows.results.map((p: any) => ({ ...p, images: parseJson(p.images, []), amenities: parseJson(p.amenities, []) })) });
});
const projectData = (b: any) => ({
  name: str(b.name, 140), builder: str(b.builder, 100), city_id: toInt(b.city_id), locality_id: toInt(b.locality_id), address: str(b.address, 300),
  description: str(b.description, 4000), configurations: str(b.configurations, 120), price_min: toInt(b.price_min), price_max: toInt(b.price_max),
  area_min: toInt(b.area_min), area_max: toInt(b.area_max), possession: str(b.possession, 60), status: b.status === "inactive" ? "inactive" : "active",
  rera_id: str(b.rera_id, 60), total_units: toInt(b.total_units), amenities: JSON.stringify(strArray(b.amenities, 40, 60)), images: JSON.stringify(strArray(b.images, 20, 600)), featured: bool(b.featured),
});
admin.post("/projects", mgr, async (c) => {
  const d = projectData(await c.req.json().catch(() => ({})));
  if (!d.name) return c.json({ error: "Project name is required" }, 400);
  const all = { slug: `${slugify(d.name)}-${randomId(3)}`, ...d };
  const cols = Object.keys(all);
  await c.env.DB.prepare(`INSERT INTO projects (${cols.join(",")}) VALUES (${cols.map(() => "?").join(",")})`).bind(...Object.values(all)).run();
  return c.json({ ok: true }, 201);
});
admin.put("/projects/:id", mgr, async (c) => {
  const d = projectData(await c.req.json().catch(() => ({})));
  if (!d.name) return c.json({ error: "Project name is required" }, 400);
  const cols = Object.keys(d);
  await c.env.DB.prepare(`UPDATE projects SET ${cols.map((k) => `${k}=?`).join(",")} WHERE id=?`).bind(...Object.values(d), Number(c.req.param("id"))).run();
  return c.json({ ok: true });
});
admin.delete("/projects/:id", mgr, async (c) => {
  const id = Number(c.req.param("id"));
  await c.env.DB.batch([c.env.DB.prepare("UPDATE properties SET project_id=NULL WHERE project_id=?").bind(id), c.env.DB.prepare("UPDATE leads SET project_id=NULL WHERE project_id=?").bind(id), c.env.DB.prepare("DELETE FROM projects WHERE id=?").bind(id)]);
  return c.json({ ok: true });
});

// ---- Blog posts
admin.get("/posts", mgr, async (c) => c.json({ items: (await c.env.DB.prepare("SELECT * FROM posts ORDER BY created_at DESC").all()).results }));
admin.post("/posts", mgr, async (c) => {
  const b = await c.req.json().catch(() => ({}));
  const title = str(b.title, 160); const content = str(b.content, 40000);
  if (!title || !content) return c.json({ error: "Title and content are required" }, 400);
  await c.env.DB.prepare("INSERT INTO posts (slug,title,excerpt,content,cover,author,published) VALUES (?,?,?,?,?,?,?)")
    .bind(`${slugify(title)}-${randomId(3)}`, title, str(b.excerpt, 300), content, str(b.cover, 600), str(b.author, 80) ?? c.get("staff")!.name, b.published === false ? 0 : 1).run();
  return c.json({ ok: true }, 201);
});
admin.put("/posts/:id", mgr, async (c) => {
  const b = await c.req.json().catch(() => ({}));
  const title = str(b.title, 160); const content = str(b.content, 40000);
  if (!title || !content) return c.json({ error: "Title and content are required" }, 400);
  await c.env.DB.prepare("UPDATE posts SET title=?,excerpt=?,content=?,cover=?,author=?,published=? WHERE id=?")
    .bind(title, str(b.excerpt, 300), content, str(b.cover, 600), str(b.author, 80), b.published === false ? 0 : 1, Number(c.req.param("id"))).run();
  return c.json({ ok: true });
});
admin.delete("/posts/:id", mgr, async (c) => { await c.env.DB.prepare("DELETE FROM posts WHERE id=?").bind(Number(c.req.param("id"))).run(); return c.json({ ok: true }); });

// ---- Cities & localities
admin.post("/cities", mgr, async (c) => {
  const b = await c.req.json().catch(() => ({}));
  const name = str(b.name, 80);
  if (!name) return c.json({ error: "City name is required" }, 400);
  try {
    await c.env.DB.prepare("INSERT INTO cities (slug,name,state,image,featured) VALUES (?,?,?,?,?)").bind(slugify(name), name, str(b.state, 60), str(b.image, 600), bool(b.featured)).run();
  } catch { return c.json({ error: "City already exists" }, 409); }
  return c.json({ ok: true }, 201);
});
admin.put("/cities/:id", mgr, async (c) => {
  const b = await c.req.json().catch(() => ({}));
  await c.env.DB.prepare("UPDATE cities SET name=COALESCE(?,name),state=?,image=?,featured=? WHERE id=?").bind(str(b.name, 80), str(b.state, 60), str(b.image, 600), bool(b.featured), Number(c.req.param("id"))).run();
  return c.json({ ok: true });
});
admin.post("/localities", mgr, async (c) => {
  const b = await c.req.json().catch(() => ({}));
  const name = str(b.name, 80); const city = toInt(b.city_id);
  if (!name || !city) return c.json({ error: "City and locality name are required" }, 400);
  try {
    await c.env.DB.prepare("INSERT INTO localities (city_id,slug,name) VALUES (?,?,?)").bind(city, slugify(name), name).run();
  } catch { return c.json({ error: "Locality already exists in this city" }, 409); }
  return c.json({ ok: true }, 201);
});

// ---- Settings (brand) — super admin only
admin.put("/settings/brand", sup, async (c) => {
  const b = await c.req.json().catch(() => ({}));
  const allowed = ["name", "tagline", "phone", "email", "address", "whatsapp", "heroTitle", "heroSubtitle"];
  const out: Record<string, string> = {};
  for (const k of allowed) { const v = str(b[k], 300); if (v) out[k] = v; }
  await c.env.DB.prepare("INSERT INTO settings (key,value) VALUES ('brand',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(JSON.stringify(out)).run();
  audit(c, "settings.brand");
  return c.json({ ok: true });
});
admin.get("/audit", sup, async (c) => {
  const r = await c.env.DB.prepare("SELECT a.id,a.action,a.detail,a.created_at,s.name staff FROM audit_log a LEFT JOIN staff s ON s.id=a.staff_id ORDER BY a.id DESC LIMIT 100").all();
  return c.json({ items: r.results });
});
