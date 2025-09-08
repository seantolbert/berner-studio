import { NextResponse } from "next/server";
import { hasStripeServerKeys, hasStripeWebhookSecret, stripeKeyMode, DEFAULT_CURRENCY } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  // Expose only booleans, never secrets.
  return NextResponse.json({
    ok: true,
    env: {
      stripe: {
        hasSecretKey: hasStripeServerKeys(),
        hasWebhookSecret: hasStripeWebhookSecret(),
        mode: stripeKeyMode(),
      },
      currency: DEFAULT_CURRENCY,
    },
  });
}
