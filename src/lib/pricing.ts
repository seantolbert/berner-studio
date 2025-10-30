// Minimal, deterministic pricing utilities used on server and client.
// Keep logic pure and independent of UI state.

import type { CartBreakdown, CartConfig, CartItem } from "@/types/cart";
import type { BoardExtras, BoardLayout, BoardSize } from "@/types/board";

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

function clampToCents(n: number): number {
  if (!Number.isFinite(n)) return 0;
  // Ensure integer cents and non-negative
  const rounded = Math.round(n);
  return rounded < 0 ? 0 : rounded;
}

function computeSubtotal(items: CartItem[]): number {
  return clampToCents(
    items.reduce((sum, it) => sum + clampToCents(it.unitPrice) * Math.max(1, clampToCents(it.quantity)), 0)
  );
}

function computeShipping(subtotal: number): number {
  if (subtotal >= FREE_SHIPPING_THRESHOLD_CENTS) return 0;
  return FLAT_SHIPPING_CENTS;
}

// Stubbed tax calculation. Replace with Stripe Tax/TaxJar later.
export type TaxConfig =
  | { provider: "none" }
  | { provider: "stripe"; taxBehavior?: "exclusive" | "inclusive" }
  | { provider: "external"; rate: number }; // flat fallback rate e.g., 0.0825 for 8.25%

// Default: no tax computation in-app. Replace with Stripe Tax or external provider.
function computeTax(
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

const BOARD_SIZES: BoardSize[] = ["small", "regular", "large"];
const EDGE_PROFILES: BoardExtras["edgeProfile"][] = ["square", "roundover", "chamfer"];
const HANDLE_STYLES = new Set(["none", "glide", "lift"]);

function sanitizeExtrasDetail(value: unknown): CartBreakdown["extrasDetail"] | undefined {
  if (!Array.isArray(value)) return undefined;
  const details = value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const rec = entry as Record<string, unknown>;
      const label = typeof rec.label === "string" ? rec.label.trim() : "";
      if (!label) return null;
      const amount = clampToCents(Number(rec.amountCents));
      return { label, amountCents: amount };
    })
    .filter(Boolean) as NonNullable<CartBreakdown["extrasDetail"]>;
  return details.length ? details : undefined;
}

function sanitizeBreakdown(value: unknown): CartBreakdown | undefined {
  if (!value || typeof value !== "object") return undefined;
  const rec = value as Record<string, unknown>;
  const baseCents = clampToCents(Number(rec.baseCents));
  const variableCents = clampToCents(Number(rec.variableCents));
  const extrasCents = clampToCents(Number(rec.extrasCents));
  const extrasDetail = sanitizeExtrasDetail(rec.extrasDetail);
  return {
    baseCents,
    variableCents,
    extrasCents,
    ...(extrasDetail ? { extrasDetail } : {}),
  };
}

function sanitizeBoardLayout(value: unknown): BoardLayout {
  const layout: BoardLayout = { strips: [], order: [] };
  if (!value || typeof value !== "object") return layout;
  const rec = value as Record<string, unknown>;
  const stripsRaw = rec.strips;
  if (Array.isArray(stripsRaw)) {
    layout.strips = stripsRaw.map((row) => {
      if (!Array.isArray(row)) return [];
      return row.map((cell) => (typeof cell === "string" ? cell : null));
    });
  }
  const orderRaw = rec.order;
  if (Array.isArray(orderRaw)) {
    layout.order = orderRaw
      .map((entry) => {
        if (!entry || typeof entry !== "object") return null;
        const item = entry as Record<string, unknown>;
        const rawStrip = Number(item.stripNo);
        const stripNo = Number.isFinite(rawStrip) ? Math.max(1, Math.round(rawStrip)) : 1;
        const reflected = Boolean(item.reflected);
        return { stripNo, reflected };
      })
      .filter(Boolean) as BoardLayout["order"];
  }
  return layout;
}

function sanitizeBoardExtras(value: unknown): BoardExtras {
  const defaults: BoardExtras = { edgeProfile: "square", borderRadius: 0, chamferSize: 0, grooveEnabled: false };
  if (!value || typeof value !== "object") return defaults;
  const rec = value as Record<string, unknown>;
  const rawEdge = typeof rec.edgeProfile === "string" ? rec.edgeProfile.toLowerCase() : "";
  const edgeProfile = EDGE_PROFILES.includes(rawEdge as BoardExtras["edgeProfile"])
    ? (rawEdge as BoardExtras["edgeProfile"])
    : defaults.edgeProfile;
  const borderRadius = Number.isFinite(Number(rec.borderRadius))
    ? Math.max(0, Math.round(Number(rec.borderRadius)))
    : defaults.borderRadius;
  const chamferSize = Number.isFinite(Number(rec.chamferSize))
    ? Math.max(0, Math.round(Number(rec.chamferSize)))
    : defaults.chamferSize;
  const grooveEnabled = Boolean(rec.grooveEnabled);
  return { edgeProfile, borderRadius, chamferSize, grooveEnabled };
}

function sanitizeCartConfig(value: unknown): CartConfig | undefined {
  if (!value || typeof value !== "object") return undefined;
  const rec = value as Record<string, unknown>;
  const rawSize = typeof rec.size === "string" ? rec.size.toLowerCase() : "";
  const size = BOARD_SIZES.includes(rawSize as BoardSize) ? (rawSize as BoardSize) : "regular";
  const strip3Enabled = Boolean(rec.strip3Enabled);
  const boardData = sanitizeBoardLayout(rec.boardData);
  const extras = sanitizeBoardExtras(rec.extras);
  const edgeOption =
    typeof rec.edgeOption === "string" && rec.edgeOption.trim().length ? rec.edgeOption.trim() : undefined;
  const rawHandle = typeof rec.handleStyle === "string" ? rec.handleStyle.toLowerCase() : null;
  const handleStyle = rawHandle && HANDLE_STYLES.has(rawHandle) ? (rawHandle as CartConfig["handleStyle"]) : undefined;
  const brassFeet = Boolean(rec.brassFeet);

  const config: CartConfig = {
    size,
    strip3Enabled,
    boardData,
    extras,
  };
  if (edgeOption) config.edgeOption = edgeOption;
  if (handleStyle) config.handleStyle = handleStyle;
  if (brassFeet) config.brassFeet = true;
  return config;
}

function sanitizeImage(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

// Helper to ensure an arbitrary value resembles a CartItem array; defensive on server.
export function coerceItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => {
      if (!v || typeof v !== "object") return null;
      const it = v as Record<string, unknown>;
      const unitPrice = clampToCents(Number(it.unitPrice));
      const quantity = clampToCents(Number((it.quantity as number) ?? 1));
      const id = typeof it.id === "string" ? it.id : undefined;
      const name = typeof it.name === "string" ? it.name : "Item";
      if (!id) return null;
      const breakdown = sanitizeBreakdown(it.breakdown);
      const config = sanitizeCartConfig(it.config);
      const image = sanitizeImage(it.image);
      return {
        id,
        name,
        unitPrice,
        quantity: Math.max(1, quantity),
        ...(breakdown ? { breakdown } : {}),
        ...(config ? { config } : {}),
        ...(image ? { image } : {}),
      } as CartItem;
    })
    .filter(Boolean) as CartItem[];
}
