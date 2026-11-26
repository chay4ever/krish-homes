export interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;
  ASSETS: Fetcher;
  FIREBASE_API_KEY?: string;
  FIREBASE_AUTH_DOMAIN?: string;
  FIREBASE_PROJECT_ID?: string;
  FIREBASE_APP_ID?: string;
  SUPER_ADMIN_EMAIL?: string;
  SUPER_ADMIN_PASSWORD?: string;
  JWT_SECRET?: string;
}

export type StaffSession = {
  id: number;
  email: string;
  name: string;
  role: "super_admin" | "admin" | "agent";
  must_change_password: number;
};

export type AppUser = { id: number; firebase_uid: string; name: string | null; email: string | null; phone: string | null; photo: string | null; blocked: number };

export type HonoEnv = { Bindings: Env; Variables: { staff?: StaffSession; user?: AppUser } };
