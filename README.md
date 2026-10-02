# Legacy Handover

Succession, transferability and business-transfer platform for owners of established Indian businesses. Built from the V1–Phase 5 designs and the Master PRD.

**Stack:** Next.js 16 (App Router, server actions) · Neon Postgres (`@neondatabase/serverless`) · Vercel.

## What's in it

| Area | Route |
|---|---|
| Marketing site, guides (SEO URLs), sample report | `/`, `/guides/*`, `/report/sample` |
| OTP sign-in (owner / acquirer / advisor) | `/sign-in` |
| 8-step assessment, server-side autosave, deterministic scoring (PRD §12–13, versioned) | `/assessment` |
| Report: free vs paid unlock, paths, indicative value, timeline | `/report` |
| Owner dashboard: tasks, documents (data room uploads), privacy levels L0–L4 + access log, anonymous profile, acquirer requests, advisor invites | `/dashboard` |
| Explore + acquirer registration, matching, requests, saved searches | `/acquire`, `/acquirer` |
| Advisor portal: clients, notes, tasks, invite links | `/advisor` |
| Deal workspace: NDA, permissioned data room, Q&A, assistant, offers, financing, closing, transition, audit trail | `/deals/[id]` |
| Succession Passport + expiring share links | `/passport`, `/passport/s/[token]` |
| Settings: notifications, billing, export, delete, region, profile | `/settings` |
| Admin: owner review, acquirer verification, CRM + approved outreach drafts, matching, deal health, inbox, analytics, score-weight versions | `/admin` |

## Environment

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | Neon connection string (set by the Vercel Neon integration). Schema + seed apply automatically on build (`scripts/migrate.mjs`) and lazily on first request. |
| `ADMIN_PASSWORD` | for admin | `/admin` is disabled until set. |
| `SESSION_SECRET` | recommended | Falls back to a hash of `DATABASE_URL`. |
| `RESEND_API_KEY` + `OTP_FROM_EMAIL` | before launch | Email OTP delivery. |
| `MSG91_AUTH_KEY` + `MSG91_TEMPLATE_ID` | before launch | SMS OTP delivery. Without a provider, codes show on screen ("preview delivery"). |
| `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` | before charging | Without keys, the report unlock runs in labelled test mode (no charge). |
| `ANTHROPIC_API_KEY` (+ `ANTHROPIC_MODEL`) | optional | AI-written interpretation. Never changes scores; falls back to the rules-based summary. |
| `NEXT_PUBLIC_SITE_URL` | optional | Canonical URL for sitemap/OG. |

## Local development

```bash
npm install
DATABASE_URL=pglite:./.pglite npm run migrate   # in-process Postgres, no server needed
DATABASE_URL=pglite:./.pglite ADMIN_PASSWORD=dev npm run dev
```

## Notes

- Documents are stored in Postgres (base64, 4 MB cap per file) to keep V1 on Neon alone. Move to object storage before data rooms grow large.
- Sample listings and professionals are labelled "Sample", cannot receive requests, and can be hidden in Admin → Configuration.
- Legal pages are drafts for counsel review.
