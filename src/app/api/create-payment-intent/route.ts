import { NextResponse } from "next/server";
import Stripe from "stripe";
import { STRIPE_SECRET_KEY } from "@/lib/env";
import { coerceItems, priceCart } from "@/lib/pricing";
import { createDraftOrder } from "@/lib/orders";

export const dynamic = "force-dynamic";

const stripe = (() => {
  if (!STRIPE_SECRET_KEY) return null as unknown as Stripe;
  return new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: "2024-06-20",
  });
})();

type PostBody = {
  items: unknown;
  capture?: "auto" | "manual";
  save_card?: boolean;
  customerId?: string; // Optional: Stripe customer to attach PMs
  customerEmail?: string; // Optional: used for receipts
  idempotencyKey?: string;
  description?: string;
  // destination info for future tax/shipping calc (ignored for now)
  country?: string;
  state?: string;
  postalCode?: string;
};

export async function POST(req: Request) {
  try {
    if (!STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Stripe server key not configured" }, { status: 500 });
    }

    const body = (await req.json().catch(() => ({}))) as Partial<PostBody> | undefined;
    const items = coerceItems(body?.items);
    if (!items.length) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    const capture = body?.capture === "manual" ? "manual" : "auto";
    const saveCard = Boolean(body?.save_card);
    const customerId = body?.customerId;
    const customerEmail = body?.customerEmail;
    const idempotencyKey = body?.idempotencyKey || req.headers.get("x-idempotency-key") || undefined;

    const quote = priceCart({ items });
    if (quote.total <= 0) {
      return NextResponse.json({ error: "Calculated total is zero" }, { status: 400 });
    }

    const params: Stripe.PaymentIntentCreateParams = {
      amount: quote.total,
      currency: quote.currency as Stripe.Checkout.SessionCreateParams.PaymentIntentData.Currency,
      automatic_payment_methods: { enabled: true },
      capture_method: capture === "manual" ? "manual" : "automatic",
      description: body?.description || undefined,
      receipt_email: customerEmail || undefined,
      metadata: {
        app: "bsfront",
        save_card: String(saveCard),
        subtotal: String(quote.subtotal),
        shipping: String(quote.shipping),
        tax: String(quote.tax),
      },
    };

    if (customerId) params.customer = customerId;
    if (saveCard) params.setup_future_usage = "off_session";

    const intent = await stripe.paymentIntents.create(params, {
      idempotencyKey,
    });

    // Persist a draft order (best-effort)
    try {
      await createDraftOrder({
        email: customerEmail || null,
        amount_cents: quote.total,
        currency: quote.currency,
        capture_method: params.capture_method === "manual" ? "manual" : "automatic",
        save_card: Boolean(saveCard),
        stripe_payment_intent_id: intent.id,
        items: items.map((it) => ({ id: it.id, name: it.name, unitPrice: it.unitPrice, quantity: it.quantity, breakdown: it.breakdown, config: it.config })),
      });
    } catch (e) {
      console.warn("Order persistence failed (non-fatal)", e);
    }

    const warnings: string[] = [];
    if (saveCard && !customerId) {
      warnings.push("save_card requested but no customerId provided; payment method may not be reusable");
    }

    return NextResponse.json({
      id: intent.id,
      clientSecret: intent.client_secret,
      amount: quote.total,
      currency: quote.currency,
      subtotal: quote.subtotal,
      shipping: quote.shipping,
      tax: quote.tax,
      capture,
      warnings,
    });
  } catch (err: any) {
    const message = err?.message || "Unknown error";
    const status = err?.statusCode || 500;
    return NextResponse.json({ error: message }, { status });
  }
}
