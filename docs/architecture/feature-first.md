# Feature-First Architecture

This repo is migrating to a feature-first layout. Routes remain under `src/app/**`, while UI, hooks, and domain logic live under `src/features/**`. Server-only logic sits under `src/server/**` and is consumed by API routes and server components.

## Aliases

- `@features/*` → `src/features/*`
- `@server/*` → `src/server/*`
- `@/*` → `src/*` (shared infra)

## Example: Board Builder (pilot)

- Feature modules (wrappers for now):
  - `src/features/board-builder/ui/*` (UI components)
  - `src/features/board-builder/hooks/*`
  - `src/features/board-builder/lib/*`
- Routes import via aliases:
  - `src/app/board-builder/page.tsx` → `@features/board-builder/ui/...`
  - `src/app/board-builder/extras/page.tsx` → `@features/board-builder/...`

As we complete the migration, we will move files physically into `src/features/board-builder/**` and delete the wrappers.

## Conventions

- UI-only code in `features/*/ui`. Keep client boundaries explicit ("use client").
- Reusable hooks in `features/*/hooks`.
- Pure domain logic in `features/*/lib`.
- Server-only code in `server/*`, imported only from API routes or server components.
- Validate inputs at feature boundaries using Zod.
- Avoid importing server SDKs (Stripe/Supabase admin) in client components.

## Next Migrations

- Admin CMS → `src/features/admin-cms/**` + `src/server/admin-cms/**` (API handlers delegate to server modules)
- Checkout/Stripe → `src/features/checkout/**` + `src/server/checkout/**`
- Catalog/Products → `src/features/catalog/**`

Track progress with `npm run typecheck`, `npm run lint`, and dead-code tools (`knip`, `ts-prune`).
