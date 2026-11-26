import schema from "../migrations/0001_init.sql?raw";
import type { Env } from "./env";
import { hashPassword } from "./auth";
import { seedDemoData } from "./seed";

let ready: Promise<void> | null = null;

async function init(env: Env) {
  const db = env.DB;
  const t = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='staff'").first();
  if (!t) {
    const statements = schema
      .split(/;\s*\n/)
      .map((s) => s.replace(/^\s*--.*$/gm, "").trim())
      .filter(Boolean);
    await db.batch(statements.map((s) => db.prepare(s)));
  }
  const n = await db.prepare("SELECT COUNT(*) c FROM staff WHERE role='super_admin'").first<{ c: number }>();
  if (!n || n.c === 0) {
    const email = (env.SUPER_ADMIN_EMAIL || "admin@krishhomes.in").toLowerCase();
    const pw = env.SUPER_ADMIN_PASSWORD || "ChangeMe@123";
    const h = await hashPassword(pw);
    await db.prepare("INSERT OR IGNORE INTO staff (email,name,role,password_hash,salt,must_change_password) VALUES (?,?,?,?,?,?)")
      .bind(email, "Super Admin", "super_admin", h.hash, h.salt, env.SUPER_ADMIN_PASSWORD ? 0 : 1).run();
  }
  await seedDemoData(db, (p) => hashPassword(p));
}

/** Creates the schema + demo data on first request. Cheap no-op afterwards. */
export function ensureDb(env: Env) {
  if (!ready) ready = init(env).catch((e) => { ready = null; throw e; });
  return ready;
}
