import { supabase } from "@/lib/supabase/client";
import type {
  ProductSummary,
  ProductDetail,
  ProductCore,
  ProductImage,
  ProductVariant,
  ProductTemplateDetail,
  ProductCategory,
  ProductSort,
} from "@/types/product";
import type { BoardLayout, BoardRowOrder, BoardSize } from "@/types/board";

const BOARD_SIZES: ReadonlyArray<BoardSize> = ["small", "regular", "large"] as const;

function toBoardSize(value: unknown): BoardSize {
  if (typeof value === "string" && BOARD_SIZES.includes(value as BoardSize)) {
    return value as BoardSize;
  }
  return "regular";
}

function toBoardRowOrders(value: unknown): BoardRowOrder[] {
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

function toBoardStrips(value: unknown): BoardLayout["strips"] {
  if (!Array.isArray(value)) return [];
  return value.map((row) => {
    if (!Array.isArray(row)) return [];
    return row.map((cell) => (typeof cell === "string" ? cell : null));
  });
}

function normalizeProductSummary(row: Record<string, unknown>): ProductSummary | null {
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

function normalizeProductCore(row: Record<string, unknown>): ProductCore | null {
  const id = typeof row.id === "string" ? row.id : toString(row.id);
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

function normalizeVariant(row: Record<string, unknown>): ProductVariant | null {
  const id = typeof row.id === "string" ? row.id : toString(row.id);
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

function normalizeImage(row: Record<string, unknown>): ProductImage | null {
  const id = typeof row.id === "string" ? row.id : toString(row.id);
  const url = typeof row.url === "string" ? row.url : null;
  if (!id || !url) return null;
  const alt = typeof row.alt === "string" ? row.alt : null;
  const color = typeof row.color === "string" ? row.color : null;
  return { id, url, alt, color };
}

function normalizeTemplate(row: Record<string, unknown>): ProductTemplateDetail | null {
  const id = typeof row.id === "string" ? row.id : toString(row.id);
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

function toString(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

export async function fetchProductSummaries(options: {
  sort: ProductSort;
  page: number;
  pageSize: number;
  category: ProductCategory;
  collection: string;
}): Promise<{ items: ProductSummary[]; total: number | null }> {
  const { sort, page, pageSize, category, collection } = options;
  let query = supabase
    .from("products")
    .select("slug,name,price_cents,primary_image_url,status,deleted_at,category,tags,updated_at,card_label", { count: "exact" })
    .eq("status", "published")
    .is("deleted_at", null);

  if (category) {
    query = query.eq("category", category);
  }
  if (category === "boards" && collection) {
    query = query.contains("tags", [collection]);
  }

  if (sort === "newest") {
    query = query.order("updated_at", { ascending: false });
  } else if (sort === "price-asc") {
    query = query.order("price_cents", { ascending: true });
  } else if (sort === "price-desc") {
    query = query.order("price_cents", { ascending: false });
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  const rows = (data ?? []) as Array<Record<string, unknown>>;
  const items = rows
    .map((row) => normalizeProductSummary(row))
    .filter((row): row is ProductSummary => Boolean(row));

  return {
    items,
    total: typeof count === "number" ? count : null,
  };
}

export async function fetchBoardCollections(): Promise<string[]> {
  const { data: sectionsData, error: sectionsError } = await supabase
    .from("home_sections")
    .select("id")
    .eq("category", "boards");
  if (sectionsError) throw sectionsError;
  const sectionIds = ((sectionsData ?? []) as Array<Record<string, unknown>>) 
    .map((row) => toString(row.id))
    .filter((value): value is string => Boolean(value));
  if (sectionIds.length === 0) return [];

  const { data: collectionsData, error: collectionsError } = await supabase
    .from("home_section_collections")
    .select("section_id,label,position")
    .in("section_id", sectionIds)
    .order("position", { ascending: true });
  if (collectionsError) throw collectionsError;

  const labels = new Set<string>();
  for (const row of (collectionsData ?? []) as Array<Record<string, unknown>>) {
    const label = typeof row.label === "string" ? row.label.trim() : "";
    if (!label) continue;
    labels.add(label.toLowerCase());
  }
  return Array.from(labels);
}

export async function fetchProductDetail(slug: string): Promise<ProductDetail | null> {
  const { data: productRow, error: productError } = await supabase
    .from("products")
    .select(
      "id,slug,name,price_cents,category,status,primary_image_url,short_desc,long_desc,deleted_at,product_template_id,card_label"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .is("deleted_at", null)
    .maybeSingle();
  if (productError) throw productError;
  if (!productRow) return null;

  const productCore = normalizeProductCore(productRow as Record<string, unknown>);
  if (!productCore) return null;

  const templateId = toString((productRow as Record<string, unknown>).product_template_id);
  const [templateResult, imagesResult, variantsResult] = await Promise.all([
    templateId
      ? supabase
          .from("product_templates")
          .select('id,name,size,strip3_enabled,strips,"order"')
          .eq("id", templateId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("product_images")
      .select("id,url,alt,color")
      .eq("product_id", productCore.id)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("product_variants")
      .select("id,color,size,sku,price_cents_override,status")
      .eq("product_id", productCore.id)
      .eq("status", "published")
      .order("color", { ascending: true })
      .order("size", { ascending: true }),
  ]);

  if (templateResult.error) throw templateResult.error;
  if (imagesResult.error) throw imagesResult.error;
  if (variantsResult.error) throw variantsResult.error;

  const template = templateResult.data
    ? normalizeTemplate(templateResult.data as Record<string, unknown>)
    : null;

  const images = ((imagesResult.data as Array<Record<string, unknown>> | null) ?? [])
    .map((row) => normalizeImage(row))
    .filter((row): row is ProductImage => Boolean(row));

  const variants = ((variantsResult.data as Array<Record<string, unknown>> | null) ?? [])
    .map((row) => normalizeVariant(row))
    .filter((row): row is ProductVariant => Boolean(row));

  return {
    product: productCore,
    template,
    images,
    variants,
  };
}
