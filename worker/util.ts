export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 80);

export const randomId = (n = 6) => {
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => (b % 36).toString(36)).join("");
};

export const parseJson = <T>(s: unknown, fallback: T): T => {
  if (typeof s !== "string") return fallback;
  try { return JSON.parse(s) as T; } catch { return fallback; }
};

export const toInt = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
};
export const toNum = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
export const str = (v: unknown, max = 5000): string | null => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
};
export const bool = (v: unknown) => (v === true || v === 1 || v === "1" || v === "true" ? 1 : 0);
export const strArray = (v: unknown, maxItems = 60, maxLen = 400): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.length <= maxLen).slice(0, maxItems) : [];

export const isPhone = (s: string) => /^[+()\-\s\d]{8,18}$/.test(s);
export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

// Very small per-isolate rate limiter (best effort; good enough to blunt abuse of public forms).
const buckets = new Map<string, { n: number; t: number }>();
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now - b.t > windowMs) {
    buckets.set(key, { n: 1, t: now });
    if (buckets.size > 5000) buckets.clear();
    return true;
  }
  b.n++;
  return b.n <= max;
}
