import { NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import { STRIPE_SECRET_KEY } from "@/lib/env";

export const dynamic = "force-dynamic";

const stripe = (() => {
  if (!STRIPE_SECRET_KEY) return null as unknown as Stripe;
  return new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
})();

const BodySchema = z.object({
  customerId: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

type Body = z.infer<typeof BodySchema>;

export async function POST(req: Request) {
  try {
    if (!STRIPE_SECRET_KEY || !stripe) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }
    const jsonUnknown = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(jsonUnknown ?? {});
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data: Body = parsed.data;
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
  } catch (error: unknown) {
    const status =
      typeof (error as { statusCode?: number } | undefined)?.statusCode === "number"
        ? (error as { statusCode?: number }).statusCode ?? 500
        : 500;
    const message =
      typeof (error as { message?: string } | undefined)?.message === "string"
        ? (error as { message?: string }).message ?? "Unknown error"
        : "Unknown error";
    return NextResponse.json({ error: message }, { status });
  }
}
