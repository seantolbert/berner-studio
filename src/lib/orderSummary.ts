import { formatCurrencyCents } from "@/lib/money";
import type { OrderRecord } from "@/lib/orders";
import type { CartConfig } from "@/types/cart";
import type { CheckoutAddress, CheckoutContact, CheckoutDraftMetadata } from "@/types/checkout";

export type OrderSummaryItem = {
  itemId: string | null;
  name: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  config: CartConfig | null;
};

export type OrderSummary = {
  orderId: string;
  orderShortId: string;
  createdAt: string;
  total: string;
  totalValue: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  captureMethod: string;
  items: OrderSummaryItem[];
  metadata: CheckoutDraftMetadata | null;
  shippingAddressLines: string[];
  billingAddressLines: string[];
  notes?: string | null;
  stripePaymentIntentId?: string | null;
};

export function buildOrderSummary(order: OrderRecord): OrderSummary {
  const metadata = order.metadata ?? null;
  const contact: CheckoutContact | null =
    metadata?.contact && typeof metadata.contact === "object" ? metadata.contact : null;
  const shippingAddress: CheckoutAddress | null =
    metadata?.shippingAddress && typeof metadata.shippingAddress === "object"
      ? metadata.shippingAddress
      : null;
  const billingAddress: CheckoutAddress | null =
    metadata?.billingAddress && typeof metadata.billingAddress === "object"
      ? metadata.billingAddress
      : null;

  const customerName = (contact?.fullName ?? "").trim();
  const customerEmail = (order.email ?? contact?.email ?? "").trim();
  const customerPhone = (contact?.phone ?? "").trim();

  const items = Array.isArray(order.items)
    ? order.items.map((item) => {
        const record = (item && typeof item === "object" ? (item as Record<string, unknown>) : {}) || {};
        const itemId = typeof record.id === "string" ? record.id : null;
        const quantity = Number(record.quantity) || 0;
        const unitPrice = Number(record.unitPrice) || 0;
        const rawConfig = "config" in record ? record.config : undefined;
        const config = parseCartConfig(rawConfig);
        if (!config && rawConfig) {
          console.warn("[buildOrderSummary] Unable to parse board config", {
            itemId,
            rawConfig,
          });
        }
        return {
          itemId,
          name: typeof record.name === "string" ? record.name : "Item",
          quantity,
          unitPrice: formatCurrencyCents(unitPrice, order.currency),
          lineTotal: formatCurrencyCents(unitPrice * quantity, order.currency),
          config,
        };
      })
    : [];

  return {
    orderId: order.id,
    orderShortId: `${order.id.slice(0, 8)}…`,
    createdAt: order.created_at,
    total: formatCurrencyCents(order.amount_cents, order.currency),
    totalValue: order.amount_cents,
    currency: order.currency,
    customerName: customerName || customerEmail || "Customer",
    customerEmail,
    customerPhone,
    captureMethod: order.capture_method,
    items,
    metadata,
    shippingAddressLines: formatAddress(shippingAddress),
    billingAddressLines: formatAddress(billingAddress),
    notes: metadata?.notes ?? null,
    stripePaymentIntentId: order.stripe_payment_intent_id,
  };
}

export function extractContactEmail(metadata: CheckoutDraftMetadata | null): string | null {
  if (!metadata?.contact) return null;
  const email = metadata.contact.email;
  if (typeof email !== "string") return null;
  const trimmed = email.trim();
  return trimmed.length ? trimmed : null;
}

function parseCartConfig(value: unknown): CartConfig | null {
  if (value == null) return null;
  if (typeof value === "string") {
    try {
      return parseCartConfig(JSON.parse(value));
    } catch {
      return null;
    }
  }
  if (typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const sizeRaw = typeof record.size === "string" ? record.size.toLowerCase() : "";
  const size = (["small", "large"] as Array<CartConfig["size"]>).includes(sizeRaw as CartConfig["size"])
    ? (sizeRaw as CartConfig["size"])
    : "regular";
  const strip3Enabled = Boolean(record.strip3Enabled);
  const boardData = parseBoardLayout(record.boardData);
  const extras = parseBoardExtras(record.extras);
  const config: CartConfig = {
    size,
    strip3Enabled,
    boardData,
    extras,
  };
  const edgeOption = typeof record.edgeOption === "string" ? record.edgeOption.trim() : "";
  if (edgeOption) config.edgeOption = edgeOption;
  const handleRaw = typeof record.handleStyle === "string" ? record.handleStyle.toLowerCase() : "";
  if (isHandleStyle(handleRaw)) {
    config.handleStyle = handleRaw;
  }
  if (Boolean(record.brassFeet)) config.brassFeet = true;
  return config;
}

type NormalizedHandleStyle = Exclude<CartConfig["handleStyle"], undefined>;

function isHandleStyle(value: unknown): value is NormalizedHandleStyle {
  return value === "none" || value === "glide" || value === "lift";
}

function parseBoardLayout(value: unknown): CartConfig["boardData"] {
  const base: CartConfig["boardData"] = { strips: [], order: [] };
  if (value == null) return base;
  if (typeof value === "string") {
    try {
      return parseBoardLayout(JSON.parse(value));
    } catch {
      return base;
    }
  }
  if (typeof value !== "object") return base;
  const record = value as Record<string, unknown>;
  const stripsRaw = record.strips;
  const strips = Array.isArray(stripsRaw)
    ? stripsRaw.map((row) => {
        if (!Array.isArray(row)) return [];
        return row.map((cell) => {
          if (typeof cell === "string") {
            const trimmed = cell.trim();
            return trimmed.length ? trimmed : null;
          }
          return null;
        });
      })
    : [];
  const orderRaw = record.order;
  const order = Array.isArray(orderRaw)
    ? orderRaw
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          const obj = entry as Record<string, unknown>;
          const stripNo = Number(obj.stripNo);
          const reflected = Boolean(obj.reflected);
          if (!Number.isFinite(stripNo)) return null;
          const normalized = Math.max(1, Math.round(stripNo));
          return { stripNo: normalized, reflected };
        })
        .filter(Boolean) as CartConfig["boardData"]["order"]
    : [];
  return { strips, order };
}

function parseBoardExtras(value: unknown): CartConfig["extras"] {
  const defaults: CartConfig["extras"] = {
    edgeProfile: "square",
    borderRadius: 0,
    chamferSize: 0,
    grooveEnabled: false,
  };
  if (value == null) return defaults;
  if (typeof value === "string") {
    try {
      return parseBoardExtras(JSON.parse(value));
    } catch {
      return defaults;
    }
  }
  if (typeof value !== "object") return defaults;
  const record = value as Record<string, unknown>;
  const edgeProfileRaw = typeof record.edgeProfile === "string" ? record.edgeProfile.toLowerCase() : "";
  const edgeProfile =
    edgeProfileRaw === "roundover" || edgeProfileRaw === "chamfer"
      ? (edgeProfileRaw as CartConfig["extras"]["edgeProfile"])
      : "square";
  const borderRadius = Number.isFinite(Number(record.borderRadius))
    ? Math.max(0, Math.round(Number(record.borderRadius)))
    : 0;
  const chamferSize = Number.isFinite(Number(record.chamferSize))
    ? Math.max(0, Math.round(Number(record.chamferSize)))
    : 0;
  const grooveEnabled = Boolean(record.grooveEnabled);
  return { edgeProfile, borderRadius, chamferSize, grooveEnabled };
}

function formatAddress(address: CheckoutAddress | null | undefined): string[] {
  if (!address) return [];
  const lines: string[] = [];
  const line1 = (address.line1 ?? "").trim();
  const line2 = (address.line2 ?? "").trim();
  const city = (address.city ?? "").trim();
  const state = (address.state ?? "").trim();
  const postalCode = (address.postalCode ?? "").trim();
  const country = (address.country ?? "").trim();

  if (line1) lines.push(line1);
  if (line2) lines.push(line2);

  const cityState = [city, state].filter(Boolean).join(", ");
  const cityLine = postalCode ? [cityState, postalCode].filter(Boolean).join(" ") : cityState;
  if (cityLine) lines.push(cityLine);
  if (country) lines.push(country);

  return lines;
}
