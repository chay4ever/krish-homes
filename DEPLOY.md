# Deploy on Cloudflare (Workers Builds)

1. **Cloudflare dashboard → Workers & Pages → Create → Import a repository** → pick `krish-homes` and the branch you deploy from.
2. Build settings:
   - Build command: `npm run build`
   - Deploy command: `npx wrangler deploy`
3. First deploy auto-creates the **D1 database** (`krish-homes-db`) and **R2 bucket** (`krish-homes-media`) from `wrangler.jsonc`. Tables and demo data are created on the first request — no manual migration needed. (To manage via CLI later: `npm run db:migrate:remote`.)
4. **Worker → Settings → Variables and Secrets**
   | Name | Type | Purpose |
   |---|---|---|
   | `SUPER_ADMIN_EMAIL` | variable | Super admin login email (default `admin@krishhomes.in`) |
   | `SUPER_ADMIN_PASSWORD` | **secret** | Initial password. If unset it's `ChangeMe@123` and must be changed at first login. Only used when no super admin exists yet |
   | `JWT_SECRET` | secret, optional | Staff session signing key (auto-generated in D1 if absent) |
   Set the vars in the dashboard (or edit `vars` in `wrangler.jsonc`).
5. **Firebase is optional.** Until you add it, visitors sign in with built-in email + password (stored in D1). To enable Google / phone OTP later: Super Admin → `/admin/settings` → *Firebase sign-in*, paste the web-app config, save. In the Firebase console enable the providers and add your domain under *Authentication → Settings → Authorized domains*. (Worker vars `FIREBASE_*` still work as a fallback.)
6. Open `https://<your-worker>/admin` and sign in. Change the password, then edit brand details in *Settings*.

## Going live checklist
- Delete or edit demo listings (they use sample photos and fake agent contacts) in `/admin/properties`; demo agents can't log in until a manager resets their password.
- Replace placeholder phone/email in *Settings*; review `/terms` and `/privacy` (templates) with a lawyer.
- Custom domain: Worker → Settings → Domains & Routes.
- Optional: put Cloudflare Turnstile/WAF rate limits in front of `/api/leads` and `/api/staff/login` (built-in limiter is per-isolate, best-effort).
