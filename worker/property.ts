import { PROPERTY_TYPES } from "../shared/constants";
import { slugify, randomId, str, toInt, toNum, bool, strArray } from "./util";

export type PropInput = Record<string, any>;

/** Validates & normalises a property payload. Returns an error string or a column map. */
export function normaliseProperty(b: PropInput): { error: string } | { data: Record<string, unknown> } {
  const title = str(b.title, 140);
  if (!title || title.length < 8) return { error: "Please enter a descriptive title (at least 8 characters)" };
  const listing_type = b.listing_type === "rent" ? "rent" : b.listing_type === "sale" ? "sale" : null;
  if (!listing_type) return { error: "Choose whether the property is for sale or rent" };
  const pt = PROPERTY_TYPES.find((t) => t.value === b.property_type);
  if (!pt) return { error: "Choose a property type" };
  const price = toInt(b.price);
  if (!price || price <= 0) return { error: "Enter a valid price" };
  const city_id = toInt(b.city_id);
  if (!city_id) return { error: "Choose a city" };
  const area = toInt(b.area_sqft);
  if (!area || area <= 0) return { error: "Enter the area in sq ft" };
  const images = strArray(b.images, 30, 600);
  return {
    data: {
      title, description: str(b.description, 6000), listing_type, category: pt.category, property_type: pt.value,
      bedrooms: toInt(b.bedrooms), bathrooms: toInt(b.bathrooms), balconies: toInt(b.balconies), area_sqft: area, plot_area: toInt(b.plot_area),
      price, maintenance: toInt(b.maintenance), deposit: toInt(b.deposit), negotiable: bool(b.negotiable),
      furnishing: str(b.furnishing, 20), facing: str(b.facing, 20), floor: toInt(b.floor), total_floors: toInt(b.total_floors), age_years: toInt(b.age_years),
      possession: b.possession === "under_construction" ? "under_construction" : "ready", available_from: str(b.available_from, 20),
      preferred_tenants: str(b.preferred_tenants, 60), parking: toInt(b.parking),
      city_id, locality_id: toInt(b.locality_id), address: str(b.address, 300), lat: toNum(b.lat), lng: toNum(b.lng),
      amenities: JSON.stringify(strArray(b.amenities, 40, 60)), images: JSON.stringify(images), video_url: str(b.video_url, 300),
      project_id: toInt(b.project_id), rera_id: str(b.rera_id, 60), contact_name: str(b.contact_name, 80), contact_phone: str(b.contact_phone, 20),
    },
  };
}

export async function uniqueSlug(db: D1Database, title: string) {
  return `${slugify(title)}-${randomId(5)}`;
}

export async function insertProperty(db: D1Database, data: Record<string, unknown>, extra: Record<string, unknown>) {
  const slug = await uniqueSlug(db, String(data.title));
  const all = { slug, ...data, ...extra };
  const cols = Object.keys(all);
  const res = await db.prepare(`INSERT INTO properties (${cols.join(",")}) VALUES (${cols.map(() => "?").join(",")})`).bind(...Object.values(all)).run();
  return { id: res.meta.last_row_id as number, slug };
}

export async function updateProperty(db: D1Database, id: number, data: Record<string, unknown>, extra: Record<string, unknown> = {}) {
  const all = { ...data, ...extra };
  const cols = Object.keys(all);
  await db.prepare(`UPDATE properties SET ${cols.map((c) => `${c}=?`).join(",")}, updated_at=datetime('now') WHERE id=?`).bind(...Object.values(all), id).run();
}
