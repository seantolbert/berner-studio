import { NextResponse } from "next/server";
import Stripe from "stripe";
import { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } from "@/lib/env";
import { markOrderAuthorizedByPI, markOrderCanceledByPI, markOrderPaidByPI, recordPaymentEvent } from "@/lib/orders";

export const runtime = "nodejs"; // ensure Node runtime for raw body access
export const dynamic = "force-dynamic";

const stripe = (() => {
  if (!STRIPE_SECRET_KEY) return null as unknown as Stripe;
  return new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
})();

export async function POST(req: Request) {
  try {
    const isProd = process.env.NODE_ENV === "production";
    // In production, require HTTPS (respecting proxy headers like on Vercel)
    if (isProd) {
      const proto = (req.headers.get("x-forwarded-proto") || "").toLowerCase();
      if (proto && proto !== "https") {
        return NextResponse.json({ error: "Webhook must be called over HTTPS" }, { status: 400 });
      }
    }
    const sig = req.headers.get("stripe-signature");
    const buf = await req.text(); // raw body for signature verification

    if (!STRIPE_SECRET_KEY || !stripe) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }

    let event: Stripe.Event;
    if (STRIPE_WEBHOOK_SECRET && sig) {
      try {
        event = stripe.webhooks.constructEvent(buf, sig, STRIPE_WEBHOOK_SECRET);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : typeof error === "string" ? error : "Unknown error";
        return NextResponse.json(
          { error: `Webhook signature verification failed: ${message}` },
          { status: 400 }
        );
      }
    } else {
      if (isProd) {
        return NextResponse.json({ error: "Missing webhook signature or secret" }, { status: 400 });
      }
      // Fallback for local dev without signing secret (not allowed in production)
      try {
        event = JSON.parse(buf);
      } catch {
        return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
      }
    }

    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        await markOrderPaidByPI(pi.id).catch(() => {});
        const paymentMethodId =
          typeof pi.payment_method === "string"
            ? pi.payment_method
            : typeof pi.payment_method === "object" && pi.payment_method !== null
              ? (pi.payment_method as Stripe.PaymentMethod).id
              : null;
        await recordPaymentEvent({
          pi_id: pi.id,
          pm_id: paymentMethodId,
          amount_cents: pi.amount_received || pi.amount,
          currency: pi.currency,
          status: pi.status,
          raw: pi,
        }).catch(() => {});
        break;
      }
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        console.warn("[webhook] payment_intent.payment_failed", { id: pi.id, last_payment_error: pi.last_payment_error?.message });
        break;
      }
      case "payment_intent.amount_capturable_updated": {
        const pi = event.data.object as Stripe.PaymentIntent;
        if (pi.capture_method === "manual" && pi.status === "requires_capture") {
          await markOrderAuthorizedByPI(pi.id).catch(() => {});
        }
        break;
      }
      case "payment_intent.canceled": {
        const pi = event.data.object as Stripe.PaymentIntent;
        await markOrderCanceledByPI(pi.id).catch(() => {});
        break;
      }
      case "charge.refunded": {
        break;
      }
      default: {
        // Intentionally left blank; no logging in production environment
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : typeof error === "string" ? error : "Unhandled error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
