import { supabase } from "@/lib/supabase/client";
import type {
  ProductSummary,
  ProductDetail,
  ProductCategory,
  ProductSort,
  ProductImage,
  ProductVariant,
} from "@/types/product";
import {
  ensureString,
  normalizeImage,
  normalizeProductCore,
  normalizeProductSummary,
  normalizeTemplate,
  normalizeVariant,
} from "@/services/productsShared";

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
    .map((row) => ensureString(row.id))
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

  const templateId = ensureString((productRow as Record<string, unknown>).product_template_id);
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
