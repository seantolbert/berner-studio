// Centralized access to environment variables with runtime validation.
// Keep side-effect free and only expose non-secret values to client components.
import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_ADMIN_EMAILS: z.string().optional(),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // Stripe
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Admin
  ADMIN_USER: z.string().optional(),
  ADMIN_PASS: z.string().optional(),

  // Email
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional(),

  // Misc / Analytics
  NEXT_PUBLIC_CURRENCY: z
    .string()
    .transform((s) => s.toLowerCase())
    .optional(),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
});

const rawEnv = {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_ADMIN_EMAILS: process.env.NEXT_PUBLIC_ADMIN_EMAILS,

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_URL: process.env.SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,

  // Stripe
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,

  // Admin
  ADMIN_USER: process.env.ADMIN_USER,
  ADMIN_PASS: process.env.ADMIN_PASS,

  // Email
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,

  // Misc / Analytics
  NEXT_PUBLIC_CURRENCY: process.env.NEXT_PUBLIC_CURRENCY,
  NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN,
  SENTRY_DSN: process.env.SENTRY_DSN,
};

const parsed = EnvSchema.safeParse(rawEnv);
if (!parsed.success) {
  // Consolidate Zod issues into a single error to surface at startup
  const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
  throw new Error(`Invalid environment configuration: ${issues}`);
}
const env = parsed.data;

export const NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
export const STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY ?? "";
export const STRIPE_WEBHOOK_SECRET = env.STRIPE_WEBHOOK_SECRET ?? "";

export const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL ?? env.SUPABASE_URL ?? "";
export const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY ?? "";

// Currency (public) — ISO 4217 code, default 'usd'
export const DEFAULT_CURRENCY = (env.NEXT_PUBLIC_CURRENCY ?? "usd").toLowerCase();

export const RESEND_API_KEY = env.RESEND_API_KEY ?? "";
export const RESEND_FROM_EMAIL = env.RESEND_FROM_EMAIL ?? "";

const ADMIN_EMAILS = (env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim())
  .filter((email) => email.length > 0);

export function getAdminEmails() {
  return ADMIN_EMAILS;
}

export function hasEmailTransport() {
  return RESEND_API_KEY.length > 0 && RESEND_FROM_EMAIL.length > 0;
}

// Lightweight check helpers
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
