import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminSupabase } from "@/lib/supabase/serverAdmin";
import { requireAdminBasicAuth } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const { id } = await ctx.params;
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

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const { id } = await ctx.params;
  const Body = z.object({
    url: z.string().url(),
    alt: z.string().nullable().optional(),
    is_primary: z.boolean().optional(),
    position: z.number().int().nonnegative().optional(),
    color: z.string().nullable().optional(),
  });
  const jsonUnknown = await req.json().catch(() => undefined);
  const parsed = Body.safeParse(jsonUnknown);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body", issues: parsed.error.flatten() }, { status: 400 });
  const b = parsed.data;
  const url = b.url;
  const alt = b.alt ?? null;
  const is_primary = b.is_primary ?? false;
  const color = b.color ?? null;
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  // Insert image
  const { data: inserted, error } = await adminSupabase
    .from("product_images")
    .insert({ product_id: id, url, alt, is_primary, position: b.position ?? 0, color })
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
