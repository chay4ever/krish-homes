import { Hono } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";
import type { HonoEnv } from "../env";
import { STAFF_COOKIE, hashPassword, readStaff, signStaffToken, verifyPassword } from "../auth";
import { rateLimit } from "../util";

export const staffAuth = new Hono<HonoEnv>();

staffAuth.post("/login", async (c) => {
  const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
  const b = await c.req.json().catch(() => ({}));
  const email = String(b.email ?? "").trim().toLowerCase();
  const password = String(b.password ?? "");
  if (!rateLimit(`login:${ip}`, 10, 15 * 60_000) || !rateLimit(`login:${email}`, 8, 15 * 60_000))
    return c.json({ error: "Too many attempts. Please wait a few minutes." }, 429);
  const row = await c.env.DB.prepare("SELECT * FROM staff WHERE email=?").bind(email).first<any>();
  // Always run a hash to keep timing similar for unknown emails.
  const ok = row ? await verifyPassword(password, row.password_hash, row.salt) : (await hashPassword(password), false);
  if (!row || !ok || !row.active) return c.json({ error: "Incorrect email or password" }, 401);
  const session = { id: row.id, email: row.email, name: row.name, role: row.role, must_change_password: row.must_change_password };
  setCookie(c, STAFF_COOKIE, await signStaffToken(c.env, session), {
    httpOnly: true, secure: new URL(c.req.url).protocol === "https:", sameSite: "Lax", path: "/", maxAge: 7 * 24 * 3600,
  });
  return c.json({ staff: session });
});

staffAuth.post("/logout", (c) => {
  deleteCookie(c, STAFF_COOKIE, { path: "/" });
  return c.json({ ok: true });
});

staffAuth.get("/me", async (c) => {
  const s = await readStaff(c);
  return c.json({ staff: s });
});

staffAuth.post("/change-password", async (c) => {
  const s = await readStaff(c);
  if (!s) return c.json({ error: "Please sign in" }, 401);
  const b = await c.req.json().catch(() => ({}));
  const cur = String(b.current ?? ""); const next = String(b.next ?? "");
  if (next.length < 8 || !/[A-Za-z]/.test(next) || !/\d/.test(next)) return c.json({ error: "New password must be 8+ characters with letters and numbers" }, 400);
  const row = await c.env.DB.prepare("SELECT password_hash,salt FROM staff WHERE id=?").bind(s.id).first<any>();
  if (!row || !(await verifyPassword(cur, row.password_hash, row.salt))) return c.json({ error: "Current password is incorrect" }, 400);
  const h = await hashPassword(next);
  await c.env.DB.prepare("UPDATE staff SET password_hash=?,salt=?,must_change_password=0 WHERE id=?").bind(h.hash, h.salt, s.id).run();
  return c.json({ ok: true });
});
