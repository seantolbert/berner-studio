import { supabase } from "./client";
import type { BoardLayout, BoardRowOrder, BoardSize, BoardStrips, BoardTemplate, BuilderWood } from "@/types/board";

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
      const rawStrip = Number(raw.stripNo);
      const stripNo = Number.isFinite(rawStrip) ? Math.max(1, Math.round(rawStrip)) : 1;
      return {
        stripNo,
        reflected: Boolean(raw.reflected),
      } satisfies BoardRowOrder;
    })
    .filter(Boolean) as BoardRowOrder[];
}

function toBoardStrips(value: unknown): BoardStrips {
  if (!Array.isArray(value)) return [];
  return value.map((row) => {
    if (!Array.isArray(row)) return [];
    return row.map((cell) => (typeof cell === "string" ? cell : null));
  });
}

function ensureId(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function normalizeBoardTemplate(row: Record<string, unknown>): BoardTemplate | null {
  const id = ensureId(row.id);
  if (!id) return null;

  const scoped = row as {
    name?: unknown;
    strip3_enabled?: unknown;
    strips?: unknown;
    order?: unknown;
  };
  const nameRaw = typeof scoped.name === "string" ? scoped.name : null;
  const order = toBoardRowOrders(scoped.order);
  const strips = toBoardStrips(scoped.strips);
  return {
    id,
    name: nameRaw && nameRaw.trim().length > 0 ? nameRaw : "Untitled",
    size: toBoardSize(row.size),
    strip3Enabled: Boolean(scoped.strip3_enabled),
    strips,
    order,
  };
}

function normalizeBoardLayout(value: unknown): BoardLayout {
  if (!value || typeof value !== "object") {
    return { strips: [], order: [] };
  }
  const raw = value as { strips?: unknown; order?: unknown };
  return {
    strips: toBoardStrips(raw.strips),
    order: toBoardRowOrders(raw.order),
  } satisfies BoardLayout;
}

function normalizeBuilderWood(row: Record<string, unknown>): BuilderWood | null {
  const key = typeof row.key === "string" && row.key.trim().length > 0 ? row.key : null;
  if (!key) return null;
  const name = typeof row.name === "string" ? row.name : null;
  const color = typeof row.color === "string" ? row.color : "";
  const enabled = Boolean(row.enabled);
  const priceRaw = Number(row.price_per_stick);
  const price = Number.isFinite(priceRaw) ? priceRaw : null;
  return { key, name, color, enabled, price_per_stick: price };
}

export async function saveBoard({
  userId,
  name,
  size,
  strip3Enabled,
  data,
}: {
  userId: string;
  name?: string;
  size: BoardSize;
  strip3Enabled: boolean;
  data: BoardLayout;
}) {
  const { data: insertData, error } = await supabase
    .from("boards")
    .insert({
      user_id: userId,
      name: name ?? null,
      size,
      strip3_enabled: strip3Enabled,
      data,
    })
    .select()
    .single();
  if (error) throw error;
  return insertData;
}

// Removed unused listBoards; add back if user-specific listing is needed.
export async function listTemplates(): Promise<BoardTemplate[]> {
  const { data, error } = await supabase
    .from("default_templates")
    .select('id, name, size, strip3_enabled, strips, "order"')
    .order("created_at", { ascending: true });
  if (error) throw error;
  const rows = (data ?? []) as Array<Record<string, unknown>>;
  return rows
    .map((row) => normalizeBoardTemplate(row))
    .filter((row): row is BoardTemplate => Boolean(row));
}

export async function saveDefaultTemplate(args: {
  name: string;
  size: BoardSize;
  strip3Enabled: boolean;
  strips: BoardStrips;
  order: BoardRowOrder[];
}) {
  const payload = {
    name: args.name,
    size: args.size,
    strip3_enabled: args.strip3Enabled,
    strips: args.strips,
    order: args.order,
  };
  const { data, error } = await supabase
    .from("default_templates")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function saveProductTemplate(args: {
  name: string;
  size: BoardSize;
  strip3Enabled: boolean;
  strips: BoardStrips;
  order: BoardRowOrder[];
  productId?: string | null;
}) {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  const payload: {
    name: string;
    size: BoardSize;
    strip3_enabled: boolean;
    strips: BoardStrips;
    order: BoardRowOrder[];
    created_by?: string;
    product_id?: string | null;
  } = {
    name: args.name,
    size: args.size,
    strip3_enabled: args.strip3Enabled,
    strips: args.strips,
    order: args.order,
  };
  if (user?.id) payload.created_by = user.id;
  if (args.productId) payload.product_id = args.productId;
  const { data, error } = await supabase
    .from("product_templates")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listMyBoardTemplates(): Promise<BoardTemplate[]> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return [];
  const { data, error } = await supabase
    .from("boards")
    .select("id, name, size, strip3_enabled, data, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as Array<Record<string, unknown>>;
  return rows
    .map((row) => {
      const id = ensureId(row.id);
      if (!id) return null;
      const scoped = row as {
        name?: unknown;
        strip3_enabled?: unknown;
        data?: unknown;
      };
      const layout = normalizeBoardLayout(scoped.data);
      const nameVal = typeof scoped.name === "string" ? scoped.name : null;
      return {
        id,
        name: nameVal && nameVal.trim().length > 0 ? nameVal : "Untitled",
        size: toBoardSize(row.size),
        strip3Enabled: Boolean(scoped.strip3_enabled),
        strips: layout.strips,
        order: layout.order,
      } satisfies BoardTemplate;
    })
    .filter((row): row is BoardTemplate => Boolean(row));
}

export async function listEnabledBuilderWoods(): Promise<BuilderWood[]> {
  const { data, error } = await supabase
    .from("builder_woods")
    .select("key,name,color,enabled,price_per_stick")
    .eq("enabled", true)
    .order("name", { ascending: true });
  if (error) throw error;
  return ((data as Array<Record<string, unknown>> | null) ?? [])
    .map((row) => normalizeBuilderWood(row))
    .filter((row): row is BuilderWood => Boolean(row));
}
