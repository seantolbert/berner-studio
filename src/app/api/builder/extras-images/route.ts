import { NextResponse } from "next/server";
import { supabaseAnon } from "@/lib/supabase/serverAnon";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await supabaseAnon
    .from("builder_extras_images")
    .select("id,url,alt,is_primary,position,created_at")
    .order("is_primary", { ascending: false })
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ items: data ?? [] });
}
