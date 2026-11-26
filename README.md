# Krish Homes — real-estate marketplace (working title)

A premium, mobile-first property marketplace (buy / rent / commercial / plots / new projects) running entirely on Cloudflare.

| Layer | Tech |
|---|---|
| Frontend | React 19 + Vite + Tailwind v4 + Motion, installable PWA, app-style bottom navigation on phones |
| API | Hono on Cloudflare Workers (same Worker serves the SPA via static assets) |
| Database | Cloudflare **D1** (schema in `migrations/`, auto-applied + demo data seeded on first request) |
| Files | Cloudflare **R2** (listing photos, served from `/media/*`) |
| End-user auth | Built-in email + password out of the box; **Firebase Auth** (Google, phone OTP) switched on later from the admin Settings page |
| Staff auth | Email + password (PBKDF2, httpOnly JWT cookie) for **Super Admin**, **Admin Manager**, **Agent** |

## Features
- Home with hero search (Buy / Rent / Commercial / Plots), featured, cities, new projects, guides
- Search with filters (city, locality, type, BHK, budget, area, furnishing, possession, verified/owner), sort, grid/list, saved searches
- Property detail: swipe gallery + lightbox, facts, amenities, EMI calculator, enquiry / visit / callback, reveal-phone (login), similar listings
- Post property wizard (5 steps, photo upload to R2, review before going live), my listings, enquiries received/sent, shortlist
- Projects (new launches), agents, blog/guides, EMI calculator, legal pages, sitemap.xml
- `/admin` console: dashboard, moderate listings (approve/reject/feature/verify), leads CRM (status, assignment, notes, CSV export), projects, blog, users (block), team management, brand settings (rename the brand without redeploying), audit log
- Roles: **Super Admin** (everything, creates admins, edits brand) · **Admin Manager** (moderation, leads, content, creates agents) · **Agent** (own listings + assigned leads; listings need manager approval)

See **[DEPLOY.md](./DEPLOY.md)** for setup.

## Develop locally
```bash
npm install
npm run dev        # Vite + local D1/R2 emulation (miniflare)
```
Local staff login: `admin@krishhomes.in` / `ChangeMe@123` (you're forced to change it).
Visitors can register with email + password locally; Firebase is optional.

## Rename the brand
Super Admin → `/admin/settings` (name, tagline, hero copy, contact). For the logo mark edit `src/components/Brand.tsx`, `public/favicon.svg`, `public/icon-*.png`, `public/manifest.webmanifest`.
