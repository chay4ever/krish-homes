import { SignJWT, jwtVerify, createRemoteJWKSet } from "jose";
import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import type { Env, HonoEnv, StaffSession, AppUser } from "./env";

const enc = new TextEncoder();
const b64 = (buf: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(buf as ArrayBuffer)));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export async function hashPassword(password: string, saltB64?: string) {
  const salt = saltB64 ? unb64(saltB64) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  // Workers WebCrypto caps PBKDF2 iterations at 100,000.
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 100000 }, key, 256);
  return { hash: b64(bits), salt: b64(salt) };
}

export async function verifyPassword(password: string, hash: string, salt: string) {
  const r = await hashPassword(password, salt);
  if (r.hash.length !== hash.length) return false;
  let d = 0;
  for (let i = 0; i < hash.length; i++) d |= r.hash.charCodeAt(i) ^ hash.charCodeAt(i);
  return d === 0;
}

let secretCache: Uint8Array | null = null;
async function jwtKey(env: Env): Promise<Uint8Array> {
  if (env.JWT_SECRET) return enc.encode(env.JWT_SECRET);
  if (secretCache) return secretCache;
  let row = await env.DB.prepare("SELECT value FROM settings WHERE key='jwt_secret'").first<{ value: string }>();
  if (!row) {
    const v = b64(crypto.getRandomValues(new Uint8Array(48)));
    await env.DB.prepare("INSERT OR IGNORE INTO settings (key,value) VALUES ('jwt_secret',?)").bind(v).run();
    row = await env.DB.prepare("SELECT value FROM settings WHERE key='jwt_secret'").first<{ value: string }>();
  }
  secretCache = enc.encode(row!.value);
  return secretCache;
}

export const STAFF_COOKIE = "kh_staff";

export async function signStaffToken(env: Env, s: StaffSession) {
  return new SignJWT({ role: s.role, name: s.name, email: s.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(s.id))
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(await jwtKey(env));
}

export async function readStaff(c: Context<HonoEnv>): Promise<StaffSession | null> {
  const tok = getCookie(c, STAFF_COOKIE);
  if (!tok) return null;
  try {
    const { payload } = await jwtVerify(tok, await jwtKey(c.env), { algorithms: ["HS256"] });
    const row = await c.env.DB.prepare(
      "SELECT id,email,name,role,must_change_password,active FROM staff WHERE id=?",
    ).bind(Number(payload.sub)).first<StaffSession & { active: number }>();
    if (!row || !row.active) return null;
    return { id: row.id, email: row.email, name: row.name, role: row.role, must_change_password: row.must_change_password };
  } catch {
    return null;
  }
}

export const requireStaff = (...roles: StaffSession["role"][]) => async (c: Context<HonoEnv>, next: Next) => {
  const s = await readStaff(c);
  if (!s) return c.json({ error: "Please sign in" }, 401);
  if (roles.length && !roles.includes(s.role)) return c.json({ error: "You don't have permission to do this" }, 403);
  c.set("staff", s);
  await next();
};

const jwks = createRemoteJWKSet(new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"));

export interface FirebaseCfg { apiKey: string; authDomain: string; projectId: string; appId?: string }

/** Firebase web config: saved in D1 by the Super Admin (Settings) first, Worker env vars as fallback. Null = not configured. */
export async function getFirebaseConfig(env: Env): Promise<FirebaseCfg | null> {
  const row = await env.DB.prepare("SELECT value FROM settings WHERE key='firebase'").first<{ value: string }>();
  let c: Partial<FirebaseCfg> = {};
  try { c = row ? JSON.parse(row.value) : {}; } catch { /* ignore */ }
  const apiKey = c.apiKey || env.FIREBASE_API_KEY;
  const projectId = c.projectId || env.FIREBASE_PROJECT_ID;
  if (!apiKey || !projectId) return null;
  return { apiKey, projectId, authDomain: c.authDomain || env.FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`, appId: c.appId || env.FIREBASE_APP_ID || undefined };
}

export async function verifyFirebase(env: Env, token: string) {
  const pid = (await getFirebaseConfig(env))?.projectId;
  if (!pid) throw new Error("Firebase is not configured");
  const { payload } = await jwtVerify(token, jwks, { issuer: `https://securetoken.google.com/${pid}`, audience: pid });
  return payload as { sub: string; email?: string; name?: string; picture?: string; phone_number?: string };
}

export const USER_COOKIE = "kh_user";

export async function signUserToken(env: Env, id: number) {
  return new SignJWT({ k: "user" }).setProtectedHeader({ alg: "HS256" }).setSubject(String(id)).setIssuedAt().setExpirationTime("30d").sign(await jwtKey(env));
}

async function localUser(c: Context<HonoEnv>): Promise<AppUser | null> {
  const tok = getCookie(c, USER_COOKIE);
  if (!tok) return null;
  try {
    const { payload } = await jwtVerify(tok, await jwtKey(c.env), { algorithms: ["HS256"] });
    if (payload.k !== "user") return null;
    const u = await c.env.DB.prepare("SELECT id,firebase_uid,name,email,phone,photo,blocked FROM users WHERE id=?").bind(Number(payload.sub)).first<AppUser>();
    return u && !u.blocked ? u : null;
  } catch { return null; }
}

export async function userFromRequest(c: Context<HonoEnv>): Promise<AppUser | null> {
  const h = c.req.header("Authorization");
  if (!h?.startsWith("Bearer ")) return localUser(c);
  try {
    const p = await verifyFirebase(c.env, h.slice(7));
    const db = c.env.DB;
    let u = await db.prepare("SELECT * FROM users WHERE firebase_uid=?").bind(p.sub).first<AppUser>();
    if (!u) {
      await db.prepare("INSERT OR IGNORE INTO users (firebase_uid,name,email,phone,photo,last_seen_at) VALUES (?,?,?,?,?,datetime('now'))")
        .bind(p.sub, p.name ?? null, p.email ?? null, p.phone_number ?? null, p.picture ?? null).run();
      u = await db.prepare("SELECT * FROM users WHERE firebase_uid=?").bind(p.sub).first<AppUser>();
    } else {
      // Fill gaps from the identity provider; keep user-edited values.
      await db.prepare("UPDATE users SET email=COALESCE(email,?), phone=COALESCE(phone,?), photo=COALESCE(photo,?), name=COALESCE(name,?), last_seen_at=datetime('now') WHERE id=?")
        .bind(p.email ?? null, p.phone_number ?? null, p.picture ?? null, p.name ?? null, u.id).run();
      u = await db.prepare("SELECT * FROM users WHERE id=?").bind(u.id).first<AppUser>();
    }
    return u && !u.blocked ? u : null;
  } catch {
    return null;
  }
}

export const requireUser = async (c: Context<HonoEnv>, next: Next) => {
  const u = await userFromRequest(c);
  if (!u) return c.json({ error: "Please sign in to continue" }, 401);
  c.set("user", u);
  await next();
};
