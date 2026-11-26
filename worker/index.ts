import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import type { HonoEnv } from "./env";
import { ensureDb } from "./db";
import { pub } from "./routes/public";
import { user } from "./routes/user";
import { staffAuth } from "./routes/staff";
import { admin } from "./routes/admin";
import { readStaff, userFromRequest } from "./auth";
import { rateLimit, randomId } from "./util";

const app = new Hono<HonoEnv>();

app.use("*", secureHeaders({ crossOriginOpenerPolicy: "same-origin-allow-popups", crossOriginEmbedderPolicy: false, referrerPolicy: "strict-origin-when-cross-origin" }));

app.use("/api/*", async (c, next) => {
  await ensureDb(c.env);
  // CSRF: state-changing cookie-authenticated requests must be same-origin.
  if (!["GET", "HEAD", "OPTIONS"].includes(c.req.method)) {
    const origin = c.req.header("Origin");
    if (origin && new URL(origin).host !== new URL(c.req.url).host) return c.json({ error: "Bad origin" }, 403);
  }
  await next();
});

app.route("/api", pub);
app.route("/api/u", user);
app.route("/api/staff", staffAuth);
app.route("/api/admin", admin);

const IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif" };

app.post("/api/upload", async (c) => {
  const staff = await readStaff(c);
  const u = staff ? null : await userFromRequest(c);
  if (!staff && !u) return c.json({ error: "Please sign in to upload" }, 401);
  const who = staff ? `s${staff.id}` : `u${u!.id}`;
  if (!rateLimit(`upload:${who}`, 60, 60 * 60_000)) return c.json({ error: "Upload limit reached. Try again later." }, 429);
  const form = await c.req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || typeof file === "string") return c.json({ error: "No file" }, 400);
  const ext = IMAGE_TYPES[file.type];
  if (!ext) return c.json({ error: "Only JPG, PNG, WebP, GIF or AVIF images are allowed" }, 400);
  if (file.size > 8 * 1024 * 1024) return c.json({ error: "Image must be under 8 MB" }, 400);
  const key = `uploads/${new Date().getUTCFullYear()}/${randomId(16)}.${ext}`;
  await c.env.MEDIA.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" }, customMetadata: { by: who } });
  return c.json({ url: `/media/${key}` });
});

app.get("/media/*", async (c) => {
  const key = decodeURIComponent(new URL(c.req.url).pathname.slice("/media/".length));
  const nf = () => new Response("Not found", { status: 404 });
  if (!key.startsWith("uploads/") || key.includes("..")) return nf();
  const obj = await c.env.MEDIA.get(key);
  if (!obj) return nf();
  const h = new Headers();
  obj.writeHttpMetadata(h);
  h.set("etag", obj.httpEtag);
  h.set("X-Content-Type-Options", "nosniff");
  if (!h.has("cache-control")) h.set("cache-control", "public, max-age=31536000, immutable");
  return new Response(obj.body, { headers: h });
});

app.get("/sitemap.xml", async (c) => {
  await ensureDb(c.env);
  const origin = new URL(c.req.url).origin;
  const props = await c.env.DB.prepare("SELECT slug,updated_at FROM properties WHERE status='active' ORDER BY id DESC LIMIT 2000").all<{ slug: string; updated_at: string }>();
  const projects = await c.env.DB.prepare("SELECT slug FROM projects WHERE status='active'").all<{ slug: string }>();
  const posts = await c.env.DB.prepare("SELECT slug FROM posts WHERE published=1").all<{ slug: string }>();
  const urls = [
    ...["/", "/search", "/search?type=rent", "/projects", "/blog", "/emi-calculator", "/agents", "/about", "/contact"].map((p) => `<url><loc>${origin}${p.replace(/&/g, "&amp;")}</loc></url>`),
    ...props.results.map((p) => `<url><loc>${origin}/property/${p.slug}</loc><lastmod>${p.updated_at.slice(0, 10)}</lastmod></url>`),
    ...projects.results.map((p) => `<url><loc>${origin}/project/${p.slug}</loc></url>`),
    ...posts.results.map((p) => `<url><loc>${origin}/blog/${p.slug}</loc></url>`),
  ];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}</urlset>`, { headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" } });
});

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Something went wrong. Please try again." }, 500);
});
app.notFound((c) => (c.req.path.startsWith("/api/") ? c.json({ error: "Not found" }, 404) : c.req.path.startsWith("/media/") ? new Response("Not found", { status: 404 }) : c.env.ASSETS.fetch(c.req.raw)));

export default app;
