import type { AdminHomeSection } from "@/types/home";

function toStringId(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function toNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function normalizeCollection(row: Record<string, unknown>): { id: string; label: string; href: string } | null {
  const id = toStringId(row.id);
  if (!id) return null;
  const label = typeof row.label === "string" ? row.label : "";
  const href = typeof row.href === "string" ? row.href : "";
  return { id, label, href };
}

function normalizeSection(row: Record<string, unknown>): AdminHomeSection | null {
  const id = toStringId(row.id);
  if (!id) return null;
  const title = typeof row.title === "string" ? row.title : "";
  const subtext = toNullableString(row.subtext);
  const viewAllLabel = toNullableString(row.view_all_label);
  const viewAllHref = toNullableString(row.view_all_href);
  const maxItemsRaw = Number(row.max_items);
  const maxItems = Number.isFinite(maxItemsRaw) && maxItemsRaw > 0 ? Math.round(maxItemsRaw) : 3;
  const positionRaw = Number(row.position);
  const position = Number.isFinite(positionRaw) ? Math.round(positionRaw) : 0;
  const category = typeof row.category === "string" && row.category.trim().length > 0 ? row.category : null;
  const base: AdminHomeSection = {
    id,
    title,
    subtext,
    view_all_label: viewAllLabel,
    view_all_href: viewAllHref,
    max_items: maxItems,
    position,
    category,
    collections: [],
  };
  if (Array.isArray((row as { collections?: unknown }).collections)) {
    const rawCollections = ((row as { collections?: unknown }).collections as Array<Record<string, unknown>>) || [];
    base.collections = rawCollections
      .map((entry) => normalizeCollection(entry))
      .filter((entry): entry is { id: string; label: string; href: string } => Boolean(entry));
  };
  return base;
}

export function parseAdminHomeSections(payload: unknown): AdminHomeSection[] {
  const rows = Array.isArray(payload)
    ? payload
    : payload && typeof payload === "object"
      ? Array.isArray((payload as { items?: unknown }).items)
        ? ((payload as { items?: unknown }).items as unknown[])
        : []
      : [];
  return rows
    .map((row) => (row && typeof row === "object" ? normalizeSection(row as Record<string, unknown>) : null))
    .filter((row): row is AdminHomeSection => Boolean(row));
}
