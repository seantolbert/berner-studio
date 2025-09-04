import { supabase } from "./client";

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

