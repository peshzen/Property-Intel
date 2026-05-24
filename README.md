# Property Comp Analyzer

Production-minded MVP for investor comparable reports using React + Vite + TypeScript, Tailwind, Supabase, and Netlify.

## Features
- Email/password + Google OAuth friendly architecture (Supabase auth)
- Pending/approved/denied user approval workflow
- Admin-aware RLS + audit log schema
- Provider adapter pattern with compliant mock fallbacks (no scraping)
- Report generator with comps, scoring, street-view fallback, and public-record disclaimers
- PDF export scaffold
- Secure share-token scaffold
- Dark/light mode and mobile-first UI structure

## Setup
1. Copy `.env.example` to `.env` and set required variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
2. Install dependencies: `npm install`
3. Run app: `npm run dev`
4. Build: `npm run build`
5. Test: `npm run test`

## Environment variables
- `VITE_SUPABASE_URL` (**required**) - Supabase project URL used by the browser app.
- `VITE_SUPABASE_ANON_KEY` (**required**) - Supabase anon/public key used by the browser app.
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` (**recommended for Netlify Functions**) - Server-side aliases used by Netlify Functions.
- `SUPABASE_SERVICE_ROLE_KEY` (**required for server functions**) - Set in Netlify environment variables, never commit to the client.
- `GOOGLE_MAPS_API_KEY` (**optional global server fallback**) - Used by Netlify Functions when the user has not saved a personal Google key.
- `GOOGLE_API_KEY_ENCRYPTION_SECRET` (**recommended**) - Encrypts/decrypts user-saved Google keys.
- `VITE_GOOGLE_MAPS_API_KEY` (**optional frontend-only**) - Only needed if you render Google Maps JavaScript directly in browser.

## Supabase
- Run migrations in `supabase/migrations`.
- Optional seed: `supabase/seed/demo_seed.sql`.
- All app tables have RLS enabled with owner/admin policy split.

## Netlify
- `netlify.toml` config included.
- Functions in `netlify/functions`.
- Keep sensitive values (`SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_MAPS_API_KEY`, `GOOGLE_API_KEY_ENCRYPTION_SECRET`) in Netlify environment variables.
- Redeploy Netlify after changing environment variables.

## Google Maps setup checklist
1. Enable billing in Google Cloud Console.
2. Enable APIs:
   - Maps JavaScript API
   - Geocoding API
   - Street View Static API
   - Places API (if autocomplete is used)
3. Configure API restrictions to only required APIs.
4. If using browser Maps JavaScript key, add referrer restrictions:
   - `http://localhost:5173/*`
   - `https://property-intel.netlify.app/*`
   - your custom production domain
5. For server-side Netlify function usage, use unrestricted key temporarily while testing, then tighten server restrictions.
6. Add `GOOGLE_MAPS_API_KEY` in Netlify environment variables if using global fallback.
7. Redeploy Netlify.

## Google Maps user key integration
- Users can save/test/remove their own Google Maps API key from **Profile & Settings → Google Maps Integration**.
- Keys are stored server-side in `profiles.google_maps_api_key_encrypted` and never returned in full to the frontend.
- Key usage priority:
  1. User saved key
  2. Global `GOOGLE_MAPS_API_KEY`
  3. Graceful errors for missing key
