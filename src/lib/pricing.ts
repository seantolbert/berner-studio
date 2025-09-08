// Minimal, deterministic pricing utilities used on server and client.
// Keep logic pure and independent of UI state.

export type Size = "small" | "regular" | "large";

export type CartItem = {
  id: string;
  name: string;
  unitPrice: number; // cents
  quantity: number;
  breakdown?: { baseCents: number; variableCents: number; extrasCents: number };
  config?: {
    size: Size;
    strip3Enabled: boolean;
    boardData: { strips: (string | null)[][]; order: { stripNo: number; reflected: boolean }[] };
    extras: { edgeProfile: "square" | "roundover" | "chamfer"; borderRadius: number; chamferSize: number; grooveEnabled: boolean };
  };
};

export type PricingInput = {
  items: CartItem[];
  // Optionally include destination or flags if you want to compute tax/shipping here later
  country?: string; // e.g., 'US'
  state?: string; // e.g., 'CA'
  postalCode?: string;
};

export type PriceQuote = {
  currency: string; // 'usd'
  subtotal: number; // cents
  shipping: number; // cents
  tax: number; // cents
  total: number; // cents
};

import { DEFAULT_CURRENCY } from "@/lib/env";
const CURRENCY = DEFAULT_CURRENCY;

// Free shipping threshold echoing marketing copy "Free shipping $75+"
const FREE_SHIPPING_THRESHOLD_CENTS = 75_00; // $75.00
const FLAT_SHIPPING_CENTS = 9_95; // $9.95 below threshold

export function clampToCents(n: number): number {
  if (!Number.isFinite(n)) return 0;
  // Ensure integer cents and non-negative
  const rounded = Math.round(n);
  return rounded < 0 ? 0 : rounded;
}

export function computeSubtotal(items: CartItem[]): number {
  return clampToCents(
    items.reduce((sum, it) => sum + clampToCents(it.unitPrice) * Math.max(1, clampToCents(it.quantity)), 0)
  );
}

export function computeShipping(subtotal: number): number {
  if (subtotal >= FREE_SHIPPING_THRESHOLD_CENTS) return 0;
  return FLAT_SHIPPING_CENTS;
}

// Stubbed tax calculation. Replace with Stripe Tax/TaxJar later.
export type TaxConfig =
  | { provider: "none" }
  | { provider: "stripe"; taxBehavior?: "exclusive" | "inclusive" }
  | { provider: "external"; rate: number }; // flat fallback rate e.g., 0.0825 for 8.25%

// Default: no tax computation in-app. Replace with Stripe Tax or external provider.
export function computeTax(
  _input: PricingInput,
  subtotal: number,
  _shipping: number,
  cfg: TaxConfig = { provider: "none" }
): number {
  if (cfg.provider === "external") {
    const rate = Math.max(0, Math.min(1, cfg.rate));
    return clampToCents(subtotal * rate);
  }
  // For provider "stripe", compute in backend per-line with Tax APIs; here return 0.
  return 0;
}

export function priceCart(input: PricingInput, taxConfig?: TaxConfig): PriceQuote {
  const subtotal = computeSubtotal(input.items || []);
  const shipping = computeShipping(subtotal);
  const tax = computeTax(input, subtotal, shipping, taxConfig);
  const total = clampToCents(subtotal + shipping + tax);
  return { currency: CURRENCY, subtotal, shipping, tax, total };
}

// Helper to ensure an arbitrary value resembles a CartItem array; defensive on server.
export function coerceItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => {
      if (!v || typeof v !== "object") return null;
      const it = v as any;
      const unitPrice = clampToCents(Number(it.unitPrice));
      const quantity = clampToCents(Number(it.quantity || 1));
      if (!it.id || typeof it.id !== "string") return null;
      return {
        id: it.id as string,
        name: typeof it.name === "string" ? it.name : "Item",
        unitPrice,
        quantity: Math.max(1, quantity),
      } as CartItem;
    })
    .filter(Boolean) as CartItem[];
}
