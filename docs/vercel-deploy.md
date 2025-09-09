# Vercel Deployment Guide

This project is a Next.js 15 app (App Router) with Stripe and Supabase. Follow these steps to deploy reliably to Vercel and verify end-to-end.

---

## 0) Prerequisites

- Vercel account with GitHub/GitLab/Bitbucket connected.
- Supabase project provisioned (DB + storage).
- Stripe account (test mode for staging; live mode for production).
- Local: Node 18+ (Node 20 recommended).

---

## 1) Sanity check locally

```bash
# Install deps; React 19 + Stripe peers may require legacy peers
npm install --legacy-peer-deps

# Build and run
npm run build
npm run start
# Visit http://localhost:3000
```

If the build fails with Turbopack on your machine, temporarily switch the build script to `next build` and retry.

---

## 2) Push code to your git host

Commit and push the repo to GitHub/GitLab/Bitbucket so Vercel can import it.

---

## 3) Create the Vercel Project

- In Vercel, click “Add New Project” → import this repo.
- Framework: auto-detected as Next.js.
- Root directory: repo root.
- Install Command: default is fine; if peers fail, use `npm install --legacy-peer-deps` or set `NPM_FLAGS=--legacy-peer-deps` in Project Settings → Environment Variables.
- Build Command: uses `npm run build` which maps to `next build --turbopack` in this repo. If the first deploy fails with Turbopack, change your package.json build script to `next build` and redeploy.
- Output: detected automatically (`.next`).
- Node: set Project Settings → Node.js Version to 20 (recommended).

---

## 4) Configure Environment Variables

Set these in Vercel → Project Settings → Environment Variables. Add for both “Production” and “Preview” (values can differ).

Required for Supabase:
- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon key
- `SUPABASE_SERVICE_ROLE_KEY` — service role key (server-only)

Required for Stripe:
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — pk_test_… or pk_live_…
- `STRIPE_SECRET_KEY` — sk_test_… or sk_live_…
- `STRIPE_WEBHOOK_SECRET` — whsec_… (created in Step 7)

Admin protection:
- `ADMIN_USER` — arbitrary username
- `ADMIN_PASS` — strong password

Site + misc (optional but recommended):
- `NEXT_PUBLIC_SITE_URL` — `https://yourdomain.com` (used for sitemap/robots/canonicals)
- `NEXT_PUBLIC_ADMIN_EMAILS` — comma-separated allowlist if you use it
- Analytics/monitoring: `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`, `SENTRY_DSN`
- Currency (optional): `NEXT_PUBLIC_CURRENCY` (defaults to `usd`)

Tip: mirror `.env.local.example` in the repo.

---

## 5) First Deploy

Trigger the first deploy from the Vercel dashboard. After deploy completes, open:
- `https://<vercel-deploy-url>/` — homepage should load.
- `https://<vercel-deploy-url>/api/health` — returns JSON with non-sensitive env checks.

If `stripe.hasSecretKey` or `stripe.hasWebhookSecret` are `false`, double-check Step 4.

---

## 6) Add Custom Domain (optional, recommended)

- Vercel → Settings → Domains → add `yourdomain.com`.
- Update DNS per Vercel instructions.
- Set `NEXT_PUBLIC_SITE_URL=https://yourdomain.com` in Vercel env for Production.
- Redeploy for sitemap/robots to reflect the new base URL.

---

## 7) Stripe Webhook (production)

Create a webhook endpoint in Stripe Dashboard:
- URL: `https://yourdomain.com/api/stripe/webhook` (or the Vercel deploy URL if you’re not on a custom domain yet)
- Events: start with `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.amount_capturable_updated`, `payment_intent.canceled`, `charge.refunded` (or select “All events” during test phase)
- Copy the signing secret `whsec_…` and set it in Vercel as `STRIPE_WEBHOOK_SECRET` (Production)

Preview environment (optional):
- Create a separate webhook endpoint for your Vercel preview domain and set a distinct `STRIPE_WEBHOOK_SECRET` in the Preview environment.

Local testing (optional):
```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
# Copy the printed whsec_… to STRIPE_WEBHOOK_SECRET in .env.local
stripe trigger payment_intent.succeeded
```

---

## 8) Validate End-to-End

- Health check: `/api/health` shows `hasSecretKey: true`, `hasWebhookSecret: true`, and `mode: "test"` (or `"live"`).
- Checkout: go to `/checkout` and confirm Stripe Elements renders. Use test card `4242 4242 4242 4242`.
- Webhook logs: in Stripe Dashboard → Developers → Events, verify your webhook receives `payment_intent.succeeded`.
- Data: check your Supabase tables (`orders`, `payments`) updated by webhook handlers.
- Admin: visit `/admin/orders`; confirm browser prompts HTTP Basic Auth. Use `ADMIN_USER`/`ADMIN_PASS`.

---

## 9) Troubleshooting

- Install failures due to peer deps (React 19): set `NPM_FLAGS=--legacy-peer-deps` in Vercel or use a custom Install Command.
- Build issues with Turbopack: change `"build": "next build --turbopack"` to `"next build"` in `package.json` and redeploy.
- Stripe webhook signature errors: ensure `STRIPE_WEBHOOK_SECRET` matches the active endpoint’s secret; production requires HTTPS and the app enforces it.
- Supabase writes not occurring: confirm `SUPABASE_SERVICE_ROLE_KEY` is set and valid; admin features and webhooks use the admin client.
- Mixed data between preview/prod: use separate Stripe endpoints/secrets and optionally separate Supabase projects or schemas for previews.

---

## 10) Going Live with Stripe

- Switch to live keys in Vercel Production env:
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_…`
  - `STRIPE_SECRET_KEY=sk_live_…`
  - Keep the live `STRIPE_WEBHOOK_SECRET` from your live webhook endpoint
- Verify Apple Pay domain in Stripe Dashboard for your production domain if you plan to accept Apple Pay.

---

## Notes on This Repo

- Webhook route `/api/stripe/webhook` uses Node.js runtime and `req.text()` for raw body; signature verification is enforced in production.
- `/admin/*` is protected via middleware with HTTP Basic Auth (set `ADMIN_USER`/`ADMIN_PASS`).
- `/api/health` provides a safe way to confirm Stripe config and currency without exposing secrets.

