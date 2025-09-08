import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/supabase/serverAdmin";
import { requireAdminBasicAuth } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const { id } = params;
  const { searchParams } = new URL(req.url);
  const color = (searchParams.get('color') || '').trim();
  let query = adminSupabase
    .from("product_images")
    .select("id, url, alt, is_primary, position, created_at, color")
    .eq("product_id", id)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (color) {
    query = query.ilike('color', color);
  }
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data || [] });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const { id } = params;
  const body = (await req.json().catch(() => ({}))) as any;
  const url = String(body.url || "");
  const alt = body.alt ? String(body.alt) : null;
  const is_primary = Boolean(body.is_primary);
  const color = body.color ? String(body.color) : null;
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  // Insert image
  const { data: inserted, error } = await adminSupabase
    .from("product_images")
    .insert({ product_id: id, url, alt, is_primary, position: Number(body.position || 0) | 0, color })
    .select("id, url, alt, is_primary, position, color")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If marked primary, update others and product primary_image_url
  if (is_primary) {
    await adminSupabase.from("product_images").update({ is_primary: false }).eq("product_id", id);
    await adminSupabase.from("product_images").update({ is_primary: true }).eq("id", inserted.id);
    await adminSupabase.from("products").update({ primary_image_url: url }).eq("id", id);
  }

  return NextResponse.json({ item: inserted });
}
