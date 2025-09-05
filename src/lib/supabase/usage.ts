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

export async function listBoards(userId: string) {
  const { data, error } = await supabase
    .from("boards")
    .select("id, name, size, strip3_enabled, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function listTemplates(): Promise<BoardTemplate[]> {
  const { data, error } = await supabase
    .from("templates")
    .select('id, name, size, strip3_enabled, strips, "order"')
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((t) => ({
    id: t.id as string,
    name: t.name as string,
    size: t.size as any,
    strip3Enabled: (t as any).strip3_enabled as boolean,
    strips: (t as any).strips as string[][],
    order: (t as any).order as { stripNo: number; reflected: boolean }[],
  }));
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
  return (data ?? []).map((b: any) => ({
    id: b.id as string,
    name: (b.name as string) || "Untitled",
    size: b.size as any,
    strip3Enabled: (b.strip3_enabled as boolean) ?? false,
    strips: (b.data?.strips as string[][]) ?? [],
    order: (b.data?.order as { stripNo: number; reflected: boolean }[]) ?? [],
  }));
}
