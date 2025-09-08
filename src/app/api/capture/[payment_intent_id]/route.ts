import { NextResponse } from "next/server";
import Stripe from "stripe";
import { STRIPE_SECRET_KEY } from "@/lib/env";

export const dynamic = "force-dynamic";

const stripe = (() => {
  if (!STRIPE_SECRET_KEY) return null as unknown as Stripe;
  return new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
})();

type Body = {
  amount_to_capture?: number; // cents
  idempotencyKey?: string;
};

export async function POST(
  req: Request,
  { params }: { params: { payment_intent_id: string } }
) {
  try {
    if (!STRIPE_SECRET_KEY || !stripe) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }
    const id = params.payment_intent_id;
    if (!id) return NextResponse.json({ error: "Missing payment_intent_id" }, { status: 400 });

    const body = (await req.json().catch(() => ({}))) as Partial<Body> | undefined;
    const amount_to_capture = body?.amount_to_capture;
    const idempotencyKey = body?.idempotencyKey || req.headers.get("x-idempotency-key") || undefined;

    const captured = await stripe.paymentIntents.capture(id, amount_to_capture ? { amount_to_capture } : undefined, {
      idempotencyKey,
    });

    return NextResponse.json({ id: captured.id, status: captured.status, amount_received: captured.amount_received });
  } catch (err: any) {
    const status = err?.statusCode || 500;
    const message = err?.message || "Unknown error";
    return NextResponse.json({ error: message }, { status });
  }
}

