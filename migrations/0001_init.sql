-- Krish Homes core schema (idempotent; also applied automatically by the Worker on first request)
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS staff (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('super_admin','admin','agent')),
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  must_change_password INTEGER NOT NULL DEFAULT 0,
  photo TEXT,
  bio TEXT,
  agency TEXT,
  rera_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  firebase_uid TEXT NOT NULL UNIQUE,
  name TEXT,
  email TEXT,
  phone TEXT,
  photo TEXT,
  blocked INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen_at TEXT
);

CREATE TABLE IF NOT EXISTS cities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  state TEXT,
  image TEXT,
  featured INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS localities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  city_id INTEGER NOT NULL REFERENCES cities(id),
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  UNIQUE (city_id, slug)
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  builder TEXT,
  city_id INTEGER REFERENCES cities(id),
  locality_id INTEGER REFERENCES localities(id),
  address TEXT,
  description TEXT,
  configurations TEXT,
  price_min INTEGER,
  price_max INTEGER,
  area_min INTEGER,
  area_max INTEGER,
  possession TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  rera_id TEXT,
  total_units INTEGER,
  amenities TEXT NOT NULL DEFAULT '[]',
  images TEXT NOT NULL DEFAULT '[]',
  featured INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS properties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  listing_type TEXT NOT NULL CHECK (listing_type IN ('sale','rent')),
  category TEXT NOT NULL DEFAULT 'residential',
  property_type TEXT NOT NULL,
  bedrooms INTEGER,
  bathrooms INTEGER,
  balconies INTEGER,
  area_sqft INTEGER,
  plot_area INTEGER,
  price INTEGER NOT NULL,
  maintenance INTEGER,
  deposit INTEGER,
  negotiable INTEGER NOT NULL DEFAULT 0,
  furnishing TEXT,
  facing TEXT,
  floor INTEGER,
  total_floors INTEGER,
  age_years INTEGER,
  possession TEXT NOT NULL DEFAULT 'ready',
  available_from TEXT,
  preferred_tenants TEXT,
  parking INTEGER,
  city_id INTEGER NOT NULL REFERENCES cities(id),
  locality_id INTEGER REFERENCES localities(id),
  address TEXT,
  lat REAL,
  lng REAL,
  amenities TEXT NOT NULL DEFAULT '[]',
  images TEXT NOT NULL DEFAULT '[]',
  video_url TEXT,
  project_id INTEGER REFERENCES projects(id),
  rera_id TEXT,
  owner_type TEXT NOT NULL DEFAULT 'owner' CHECK (owner_type IN ('owner','agent','builder')),
  user_id INTEGER REFERENCES users(id),
  staff_id INTEGER REFERENCES staff(id),
  contact_name TEXT,
  contact_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('draft','pending','active','rejected','sold','archived')),
  reject_reason TEXT,
  featured INTEGER NOT NULL DEFAULT 0,
  verified INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_prop_search ON properties (status, listing_type, city_id, price);
CREATE INDEX IF NOT EXISTS idx_prop_user ON properties (user_id);
CREATE INDEX IF NOT EXISTS idx_prop_staff ON properties (staff_id);
CREATE INDEX IF NOT EXISTS idx_prop_locality ON properties (locality_id);

CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL DEFAULT 'enquiry' CHECK (kind IN ('enquiry','visit','callback','general')),
  property_id INTEGER REFERENCES properties(id),
  project_id INTEGER REFERENCES projects(id),
  user_id INTEGER REFERENCES users(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  message TEXT,
  visit_at TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','visit_done','closed','lost')),
  assigned_staff_id INTEGER REFERENCES staff(id),
  notes TEXT,
  source TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads (status, created_at);
CREATE INDEX IF NOT EXISTS idx_leads_property ON leads (property_id);
CREATE INDEX IF NOT EXISTS idx_leads_user ON leads (user_id);

CREATE TABLE IF NOT EXISTS favorites (
  user_id INTEGER NOT NULL REFERENCES users(id),
  property_id INTEGER NOT NULL REFERENCES properties(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, property_id)
);

CREATE TABLE IF NOT EXISTS saved_searches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  query TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover TEXT,
  author TEXT,
  published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  staff_id INTEGER,
  action TEXT NOT NULL,
  detail TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
