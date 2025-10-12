import type {
  ProductSummary,
  ProductDetail,
  ProductCore,
  ProductImage,
  ProductVariant,
  ProductTemplateDetail,
} from "@/types/product";
import type { BoardLayout, BoardRowOrder, BoardSize } from "@/types/board";

export const BOARD_SIZES: ReadonlyArray<BoardSize> = ["small", "regular", "large"] as const;

export function ensureString(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

export function toBoardSize(value: unknown): BoardSize {
  if (typeof value === "string" && BOARD_SIZES.includes(value as BoardSize)) {
    return value as BoardSize;
  }
  return "regular";
}

export function toBoardRowOrders(value: unknown): BoardRowOrder[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const raw = entry as { stripNo?: unknown; reflected?: unknown };
      const stripNoRaw = Number(raw.stripNo);
      const stripNo = Number.isFinite(stripNoRaw) ? Math.max(1, Math.round(stripNoRaw)) : 1;
      return {
        stripNo,
        reflected: Boolean(raw.reflected),
      } satisfies BoardRowOrder;
    })
    .filter((entry): entry is BoardRowOrder => Boolean(entry));
}

export function toBoardStrips(value: unknown): BoardLayout["strips"] {
  if (!Array.isArray(value)) return [];
  return value.map((row) => {
    if (!Array.isArray(row)) return [];
    return row.map((cell) => (typeof cell === "string" ? cell : null));
  });
}

export function normalizeProductSummary(row: Record<string, unknown>): ProductSummary | null {
  const slug = typeof row.slug === "string" ? row.slug : null;
  const name = typeof row.name === "string" ? row.name : null;
  if (!slug || !name) return null;
  const priceRaw = Number(row.price_cents);
  const price = Number.isFinite(priceRaw) ? Math.max(0, Math.round(priceRaw)) : 0;
  const image = typeof row.primary_image_url === "string" ? row.primary_image_url : null;
  const cardLabel =
    typeof row.card_label === "string" && row.card_label.trim().length > 0 ? row.card_label : null;
  return { slug, name, price_cents: price, primary_image_url: image, card_label: cardLabel };
}

export function normalizeProductCore(row: Record<string, unknown>): ProductCore | null {
  const id = ensureString(row.id);
  const slug = typeof row.slug === "string" ? row.slug : null;
  const name = typeof row.name === "string" ? row.name : null;
  if (!id || !slug || !name) return null;
  const priceRaw = Number(row.price_cents);
  const price = Number.isFinite(priceRaw) ? Math.max(0, Math.round(priceRaw)) : 0;
  const category = typeof row.category === "string" ? row.category : null;
  const status = typeof row.status === "string" ? row.status : "draft";
  const primaryImage = typeof row.primary_image_url === "string" ? row.primary_image_url : null;
  const shortDesc = typeof row.short_desc === "string" ? row.short_desc : null;
  const longDesc = typeof row.long_desc === "string" ? row.long_desc : null;
  const cardLabel =
    typeof row.card_label === "string" && row.card_label.trim().length > 0 ? row.card_label : null;
  return {
    id,
    slug,
    name,
    price_cents: price,
    category,
    status,
    primary_image_url: primaryImage,
    short_desc: shortDesc,
    long_desc: longDesc,
    card_label: cardLabel,
  };
}

export function normalizeVariant(row: Record<string, unknown>): ProductVariant | null {
  const id = ensureString(row.id);
  if (!id) return null;
  const color = typeof row.color === "string" ? row.color : null;
  const size = typeof row.size === "string" ? row.size : null;
  const sku = typeof row.sku === "string" ? row.sku : null;
  const priceOverrideRaw = Number(row.price_cents_override);
  const priceOverride = Number.isFinite(priceOverrideRaw) ? Math.round(priceOverrideRaw) : null;
  const statusVal = typeof row.status === "string" ? row.status : "draft";
  const status = statusVal === "published" ? "published" : "draft";
  return { id, color, size, sku, price_cents_override: priceOverride, status };
}

export function normalizeImage(row: Record<string, unknown>): ProductImage | null {
  const id = ensureString(row.id);
  const url = typeof row.url === "string" ? row.url : null;
  if (!id || !url) return null;
  const alt = typeof row.alt === "string" ? row.alt : null;
  const color = typeof row.color === "string" ? row.color : null;
  return { id, url, alt, color };
}

export function normalizeTemplate(row: Record<string, unknown>): ProductTemplateDetail | null {
  const id = ensureString(row.id);
  if (!id) return null;
  const name = typeof row.name === "string" ? row.name : "Template";
  const size = toBoardSize(row.size);
  const strips = toBoardStrips((row as { strips?: unknown }).strips);
  const order = toBoardRowOrders((row as { order?: unknown }).order);
  return {
    id,
    name,
    size,
    strip3Enabled: Boolean(row.strip3_enabled),
    layout: { strips, order },
  };
}

export function shapeProductDetail({
  product,
  template,
  images,
  variants,
}: {
  product: ProductCore | null;
  template: ProductTemplateDetail | null;
  images: ProductImage[];
  variants: ProductVariant[];
}): ProductDetail | null {
  if (!product) return null;
  return {
    product,
    template,
    images,
    variants,
  };
}
