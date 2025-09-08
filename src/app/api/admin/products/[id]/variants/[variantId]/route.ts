import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/supabase/serverAdmin";
import { requireAdminBasicAuth } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

function normColor(c: string) { return (c || "").trim(); }
function normSize(s: string) { return (s || "").trim().toUpperCase(); }

export async function PATCH(req: NextRequest, { params }: { params: { id: string; variantId: string } }) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const { id, variantId } = params;
  const body = (await req.json().catch(() => ({}))) as any;
  const updates: any = {};
  if (body.color != null) updates.color = normColor(String(body.color));
  if (body.size != null) updates.size = normSize(String(body.size));
  if (body.sku !== undefined) updates.sku = body.sku ? String(body.sku) : null;
  if (body.price_cents_override !== undefined) updates.price_cents_override = body.price_cents_override != null ? Math.max(0, Number(body.price_cents_override) | 0) : null;
  if (body.status) updates.status = body.status === "published" ? "published" : "draft";
  if (body.image_url !== undefined) updates.image_url = body.image_url ? String(body.image_url) : null;

  // If color/size change, ensure no conflict
  if ((updates.color || updates.size)) {
    const nextColor = updates.color || undefined;
    const nextSize = updates.size || undefined;
    if (nextColor || nextSize) {
      // Fetch current to get full pair
      const { data: current, error: curErr } = await adminSupabase
        .from("product_variants")
        .select("color,size")
        .eq("id", variantId)
        .maybeSingle();
      if (curErr) return NextResponse.json({ error: curErr.message }, { status: 500 });
      const c = normColor(nextColor || current?.color || "");
      const s = normSize(nextSize || current?.size || "");
      if (!c || !s) return NextResponse.json({ error: "Invalid color/size" }, { status: 400 });
      const { data: dup } = await adminSupabase
        .from("product_variants")
        .select("id")
        .eq("product_id", id)
        .eq("size", s)
        .ilike("color", c)
        .neq("id", variantId)
        .maybeSingle();
      if (dup) return NextResponse.json({ error: "Variant with this color/size exists" }, { status: 409 });
      updates.color = c; updates.size = s;
    }
  }

  const { error } = await adminSupabase
    .from("product_variants")
    .update(updates)
    .eq("id", variantId)
    .eq("product_id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string; variantId: string } }) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const { id, variantId } = params;
  const { error } = await adminSupabase
    .from("product_variants")
    .delete()
    .eq("id", variantId)
    .eq("product_id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

