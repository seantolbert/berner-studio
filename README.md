This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Supabase (CLI) Setup

- Install CLI: `brew install supabase/tap/supabase` or see docs for your OS.
- Login (stores token outside the repo): `supabase login`
- Link to your project: `supabase link --project-ref <your-project-ref>`
- Apply DB schema: `supabase db push` (uses files in `supabase/migrations/`)
- Set env locally: copy `.env.local.example` to `.env.local` and fill `SUPABASE_URL` and `SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_*`).

Notes
- `.gitignore` excludes `.env*` and Supabase CLI temp folders, so secrets and local containers aren’t committed.
- RLS policies require authenticated users. Sign in at least once before testing inserts to `boards`.

## Payments (Stripe)

This app uses Stripe’s PaymentIntents API with Stripe Elements to collect cards and wallets without touching raw card data.

Environment variables (add to `.env.local`):
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — pk_test_...
- `STRIPE_SECRET_KEY` — sk_test_...
- `STRIPE_WEBHOOK_SECRET` — whsec_... (from Stripe CLI or Dashboard)

Install dependencies:
- React 19 is used; `@stripe/react-stripe-js` currently peers React <= 18. Install with legacy peer resolution:
  - `npm install --legacy-peer-deps`

Local testing:
1. Start dev server: `npm run dev`
2. Add an item to cart and open `/checkout`.
3. Use card `4242 4242 4242 4242`, any future expiry/CVC.
4. For 3DS testing, use `4000 0027 6000 3184` and complete challenge.

Webhooks:
- Install and login to Stripe CLI: `stripe login`
- Listen and forward: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- Paste the printed `whsec_...` into `STRIPE_WEBHOOK_SECRET`.
- Trigger a test event: `stripe trigger payment_intent.succeeded`

Production hardening:
- Set `STRIPE_WEBHOOK_SECRET` in production envs and ensure your webhook URL is HTTPS.
- This app enforces signature verification and requires HTTPS in production.
- Quick check: `GET /api/health` returns booleans for Stripe key presence (no secrets).

Go live with Stripe:
- Switch to live keys in your host env:
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...`
  - `STRIPE_SECRET_KEY=sk_live_...`
  - Keep `STRIPE_WEBHOOK_SECRET` from your live Dashboard webhook endpoint.
- Verify currency:
  - Set `NEXT_PUBLIC_CURRENCY` to your ISO code (default `usd`).
  - `GET /api/health` shows `{ env: { stripe: { mode: "live" }, currency: "usd" } }` when configured.
- Apple Pay domain verification: complete in Stripe Dashboard for your production domain.
- Create a live webhook endpoint in Stripe pointing to `https://yourdomain.com/api/stripe/webhook` and paste its signing secret into prod env.

Manual capture:
- Toggle “Authorize only (capture later)” on `/checkout`.
- Capture later: `POST /api/capture/{payment_intent_id}` with JSON `{ "amount_to_capture": 5000 }` (cents; optional).

Save card for later:
- In checkout, check “Save card for later” (sets `setup_future_usage=off_session`).
- Or create a SetupIntent: `POST /api/create-setup-intent` (optionally pass `customerId`).

Wallets:
- Enabled via automatic payment methods; Apple Pay requires domain verification in Dashboard for production.

Tax and shipping:
- Shipping: free over $75, otherwise $9.95 (`src/lib/pricing.ts`).
- Tax: stubbed to 0 by default, with hooks to add Stripe Tax or a flat external rate.

Next steps (optional):
- Persist orders and payment states to Supabase on webhook events.
- Send receipts and fulfillment emails (Resend/Postmark).
- Live shipping rates/labels (Shippo/EasyPost).
- Add PayPal Checkout if needed.

## Lead Time (ETA)

We show estimated delivery windows on the configurator, product pages, and checkout using a small heuristic in `src/lib/leadtime.ts`:
- Boards: base production days by size (small 3–5, regular 5–7, large 7–10), +1 day for juice groove, +1 day if a third strip is enabled, and +1 per ~60 filled cells.
- Stock products: 0–1 production days.
- Shipping: assumed 3–5 business days (ground). Weekends excluded in date math.

Customize:
- Tweak the constants in `leadtime.ts` to match your shop’s reality.
- If you add expedited shipping later, add a second shipping profile and choose based on selection.

## Analytics & Monitoring

GA4 (optional):
- Set `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXX` to enable GA4 via a script tag in `layout.tsx`.

Plausible (optional):
- Set `NEXT_PUBLIC_PLAUSIBLE_DOMAIN=yourdomain.com` to enable Plausible.

Sentry (CDN, quick start):
- Set `SENTRY_DSN=` to enable the browser SDK via CDN from `layout.tsx` (error, performance, and session replay). This is client‑only.

Sentry (full Next.js integration, recommended):
1. Install: `npm install @sentry/nextjs`
2. Initialize: `npx @sentry/wizard -i nextjs` (or add minimal `sentry.client.config.ts` / `sentry.server.config.ts`).
3. Set envs: `SENTRY_DSN`, optional sample rates, and auth tokens for source maps in your host.
4. Deploy: Vercel can auto‑upload source maps with the Sentry integration.
5. Test: add a button to throw on client or `GET /api/debug-sentry` on server (wizard can scaffold these).

## Admin Protection

An admin page exists at `/admin/orders` for development.

To protect it before launch, HTTP Basic Auth is enabled via middleware:
- Set `ADMIN_USER` and `ADMIN_PASS` in environment variables.
- Requests to `/admin/*` require a matching `Authorization: Basic …` header.
- If not set, access is blocked by default.

For a stronger model, replace with Supabase-authenticated checks (allowlist emails) or remove the route entirely.
