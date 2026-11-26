import { Hono } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";
import type { HonoEnv } from "../env";
import { USER_COOKIE, getFirebaseConfig, hashPassword, signUserToken, verifyPassword } from "../auth";
import { isEmail, isPhone, rateLimit, str } from "../util";

/** Built-in email + password sign-in for visitors. Used while Firebase isn't configured (and still works alongside it). */
export const userAuth = new Hono<HonoEnv>();

const setSession = async (c: any, id: number) =>
  setCookie(c, USER_COOKIE, await signUserToken(c.env, id), { httpOnly: true, secure: new URL(c.req.url).protocol === "https:", sameSite: "Lax", path: "/", maxAge: 30 * 24 * 3600 });

userAuth.get("/mode", async (c) => c.json({ firebase: !!(await getFirebaseConfig(c.env)) }));

userAuth.post("/register", async (c) => {
  const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
  if (!rateLimit(`reg:${ip}`, 6, 60 * 60_000)) return c.json({ error: "Too many sign-ups from this network. Try later." }, 429);
  const b = await c.req.json().catch(() => ({}));
  const email = String(b.email ?? "").trim().toLowerCase(); const name = str(b.name, 80); const phone = str(b.phone, 20);
  const password = String(b.password ?? "");
  if (!name) return c.json({ error: "Please enter your name" }, 400);
  if (!isEmail(email)) return c.json({ error: "Enter a valid email address" }, 400);
  if (phone && !isPhone(phone)) return c.json({ error: "Enter a valid phone number" }, 400);
  if (password.length < 8) return c.json({ error: "Password must be at least 8 characters" }, 400);
  const exists = await c.env.DB.prepare("SELECT id FROM users WHERE lower(email)=?").bind(email).first();
  if (exists) return c.json({ error: "An account with this email already exists. Try signing in." }, 409);
  const h = await hashPassword(password);
  const r = await c.env.DB.prepare("INSERT INTO users (firebase_uid,name,email,phone,password_hash,salt,last_seen_at) VALUES (?,?,?,?,?,?,datetime('now'))")
    .bind("local:" + crypto.randomUUID(), name, email, phone, h.hash, h.salt).run();
  await setSession(c, r.meta.last_row_id as number);
  return c.json({ ok: true }, 201);
});

userAuth.post("/login", async (c) => {
  const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
  const b = await c.req.json().catch(() => ({}));
  const email = String(b.email ?? "").trim().toLowerCase(); const password = String(b.password ?? "");
  if (!rateLimit(`ulogin:${ip}`, 12, 15 * 60_000) || !rateLimit(`ulogin:${email}`, 8, 15 * 60_000)) return c.json({ error: "Too many attempts. Please wait a few minutes." }, 429);
  const u = await c.env.DB.prepare("SELECT id,password_hash,salt,blocked FROM users WHERE lower(email)=? AND password_hash IS NOT NULL").bind(email).first<any>();
  const ok = u ? await verifyPassword(password, u.password_hash, u.salt) : (await hashPassword(password), false);
  if (!u || !ok || u.blocked) return c.json({ error: "Incorrect email or password" }, 401);
  await c.env.DB.prepare("UPDATE users SET last_seen_at=datetime('now') WHERE id=?").bind(u.id).run();
  await setSession(c, u.id);
  return c.json({ ok: true });
});

userAuth.post("/logout", (c) => { deleteCookie(c, USER_COOKIE, { path: "/" }); return c.json({ ok: true }); });
