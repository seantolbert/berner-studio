type NodeEnv = "development" | "test" | "production";

interface ClientEnvShape {
  NODE_ENV: NodeEnv;
  NEXT_PUBLIC_SITE_URL?: string;
  NEXT_PUBLIC_ADMIN_EMAILS?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?: string;
  NEXT_PUBLIC_CURRENCY?: string;
  NEXT_PUBLIC_GA_MEASUREMENT_ID?: string;
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN?: string;
}

interface ServerEnvShape extends ClientEnvShape {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  ADMIN_USER?: string;
  ADMIN_PASS?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  ORDER_NOTIFY_EMAILS?: string;
  ORDER_NOTIFY_SMS_NUMBERS?: string;
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_FROM_NUMBER?: string;
  SENTRY_DSN?: string;
}

export declare const serverEnv: Readonly<ServerEnvShape>;
export declare const clientEnv: Readonly<ClientEnvShape>;
export declare const env: Readonly<{
  server: Readonly<ServerEnvShape>;
  client: Readonly<ClientEnvShape>;
}>;

declare module "env.mjs" {
  export const serverEnv: Readonly<ServerEnvShape>;
  export const clientEnv: Readonly<ClientEnvShape>;
  export const env: Readonly<{
    server: Readonly<ServerEnvShape>;
    client: Readonly<ClientEnvShape>;
  }>;
}

declare module "../../env.mjs" {
  export { serverEnv, clientEnv, env } from "env.mjs";
}

declare module "../../../env.mjs" {
  export { serverEnv, clientEnv, env } from "env.mjs";
}
