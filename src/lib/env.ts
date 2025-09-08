// Centralized access to environment variables used across the app.
// Keep this minimal and side-effect free.

export const NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";

export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Currency (public) — ISO 4217 code, default 'usd'
export const DEFAULT_CURRENCY = (process.env.NEXT_PUBLIC_CURRENCY || "usd").toLowerCase();

// Lightweight check helpers we can use later in API routes/pages.
export function hasStripeClientKey() {
  return Boolean(NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
}

export function hasStripeServerKeys() {
  return Boolean(STRIPE_SECRET_KEY);
}

export function hasStripeWebhookSecret() {
  return Boolean(STRIPE_WEBHOOK_SECRET);
}

export function hasSupabaseServiceRole() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

export function stripeKeyMode(): "live" | "test" | "unknown" {
  const key = STRIPE_SECRET_KEY;
  if (!key) return "unknown";
  if (key.startsWith("sk_live_")) return "live";
  if (key.startsWith("sk_test_")) return "test";
  return "unknown";
}
