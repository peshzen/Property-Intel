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
1. Copy `.env.example` to `.env` and set required variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). Optional keys can be left empty for mock/fallback behavior.
2. Install dependencies: `npm install`
3. Run app: `npm run dev`
4. Build: `npm run build`
5. Test: `npm run test`

## Environment variables
- `VITE_SUPABASE_URL` (**required**) - Supabase project URL used by the browser app.
- `VITE_SUPABASE_ANON_KEY` (**required**) - Supabase anon/public key used by the browser app.
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` (**recommended for Netlify Functions**) - Server-side aliases used by Netlify Functions. If omitted, functions fall back to `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- `SUPABASE_SERVICE_ROLE_KEY` (**required for admin/server functions only**) - Set in Netlify environment variables, never commit to the client.
- `GOOGLE_MAPS_API_KEY` (**optional**) - If missing, street-view images gracefully fall back to `null` and the app keeps working.
- `OPENAI_API_KEY` (**optional**) - Only needed when AI summary generation is wired to a real provider; mock summary path still works without it.
- `PROPERTY_DATA_API_KEY` (**optional**) - Reserved for future paid property-data adapters; current app uses mock fallback data when unset.

## Supabase
- Run migration in `supabase/migrations/202605240001_init.sql`.
- Optional seed: `supabase/seed/demo_seed.sql`.
- All app tables have RLS enabled with owner/admin policy split.

## Netlify
- `netlify.toml` config included.
- Functions in `netlify/functions`.
- Keep sensitive server-only values such as `SUPABASE_SERVICE_ROLE_KEY` and `OPENAI_API_KEY` in Netlify environment variables (not in client code).

## Provider adapters
See `src/services/*Provider.ts` and service modules:
- `geocodingProvider.ts`
- `streetViewProvider.ts`
- `propertyDataProvider.ts`
- `compsProvider.ts`
- `publicRecordsProvider.ts`
- `reportScoringService.ts`
- `pdfService.ts`
- `shareService.ts`

Each file has TODO markers for connecting official/paid APIs via backend functions while preserving legal/compliant data terms.

## Notes
This MVP intentionally works without third-party paid keys by falling back to safe mock data so the app remains functional in development and demos.

## Google Maps user key integration
- Users can save/test/remove their own Google Maps API key from **Profile & Settings → Google Maps Integration**.
- Keys are stored server-side in `profiles.google_maps_api_key_encrypted` and never returned in full to the frontend after save.
- Configure `GOOGLE_API_KEY_ENCRYPTION_SECRET` in Netlify for AES-256-GCM encryption at rest.
- Report generation key priority:
  1. User's saved key
  2. Global `GOOGLE_MAPS_API_KEY`
  3. Graceful fallback that skips Google-dependent features
- Users should enable these Google APIs in their Google Cloud project:
  - Maps JavaScript API
  - Geocoding API
  - Street View Static API
  - Places API (if autocomplete is used)
