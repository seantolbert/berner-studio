import { NextResponse } from "next/server";
import Stripe from "stripe";
import { STRIPE_SECRET_KEY } from "@/lib/env";

export const dynamic = "force-dynamic";

const stripe = (() => {
  if (!STRIPE_SECRET_KEY) return null as unknown as Stripe;
  return new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
})();

type Body = {
  customerId?: string;
  idempotencyKey?: string;
};

export async function POST(req: Request) {
  try {
    if (!STRIPE_SECRET_KEY || !stripe) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }
    const body = (await req.json().catch(() => ({}))) as Partial<Body> | undefined;
    const customer = body?.customerId;
    const idempotencyKey = body?.idempotencyKey || req.headers.get("x-idempotency-key") || undefined;

    const si = await stripe.setupIntents.create(
      {
        payment_method_types: ["card"],
        usage: "off_session",
        customer: customer || undefined,
        automatic_payment_methods: { enabled: true },
      },
      { idempotencyKey }
    );

    return NextResponse.json({ id: si.id, clientSecret: si.client_secret });
  } catch (err: any) {
    const status = err?.statusCode || 500;
    const message = err?.message || "Unknown error";
    return NextResponse.json({ error: message }, { status });
  }
}

