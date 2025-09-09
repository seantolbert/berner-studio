import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/supabase/serverAdmin";
import { requireAdminBasicAuth } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const { searchParams } = new URL(req.url);
  const publishedParam = searchParams.get("published");
  let query = adminSupabase
    .from("gallery")
    .select("id, url, alt, caption, position, published, updated_at")
    .order("position", { ascending: true })
    .order("updated_at", { ascending: false });
  if (publishedParam != null) query = query.eq("published", publishedParam === "true");
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data || [] });
}

export async function POST(req: NextRequest) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const body = (await req.json().catch(() => ({}))) as any;
  const item = {
    url: String(body.url || ""),
    alt: body.alt ? String(body.alt) : null,
    caption: body.caption ? String(body.caption) : null,
    position: body.position != null ? Number(body.position) | 0 : 0,
    published: Boolean(body.published ?? true),
  };
  if (!item.url) return NextResponse.json({ error: "Missing url" }, { status: 400 });
  const { data, error } = await adminSupabase.from("gallery").insert(item).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data?.id });
}

