import { adminSupabase } from "@/lib/supabase/serverAdmin";
import type { CheckoutDraftMetadata } from "@/types/checkout";

export type OrderItemSnapshot = {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
  breakdown?: { baseCents: number; variableCents: number; extrasCents: number };
  config?: unknown;
};

export type OrderRecord = {
  id: string;
  created_at: string;
  updated_at: string;
  status: string;
  amount_cents: number;
  currency: string;
  capture_method: "automatic" | "manual";
  save_card: boolean;
  email: string | null;
  stripe_payment_intent_id: string | null;
  items: OrderItemSnapshot[];
  metadata: CheckoutDraftMetadata | null;
  merchant_notified_at: string | null;
  customer_notified_at: string | null;
};

export async function createDraftOrder(args: {
  email?: string | null;
  amount_cents: number;
  currency: string;
  capture_method: "automatic" | "manual";
  save_card: boolean;
  stripe_payment_intent_id: string;
  items: OrderItemSnapshot[];
  metadata?: CheckoutDraftMetadata;
}) {
  if (!adminSupabase) return null;
  const { data, error } = await adminSupabase
    .from("orders")
    .insert({
      email: args.email ?? null,
      status: args.capture_method === "manual" ? "authorized" : "pending",
      amount_cents: args.amount_cents,
      currency: args.currency,
      capture_method: args.capture_method,
      save_card: args.save_card,
      stripe_payment_intent_id: args.stripe_payment_intent_id,
      items: args.items,
      metadata: args.metadata ?? {},
    })
    .select("id")
    .single();
  if (error) throw error;
  return data?.id as string | null;
}

export async function markOrderPaidByPI(piId: string) {
  if (!adminSupabase) return;
  await adminSupabase
    .from("orders")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("stripe_payment_intent_id", piId);
}

export async function markOrderAuthorizedByPI(piId: string) {
  if (!adminSupabase) return;
  await adminSupabase
    .from("orders")
    .update({ status: "authorized", authorized_at: new Date().toISOString() })
    .eq("stripe_payment_intent_id", piId);
}

export async function markOrderCanceledByPI(piId: string) {
  if (!adminSupabase) return;
  await adminSupabase
    .from("orders")
    .update({ status: "canceled", canceled_at: new Date().toISOString() })
    .eq("stripe_payment_intent_id", piId);
}

export async function recordPaymentEvent(args: {
  order_id?: string | null;
  pi_id: string;
  pm_id?: string | null;
  charge_id?: string | null;
  amount_cents: number;
  currency: string;
  status: string;
  raw?: unknown;
}) {
  if (!adminSupabase) return;
  await adminSupabase.from("payments").insert({
    order_id: args.order_id ?? null,
    amount_cents: args.amount_cents,
    currency: args.currency,
    status: args.status,
    stripe_payment_intent_id: args.pi_id,
    stripe_payment_method_id: args.pm_id ?? null,
    stripe_charge_id: args.charge_id ?? null,
    raw: args.raw ?? null,
  });
}

export async function getOrderByPaymentIntentId(piId: string) {
  if (!adminSupabase) return null;
  const { data, error } = await adminSupabase
    .from("orders")
    .select(
      "id, created_at, updated_at, status, amount_cents, currency, capture_method, save_card, email, stripe_payment_intent_id, items, metadata, merchant_notified_at, customer_notified_at"
    )
    .eq("stripe_payment_intent_id", piId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    ...data,
    items: (Array.isArray((data as { items?: unknown }).items) ? (data as { items: OrderItemSnapshot[] }).items : []) as OrderItemSnapshot[],
    metadata: ((data as { metadata?: CheckoutDraftMetadata | null }).metadata ?? null) as CheckoutDraftMetadata | null,
  } as OrderRecord;
}

export async function markOrderNotified(orderId: string, notifications: { merchant?: boolean; customer?: boolean }) {
  if (!adminSupabase) return;
  const updates: Record<string, string> = {};
  const now = new Date().toISOString();
  if (notifications.merchant) updates.merchant_notified_at = now;
  if (notifications.customer) updates.customer_notified_at = now;
  if (!Object.keys(updates).length) return;
  await adminSupabase
    .from("orders")
    .update(updates)
    .eq("id", orderId);
}
