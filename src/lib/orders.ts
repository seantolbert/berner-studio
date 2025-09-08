import { adminSupabase } from "@/lib/supabase/serverAdmin";

export type OrderItemSnapshot = {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
  breakdown?: { baseCents: number; variableCents: number; extrasCents: number };
  config?: unknown;
};

export async function createDraftOrder(args: {
  email?: string | null;
  amount_cents: number;
  currency: string;
  capture_method: "automatic" | "manual";
  save_card: boolean;
  stripe_payment_intent_id: string;
  items: OrderItemSnapshot[];
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
      metadata: {},
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

