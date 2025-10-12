import { clientEnv, serverEnv } from "../../env.mjs";

export const NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY =
  clientEnv.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
export const STRIPE_SECRET_KEY = serverEnv.STRIPE_SECRET_KEY ?? "";
export const STRIPE_WEBHOOK_SECRET = serverEnv.STRIPE_WEBHOOK_SECRET ?? "";

export const SUPABASE_URL =
  clientEnv.NEXT_PUBLIC_SUPABASE_URL ?? serverEnv.SUPABASE_URL ?? "";
export const SUPABASE_SERVICE_ROLE_KEY = serverEnv.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const RESEND_API_KEY = serverEnv.RESEND_API_KEY ?? "";
export const RESEND_FROM_EMAIL = serverEnv.RESEND_FROM_EMAIL ?? "";

export const DEFAULT_CURRENCY = (clientEnv.NEXT_PUBLIC_CURRENCY ?? "usd").toLowerCase();

const ADMIN_EMAILS = (clientEnv.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
  .split(",")
  .map((email: string) => email.trim())
  .filter((email: string) => email.length > 0);

export function getAdminEmails() {
  return ADMIN_EMAILS;
}

export function hasEmailTransport() {
  return RESEND_API_KEY.length > 0 && RESEND_FROM_EMAIL.length > 0;
}

export function hasStripeServerKeys() {
  return STRIPE_SECRET_KEY.length > 0;
}

export function hasStripeWebhookSecret() {
  return STRIPE_WEBHOOK_SECRET.length > 0;
}

export function stripeKeyMode(): "live" | "test" | "unknown" {
  const key = STRIPE_SECRET_KEY;
  if (!key) return "unknown";
  if (key.startsWith("sk_live_")) return "live";
  if (key.startsWith("sk_test_")) return "test";
  return "unknown";
}
