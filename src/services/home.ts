import { supabaseAnon } from "@/lib/supabase/serverAnon";
import type {
  HomeHero,
  HomeSection,
  HomeSectionCollection,
  HomeSectionProduct,
} from "@/types/home";

const DEFAULT_MAX_ITEMS = 3;

function toNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function toStringId(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function normalizeHero(row: Record<string, unknown> | null): HomeHero | null {
  if (!row) return null;
  return {
    title: toNullableString(row.title),
    subtitle: toNullableString(row.subtitle),
    image_url: toNullableString(row.image_url),
    primary_label: toNullableString(row.primary_label),
    primary_href: toNullableString(row.primary_href),
    secondary_label: toNullableString(row.secondary_label),
    secondary_href: toNullableString(row.secondary_href),
  };
}

function normalizeSection(row: Record<string, unknown>): HomeSection | null {
  const id = toStringId(row.id);
  if (!id) return null;
  const title = typeof row.title === "string" ? row.title : "";
  const subtext = toNullableString(row.subtext);
  const viewAllLabel = toNullableString(row.view_all_label);
  const viewAllHref = toNullableString(row.view_all_href);
  const maxItemsRaw = Number(row.max_items);
  const maxItems = Number.isFinite(maxItemsRaw) && maxItemsRaw > 0 ? Math.round(maxItemsRaw) : DEFAULT_MAX_ITEMS;
  const category = typeof row.category === "string" && row.category.trim().length > 0 ? row.category : null;
  return {
    id,
    title,
    subtext,
    view_all_label: viewAllLabel,
    view_all_href: viewAllHref,
    max_items: maxItems,
    category,
    collections: [],
    products: [],
  };
}

type SectionProductLink = {
  sectionId: string;
  productId: string;
};

function normalizeSectionProductLink(row: Record<string, unknown>): SectionProductLink | null {
  const sectionId = toStringId(row.section_id);
  const productId = toStringId(row.product_id);
  if (!sectionId || !productId) return null;
  return { sectionId, productId };
}

function normalizeSectionCollection(row: Record<string, unknown>): { sectionId: string; collection: HomeSectionCollection } | null {
  const sectionId = toStringId(row.section_id);
  if (!sectionId) return null;
  const label = typeof row.label === "string" && row.label.trim().length > 0 ? row.label : null;
  if (!label) return null;
  const href = typeof row.href === "string" && row.href.trim().length > 0 ? row.href : null;
  return { sectionId, collection: { label, href } };
}

function normalizeProduct(row: Record<string, unknown>): HomeSectionProduct | null {
  const slug = typeof row.slug === "string" ? row.slug : null;
  const name = typeof row.name === "string" ? row.name : null;
  if (!slug || !name) return null;
  const priceRaw = Number(row.price_cents);
  const price = Number.isFinite(priceRaw) ? Math.max(0, Math.round(priceRaw)) : 0;
  const image = typeof row.primary_image_url === "string" && row.primary_image_url.trim().length > 0 ? row.primary_image_url : null;
  const cardLabel =
    typeof row.card_label === "string" && row.card_label.trim().length > 0 ? row.card_label : null;
  const tagsRaw = Array.isArray(row.tags) ? row.tags : [];
  const tags = tagsRaw
    .map((value) => (typeof value === "string" ? value : null))
    .filter((value): value is string => Boolean(value));
  return { slug, name, price_cents: price, primary_image_url: image, card_label: cardLabel, tags };
}

export async function getHomeHero(): Promise<HomeHero | null> {
  try {
    const { data, error } = await supabaseAnon
      .from("home_hero")
      .select("title,subtitle,image_url,primary_label,primary_href,secondary_label,secondary_href")
      .maybeSingle();
    if (error) return null;
    return normalizeHero(data as Record<string, unknown> | null);
  } catch {
    return null;
  }
}

export async function getHomeSections(): Promise<HomeSection[]> {
  try {
    const { data, error } = await supabaseAnon
      .from("home_sections")
      .select("id,title,subtext,view_all_label,view_all_href,max_items,position,category")
      .order("position", { ascending: true });
    if (error) return [];
    const baseRows = (data ?? []) as Array<Record<string, unknown>>;
    const sections = baseRows
      .map((row) => normalizeSection(row))
      .filter((row): row is HomeSection => Boolean(row));
    if (sections.length === 0) return [];

    const sectionById = new Map(sections.map((section) => [section.id, section]));
    const sectionIds = sections.map((section) => section.id);

    const [{ data: linkData, error: linkError }, { data: collectionData, error: collectionError }] = await Promise.all([
      supabaseAnon
        .from("home_section_products")
        .select("section_id,product_id,position")
        .in("section_id", sectionIds)
        .order("position", { ascending: true }),
      supabaseAnon
        .from("home_section_collections")
        .select("section_id,label,href,position")
        .in("section_id", sectionIds)
        .order("position", { ascending: true }),
    ]);
    if (linkError || collectionError) return [];

    const productLinks = ((linkData as Array<Record<string, unknown>> | null) ?? [])
      .map((row) => normalizeSectionProductLink(row))
      .filter((row): row is SectionProductLink => Boolean(row));

    const collectionMap = new Map<string, HomeSectionCollection[]>();
    for (const entry of ((collectionData as Array<Record<string, unknown>> | null) ?? [])) {
      const normalized = normalizeSectionCollection(entry);
      if (!normalized) continue;
      const bucket = collectionMap.get(normalized.sectionId);
      if (bucket) bucket.push(normalized.collection);
      else collectionMap.set(normalized.sectionId, [normalized.collection]);
    }

    const productIds = Array.from(new Set(productLinks.map((link) => link.productId)));
    const productsById = new Map<string, HomeSectionProduct>();
    if (productIds.length > 0) {
      const { data: productsData, error: productsError } = await supabaseAnon
        .from("products")
        .select("id,slug,name,price_cents,primary_image_url,status,deleted_at,card_label,tags")
        .in("id", productIds)
        .eq("status", "published")
        .is("deleted_at", null);
      if (!productsError) {
        for (const row of (productsData as Array<Record<string, unknown>> | null) ?? []) {
          const normalized = normalizeProduct(row);
          const id = toStringId(row.id);
          if (normalized && id) {
            productsById.set(id, normalized);
          }
        }
      }
    }

    const productsBySection = new Map<string, HomeSectionProduct[]>();
    for (const link of productLinks) {
      const product = productsById.get(link.productId);
      if (!product) continue;
      const list = productsBySection.get(link.sectionId);
      if (list) list.push(product);
      else productsBySection.set(link.sectionId, [product]);
    }

    sections.forEach((section) => {
      section.collections = collectionMap.get(section.id) ?? [];
      section.products = productsBySection.get(section.id) ?? [];
    });

    const sectionsWithCategory = sections.filter((section) => section.category);
    if (sectionsWithCategory.length > 0) {
    const categoryResults = await Promise.all(
      sectionsWithCategory.map(async (section) => {
        const collectionCount = collectionMap.get(section.id)?.length ?? 0;
        const limit = Math.max(
          DEFAULT_MAX_ITEMS,
          section.max_items,
          collectionCount > 0 ? collectionCount * 6 : 0,
          24
        );
        const { data: productsData, error: productsError } = await supabaseAnon
          .from("products")
          .select("slug,name,price_cents,primary_image_url,status,deleted_at,category,card_label,tags")
          .eq("category", section.category!)
          .eq("status", "published")
          .is("deleted_at", null)
          .order("updated_at", { ascending: false })
          .limit(limit);
          if (productsError) return { sectionId: section.id, items: [] };
          const items = ((productsData as Array<Record<string, unknown>> | null) ?? [])
            .map((row) => normalizeProduct(row))
            .filter((row): row is HomeSectionProduct => Boolean(row));
          return { sectionId: section.id, items };
        })
      );
      for (const result of categoryResults) {
        const section = sectionById.get(result.sectionId);
        if (section) section.products = result.items;
      }
    }

    return sections;
  } catch {
    return [];
  }
}
