export interface City { id: number; slug: string; name: string; state?: string; image?: string; featured: number; listings?: number }
export interface Locality { id: number; city_id: number; slug: string; name: string }
export interface Property {
  id: number; slug: string; title: string; description?: string; listing_type: "sale" | "rent"; category: string; property_type: string;
  bedrooms: number | null; bathrooms: number | null; balconies?: number | null; area_sqft: number | null; plot_area?: number | null; price: number;
  maintenance?: number | null; deposit?: number | null; negotiable?: number; furnishing?: string | null; facing?: string | null;
  floor?: number | null; total_floors?: number | null; age_years?: number | null; possession?: string; available_from?: string | null; preferred_tenants?: string | null;
  parking?: number | null; images: string[]; amenities?: string[]; featured: number; verified: number; views: number; owner_type: string; status: string;
  published_at?: string | null; created_at: string; city_name: string; city_slug: string; locality_name?: string | null; locality_slug?: string | null; address?: string | null;
  lat?: number | null; lng?: number | null; video_url?: string | null; rera_id?: string | null; project_name?: string | null; project_slug?: string | null;
  agent_name?: string | null; agent_phone?: string | null; agent_photo?: string | null; agent_agency?: string | null; agent_rera?: string | null; contact_name?: string | null;
  similar?: Property[]; saved?: boolean; reject_reason?: string | null; leads?: number; city_id?: number; locality_id?: number | null;
}
export interface Project {
  id: number; slug: string; name: string; builder?: string; configurations?: string; price_min?: number; price_max?: number; area_min?: number; area_max?: number;
  possession?: string; images: string[]; city_name?: string; locality_name?: string; total_units?: number; description?: string; amenities?: string[]; rera_id?: string; address?: string;
  properties?: Property[]; city_slug?: string;
}
export interface Post { slug: string; title: string; excerpt?: string; cover?: string; author?: string; created_at: string; content?: string }
export interface DbUser { id: number; name: string | null; email: string | null; phone: string | null; photo: string | null }
export interface StaffUser { id: number; email: string; name: string; role: "super_admin" | "admin" | "agent"; must_change_password: number }
export type Page<T> = { items: T[]; total: number; page: number; limit: number };
