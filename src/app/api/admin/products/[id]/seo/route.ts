import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/supabase/serverAdmin";
import { requireAdminBasicAuth } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const { id } = params;
  const { data, error } = await adminSupabase
    .from("product_seo")
    .select("seo_title, seo_description, canonical_url, og_image_url")
    .eq("product_id", id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data || null });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const { id } = params;
  const body = (await req.json().catch(() => ({}))) as any;
  const payload: any = {
    product_id: id,
    seo_title: body.seo_title ?? null,
    seo_description: body.seo_description ?? null,
    canonical_url: body.canonical_url ?? null,
    og_image_url: body.og_image_url ?? null,
  };
  // Upsert row
  const { error } = await adminSupabase
    .from("product_seo")
    .upsert(payload, { onConflict: "product_id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

