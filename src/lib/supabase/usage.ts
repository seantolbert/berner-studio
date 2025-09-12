import { supabase } from "./client";
import type { BoardTemplate } from "@/app/templates";

export type BoardData = {
  strips: (string | null)[][];
  order: { stripNo: number; reflected: boolean }[];
};

export async function saveBoard({
  userId,
  name,
  size,
  strip3Enabled,
  data,
}: {
  userId: string;
  name?: string;
  size: "small" | "regular" | "large";
  strip3Enabled: boolean;
  data: BoardData;
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
  const normalizeSize = (s: string): "small" | "regular" | "large" =>
    s === "small" || s === "regular" || s === "large" ? s : "regular";
  const { data, error } = await supabase
    .from("default_templates")
    .select('id, name, size, strip3_enabled, strips, "order"')
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((t: Record<string, unknown>) => ({
    id: String(t.id ?? ""),
    name: String(t.name ?? "Untitled"),
    size: normalizeSize(String(t.size ?? "regular")),
    strip3Enabled: Boolean((t as any).strip3_enabled),
    strips: (Array.isArray((t as any).strips) ? (t as any).strips : []) as string[][],
    order: (Array.isArray((t as any).order) ? (t as any).order : []) as { stripNo: number; reflected: boolean }[],
  }));
}

export async function saveDefaultTemplate(args: {
  name: string;
  size: "small" | "regular" | "large";
  strip3Enabled: boolean;
  strips: (string | null)[][];
  order: { stripNo: number; reflected: boolean }[];
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
  const normalizeSize = (s: string): "small" | "regular" | "large" =>
    s === "small" || s === "regular" || s === "large" ? s : "regular";
  return (data ?? []).map((b: Record<string, unknown>) => ({
    id: String(b.id ?? ""),
    name: (b.name as string) || "Untitled",
    size: normalizeSize(String(b.size ?? "regular")),
    strip3Enabled: Boolean((b as any).strip3_enabled),
    strips: (((b as any).data?.strips as string[][]) ?? []),
    order: (((b as any).data?.order as { stripNo: number; reflected: boolean }[]) ?? []),
  }));
}
