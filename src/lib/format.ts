export function inr(n: number | null | undefined, opts: { short?: boolean } = {}): string {
  if (n === null || n === undefined) return "—";
  if (opts.short === false) return "₹" + n.toLocaleString("en-IN");
  if (n >= 1e7) return "₹" + trim(n / 1e7) + " Cr";
  if (n >= 1e5) return "₹" + trim(n / 1e5) + " L";
  if (n >= 1e3) return "₹" + trim(n / 1e3) + "K";
  return "₹" + n;
}
const trim = (v: number) => (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2)).replace(/\.?0+$/, "");

export const priceLabel = (p: { price: number; listing_type: string }) => inr(p.price) + (p.listing_type === "rent" ? "/mo" : "");
export const perSqft = (p: { price: number; area_sqft: number | null; listing_type: string }) =>
  p.listing_type === "sale" && p.area_sqft ? "₹" + Math.round(p.price / p.area_sqft).toLocaleString("en-IN") + "/sq ft" : null;

export function timeAgo(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z").getTime();
  const s = Math.max(1, Math.floor((Date.now() - d) / 1000));
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
export const dateFmt = (iso?: string | null) => (iso ? new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "");

export function emi(principal: number, ratePct: number, years: number) {
  const r = ratePct / 12 / 100; const n = years * 12;
  if (!r) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export const cx = (...a: Array<string | false | null | undefined>) => a.filter(Boolean).join(" ");
export const bhk = (p: { bedrooms: number | null; property_type: string }) => (p.bedrooms && p.property_type !== "pg" ? `${p.bedrooms} BHK` : "");
export const FALLBACKS = ["/img/listing-apartment.webp", "/img/listing-villa.webp", "/img/interior-living.webp", "/img/hero-marketplace.webp", "/img/amenity-clubhouse.webp"];
export const fallbackFor = (key: string) => FALLBACKS[[...key].reduce((a, c) => a + c.charCodeAt(0), 0) % FALLBACKS.length];
export function qs(obj: Record<string, string | number | undefined | null | string[]>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length)) continue;
    p.set(k, Array.isArray(v) ? v.join(",") : String(v));
  }
  const s = p.toString();
  return s ? "?" + s : "";
}
