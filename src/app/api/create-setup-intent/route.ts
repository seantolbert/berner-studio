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
  customerId?: string;
  idempotencyKey?: string;
};

export async function POST(req: Request) {
  try {
    if (!STRIPE_SECRET_KEY || !stripe) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }
    const BodySchema = z.object({ customerId: z.string().optional(), idempotencyKey: z.string().optional() });
    const jsonUnknown = await req.json().catch(() => undefined);
    const parsed = jsonUnknown ? BodySchema.safeParse(jsonUnknown) : { success: true, data: {} } as const;
    if (!('success' in parsed) || !parsed.success) {
      return NextResponse.json({ error: "Invalid body", issues: (parsed as any).error.flatten?.() }, { status: 400 });
    }
    const data = (parsed as any).data as Partial<Body>;
    const customer = data.customerId;
    const idempotencyKey = data.idempotencyKey ?? req.headers.get("x-idempotency-key") ?? undefined;

    const reqOpts: Stripe.RequestOptions | undefined = idempotencyKey
      ? { idempotencyKey }
      : undefined;
    const params: Stripe.SetupIntentCreateParams = {
      payment_method_types: ["card"],
      usage: "off_session",
      automatic_payment_methods: { enabled: true },
    };
    if (customer) params.customer = customer;

    const si = await stripe.setupIntents.create(params, reqOpts);

    return NextResponse.json({ id: si.id, clientSecret: si.client_secret });
  } catch (err: unknown) {
    const anyErr = err as { statusCode?: number; message?: string } | undefined;
    const status = anyErr?.statusCode || 500;
    const message = anyErr?.message || "Unknown error";
    return NextResponse.json({ error: message }, { status });
  }
}
