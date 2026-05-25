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


## API key safety (important)
- Never hardcode Google or provider API keys in frontend code, committed config, or function source files.
- Put secrets in `.env` for local dev and Netlify environment variables for deployed functions.
- Treat anything with the `VITE_` prefix as public/client-visible; do not place private keys there.
- If a key is accidentally exposed, rotate/revoke it immediately in Google Cloud Console and redeploy.
- Apply key restrictions in Google Cloud (API restrictions + HTTP referrer/IP restrictions as appropriate).

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


## Supabase Auth redirect checklist (login issues after changing live URL)
If login or Google OAuth stops working after updating your live URL in Supabase, verify **all** of the following in Supabase Dashboard → Authentication:

1. **Site URL**
   - Set to your production base URL (for example `https://your-domain.com`).
   - Keep protocol (`https://`) and no trailing spaces.

2. **Redirect URLs / Additional Redirect URLs**
   Add every environment your app can redirect from/to:
   - `http://localhost:5173/auth/callback` (local Vite dev)
   - `https://<your-netlify-domain>.netlify.app/auth/callback`
   - `https://<your-custom-domain>/auth/callback`

   This app calls Google OAuth with `redirectTo = ${window.location.origin}/auth/callback`, so `/auth/callback` must be allow-listed for each origin you use.

3. **Google provider configuration**
   In Supabase Auth Providers → Google:
   - Ensure provider is enabled.
   - Verify Google OAuth Client ID/Secret are still valid.
   - In Google Cloud OAuth credentials, add Supabase callback URL shown in Supabase (usually `https://<project-ref>.supabase.co/auth/v1/callback`) as an authorized redirect URI.

4. **Frontend environment variables**
   Ensure deploy environment has:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

5. **Netlify deploy refresh**
   After auth/env changes, trigger a fresh deploy so frontend picks up the latest env values.

### Typical failure symptoms and fixes
- **Error like “redirect URL is not allowed”** → add missing `/auth/callback` URL to Supabase Redirect URLs.
- **Google auth returns to app but no session** → verify Site URL + Redirect URLs exactly match current domain/protocol.
- **Email/password login fails suddenly in production** → confirm `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` are set in Netlify for that site/environment.
