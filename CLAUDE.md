# Legacy Handover: context for Claude Code

Succession and business-transfer platform for owners of established Indian businesses (₹1–25 Cr, 10+ yrs). Source of truth for product rules: the Master PRD (not in repo; owner has it). Selling is never the default; copy stays neutral ("plan your next chapter", never "exit"/"cash out").

## Stack
- Next.js 16 App Router, React 19, TypeScript, server actions. No Tailwind: design tokens and utility classes live in `app/globals.css`.
- Neon Postgres via `@neondatabase/serverless` (HTTP `sql.query`). Local dev uses PGlite: `DATABASE_URL=pglite:./.pglite`.
- Hosted on Vercel, project `legacy-handover` (prj_Rt8SQQdSA6mb8ay8AGh7qg9tmXcu), region bom1. Push to `main` deploys. Live: https://legacy-handover.vercel.app
- Neon is attached through the Vercel Storage integration (sets `DATABASE_URL`).

## Commands
```bash
npm install
DATABASE_URL=pglite:./.pglite npm run migrate
DATABASE_URL=pglite:./.pglite ADMIN_PASSWORD=dev npm run dev
npx tsc --noEmit
DATABASE_URL=pglite:./.pglite npx next build
```
`npm run build` runs `scripts/migrate.mjs` first (applies `db/schema.sql`, seeds via `db/seed.mjs`; skips if no DATABASE_URL). `lib/db.ts` also lazily applies schema on first request.

## Layout
- `db/schema.sql` idempotent schema (CREATE IF NOT EXISTS). Change schema here; additive changes only, use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` for new columns.
- `lib/assessment.ts` questions + deterministic scoring (`compute`). Weights are versioned in `score_versions`; active version in `app_config.active_score_version`. AI must never set or change scores.
- `lib/report.ts` paths, tips, task library, report text. `lib/ai.ts` optional Anthropic narrative.
- `lib/auth.ts` OTP (hashed codes, rate limited), JWT session cookie `lh_session`, admin cookie via `ADMIN_PASSWORD`.
- `lib/owner.ts` draft/finish assessment, business context. `lib/deals.ts` deal access, health, deterministic assistant. `lib/matching.ts` buyer/listing scoring. `lib/payments.ts` Razorpay or labelled test mode. `lib/passport.ts`.
- `app/actions/*` server actions (auth, assessment, owner, buyer, deal, advisor, admin, settings, passport, billing, pros, public). Every action re-checks the current user and ownership server-side.
- Pages: `/`, `/guides/[slug]`, `/assessment`, `/report`, `/report/sample`, `/dashboard?view=`, `/acquire`, `/acquirer?view=`, `/advisor`, `/deals/[id]?tab=`, `/passport`, `/passport/s/[token]`, `/settings?tab=`, `/admin?tab=`, `/sign-in`, `/professionals`, `/privacy`, `/terms`.
- API routes: `/api/documents/[id]` (permission-checked view/download, logged), `/api/export`, `/api/invite`, `/api/sign-out`.

## Rules to keep
- Confidentiality levels L0–L4; default L0. Buyers see documents only up to `deals.buyer_max_level` (2 → 3 after both NDA signatures → 4 when owner grants).
- Every sensitive action writes `audit_logs` via `audit()`. Analytics via `track()`.
- Facts supplied vs interpretation stay separated in the report. Valuation disclaimer text is fixed (`VALUE_DISCLAIMER`).
- Sample listings/professionals have `is_sample = true`, are labelled "Sample", and cannot receive requests.
- Writing style for any copy: no em dashes, plain human prose.

## Environment
Set on Vercel: `DATABASE_URL` (Neon), `SESSION_SECRET`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_SITE_URL`.
Not yet set (stand-in modes active): `MSG91_AUTH_KEY`/`MSG91_TEMPLATE_ID` or `RESEND_API_KEY`/`OTP_FROM_EMAIL` (OTP codes currently shown on screen, so sign-in is not secure yet), `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` (report unlock is free test mode), `ANTHROPIC_API_KEY` (optional).

## Open items
1. Connect an OTP provider before real users.
2. Razorpay keys before charging.
3. Replace illustrative stories, founder note and photo placeholders with real content.
4. Legal review of `/privacy` and `/terms`.
5. Documents are base64 in Postgres (4 MB cap); move to object storage when data rooms grow.
6. Regional-language UI strings (preference is stored, translations not done).
7. WhatsApp/email notification delivery (preferences stored, not sent).
