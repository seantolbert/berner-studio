import { NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import { STRIPE_SECRET_KEY } from "@/lib/env";
import { coerceItems, priceCart } from "@/lib/pricing";
import { createDraftOrder } from "@/lib/orders";
import type { CheckoutAddress, CheckoutContact, CheckoutDraftMetadata } from "@/types/checkout";

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
  shippingMethod?: "standard" | "expedited";
  promoCode?: string | null;
  contact?: CheckoutContact | null;
  shippingAddress?: CheckoutAddress | null;
  billingAddress?: CheckoutAddress | null;
  billingSameAsShipping?: boolean;
  notes?: string | null;
};

const ContactSchema = z
  .object({
    fullName: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
  })
  .optional()
  .nullable();

const AddressSchema = z
  .object({
    line1: z.string().optional().nullable(),
    line2: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    postalCode: z.string().optional().nullable(),
    country: z.string().optional().nullable(),
  })
  .optional()
  .nullable();

function sanitizeContact(contact: CheckoutContact | null | undefined): CheckoutContact | null {
  if (!contact) return null;
  const fullName = contact.fullName?.trim() ?? "";
  const email = contact.email?.trim() ?? "";
  const phone = contact.phone?.trim() ?? "";
  if (!fullName && !email && !phone) return null;
  const sanitized: CheckoutContact = {};
  if (fullName) sanitized.fullName = fullName;
  if (email) sanitized.email = email;
  if (phone) sanitized.phone = phone;
  return sanitized;
}

function sanitizeAddress(address: CheckoutAddress | null | undefined): CheckoutAddress | null {
  if (!address) return null;
  const line1 = address.line1?.toString().trim() ?? "";
  const line2 = address.line2?.toString().trim() ?? "";
  const city = address.city?.toString().trim() ?? "";
  const state = address.state?.toString().trim() ?? "";
  const postalCode = address.postalCode?.toString().trim() ?? "";
  const country = address.country?.toString().trim() ?? "";
  const hasPrimary = Boolean(line1 || city || state || postalCode || line2);
  if (!hasPrimary && !country) return null;
  if (!hasPrimary && country.toUpperCase() === "US") return null;
  const sanitized: CheckoutAddress = {};
  if (line1) sanitized.line1 = line1;
  if (line2) sanitized.line2 = line2;
  if (city) sanitized.city = city;
  if (state) sanitized.state = state;
  if (postalCode) sanitized.postalCode = postalCode;
  if (country) sanitized.country = country;
  return sanitized;
}

function sanitizeNotes(notes: string | null | undefined): string | null {
  if (typeof notes !== "string") return null;
  const trimmed = notes.trim();
  return trimmed.length ? trimmed : null;
}

export async function POST(req: Request) {
  try {
    if (!STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Stripe server key not configured" }, { status: 500 });
    }

    const Body = z.object({
      items: z.unknown(),
      capture: z.enum(["auto", "manual"]).optional(),
      save_card: z.boolean().optional(),
      customerId: z.string().optional(),
      customerEmail: z.string().email().optional(),
      idempotencyKey: z.string().optional(),
      description: z.string().optional(),
      country: z.string().optional(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
      shippingMethod: z.enum(["standard", "expedited"]).optional(),
      promoCode: z.string().optional(),
      contact: ContactSchema,
      shippingAddress: AddressSchema,
      billingAddress: AddressSchema,
      billingSameAsShipping: z.boolean().optional(),
      notes: z.string().optional().nullable(),
    });
    const jsonUnknown = await req.json().catch(() => undefined);
    const parsed = Body.safeParse(jsonUnknown ?? {});
    if (!parsed.success) return NextResponse.json({ error: "Invalid body", issues: parsed.error.flatten() }, { status: 400 });
    const body = parsed.data as Partial<PostBody>;
    const items = coerceItems(body.items);
    if (!items.length) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    const capture = body?.capture === "manual" ? "manual" : "auto";
    const saveCard = Boolean(body?.save_card);
    const customerId = body?.customerId;
    const customerEmail = body?.customerEmail?.trim();
    const idempotencyKey = body?.idempotencyKey || req.headers.get("x-idempotency-key") || undefined;

    const contact = sanitizeContact(body.contact ?? null);
    const shippingAddress = sanitizeAddress(body.shippingAddress ?? null);
    const billingSameAsShipping = Boolean(body.billingSameAsShipping);
    const billingAddress = billingSameAsShipping ? shippingAddress : sanitizeAddress(body.billingAddress ?? null);
    const notes = sanitizeNotes(body.notes);

    const quote = priceCart({
      items,
      ...(shippingAddress?.country ? { country: shippingAddress.country } : {}),
      ...(shippingAddress?.state ? { state: shippingAddress.state } : {}),
      ...(shippingAddress?.postalCode ? { postalCode: shippingAddress.postalCode } : {}),
    });

    const shippingMethod = body.shippingMethod ?? "standard";
    const shippingAdjustments: Record<NonNullable<PostBody["shippingMethod"]>, number> = {
      standard: 0,
      expedited: 1_500,
    };
    const shippingSurcharge = shippingAdjustments[shippingMethod] ?? 0;
    const shippingTotal = quote.shipping + shippingSurcharge;

    const promoCode = body.promoCode?.toUpperCase() ?? null;
    let promoDiscount = 0;
    if (promoCode === "WELCOME10") {
      promoDiscount = Math.min(Math.round(quote.subtotal * 0.1), 50_00);
    } else if (promoCode === "FREESHIP") {
      promoDiscount = Math.min(shippingTotal, quote.shipping + shippingSurcharge);
    }

    const finalTotal = Math.max(0, quote.subtotal + shippingTotal + quote.tax - promoDiscount);
    if (finalTotal <= 0) {
      return NextResponse.json({ error: "Calculated total is zero" }, { status: 400 });
    }

    const params: Stripe.PaymentIntentCreateParams = {
      amount: finalTotal,
      currency: quote.currency,
      payment_method_types: ["card"],
      capture_method: capture === "manual" ? "manual" : "automatic",
      metadata: {
        app: "bsfront",
        save_card: String(saveCard),
        subtotal: String(quote.subtotal),
        shipping: String(shippingTotal),
        tax: String(quote.tax),
        shipping_method: shippingMethod,
        shipping_surcharge: String(shippingSurcharge),
        promo_code: promoCode ?? "",
        promo_discount: String(promoDiscount),
      },
    };
    if (body.description) params.description = body.description;
    const receiptEmail = contact?.email ?? customerEmail;
    if (receiptEmail) params.receipt_email = receiptEmail;

    if (customerId) params.customer = customerId;
    if (saveCard) params.setup_future_usage = "off_session";

    const intent = await stripe.paymentIntents.create(params, idempotencyKey ? { idempotencyKey } : undefined);

    // Persist a draft order (best-effort)
    try {
      await createDraftOrder({
        email: receiptEmail || null,
        amount_cents: finalTotal,
        currency: quote.currency,
        capture_method: params.capture_method === "manual" ? "manual" : "automatic",
        save_card: Boolean(saveCard),
        stripe_payment_intent_id: intent.id,
        items: items.map((it) => ({
          id: it.id,
          name: it.name,
          unitPrice: it.unitPrice,
          quantity: it.quantity,
          ...(it.breakdown ? { breakdown: it.breakdown } : {}),
          ...(it.config ? { config: it.config } : {}),
        })),
        metadata: {
          contact,
          shippingAddress,
          billingAddress,
          billingSameAsShipping,
          notes,
          shippingMethod,
          shippingSurcharge,
          shippingTotal,
          promoCode,
          promoDiscount,
          orderTotal: finalTotal,
        } satisfies CheckoutDraftMetadata,
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
      amount: finalTotal,
      currency: quote.currency,
      subtotal: quote.subtotal,
      shipping: shippingTotal,
      tax: quote.tax,
      discount: promoDiscount,
      shippingMethod,
      promoCode,
      shippingSurcharge,
      contact,
      shippingAddress,
      billingAddress,
      billingSameAsShipping,
      notes,
      orderTotal: finalTotal,
      capture,
      warnings,
    });
  } catch (err: unknown) {
    const anyErr = err as { message?: string; statusCode?: number } | undefined;
    const message = anyErr?.message || "Unknown error";
    const status = anyErr?.statusCode || 500;
    return NextResponse.json({ error: message }, { status });
  }
}
