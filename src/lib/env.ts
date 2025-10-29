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

const ORDER_NOTIFICATION_EMAILS = (serverEnv.ORDER_NOTIFY_EMAILS ?? serverEnv.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
  .split(",")
  .map((email: string) => email.trim())
  .filter((email: string) => email.length > 0);

const ORDER_NOTIFICATION_SMS_NUMBERS = (serverEnv.ORDER_NOTIFY_SMS_NUMBERS ?? "")
  .split(",")
  .map((phone: string) => phone.trim())
  .filter((phone: string) => phone.length > 0);

export const TWILIO_ACCOUNT_SID = serverEnv.TWILIO_ACCOUNT_SID ?? "";
export const TWILIO_AUTH_TOKEN = serverEnv.TWILIO_AUTH_TOKEN ?? "";
export const TWILIO_FROM_NUMBER = serverEnv.TWILIO_FROM_NUMBER ?? "";

export function getAdminEmails() {
  return ADMIN_EMAILS;
}

export function hasEmailTransport() {
  return RESEND_API_KEY.length > 0 && RESEND_FROM_EMAIL.length > 0;
}

export function getOrderNotificationEmails() {
  return ORDER_NOTIFICATION_EMAILS;
}

export function getOrderNotificationSmsNumbers() {
  return ORDER_NOTIFICATION_SMS_NUMBERS;
}

export function hasSmsTransport() {
  return TWILIO_ACCOUNT_SID.length > 0 && TWILIO_AUTH_TOKEN.length > 0 && TWILIO_FROM_NUMBER.length > 0;
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
