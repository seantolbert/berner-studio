import { NextResponse } from "next/server";
import { z } from "zod";
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
  ctx: { params: Promise<{ payment_intent_id: string }> }
) {
  try {
    if (!STRIPE_SECRET_KEY || !stripe) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }
    const { payment_intent_id: id } = await ctx.params;
    if (!id) return NextResponse.json({ error: "Missing payment_intent_id" }, { status: 400 });

    const BodySchema = z.object({ amount_to_capture: z.number().int().positive().optional(), idempotencyKey: z.string().optional() });
    const jsonUnknown = await req.json().catch(() => undefined);
    const parsed = jsonUnknown ? BodySchema.safeParse(jsonUnknown) : { success: true, data: {} } as const;
    if (!('success' in parsed) || !parsed.success) {
      return NextResponse.json({ error: "Invalid body", issues: (parsed as any).error.flatten?.() }, { status: 400 });
    }
    const body = (parsed as any).data as Partial<Body>;
    const amount_to_capture = body.amount_to_capture;
    const idempotencyKey = body.idempotencyKey ?? req.headers.get("x-idempotency-key") ?? undefined;

    const requestOpts: Stripe.RequestOptions | undefined = idempotencyKey
      ? { idempotencyKey }
      : undefined;
    const captured = await stripe.paymentIntents.capture(
      id,
      amount_to_capture ? { amount_to_capture } : undefined,
      requestOpts
    );

    return NextResponse.json({ id: captured.id, status: captured.status, amount_received: captured.amount_received });
  } catch (err: unknown) {
    const anyErr = err as { statusCode?: number; message?: string } | undefined;
    const status = anyErr?.statusCode || 500;
    const message = anyErr?.message || "Unknown error";
    return NextResponse.json({ error: message }, { status });
  }
}
