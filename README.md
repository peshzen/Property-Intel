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
1. Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
2. Install dependencies: `npm install`
3. Run app: `npm run dev`
4. Build: `npm run build`
5. Test: `npm run test`

## Supabase
- Run migration in `supabase/migrations/202605240001_init.sql`.
- Optional seed: `supabase/seed/demo_seed.sql`.
- All app tables have RLS enabled with owner/admin policy split.

## Netlify
- `netlify.toml` config included.
- Functions in `netlify/functions`.
- Keep `SUPABASE_SERVICE_ROLE_KEY` and `OPENAI_API_KEY` only in Netlify environment variables.

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
