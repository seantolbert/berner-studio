import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminSupabase } from "@/lib/supabase/serverAdmin";
import { requireAdminBasicAuth } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

function normColor(c: string) { return (c || "").trim(); }
function normSize(s: string) { return (s || "").trim().toUpperCase(); }

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string; variantId: string }> }) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const { id, variantId } = await ctx.params;
  const Body = z.object({
    color: z.string().optional(),
    size: z.string().optional(),
    sku: z.string().nullable().optional(),
    price_cents_override: z.number().int().nonnegative().nullable().optional(),
    status: z.enum(["draft", "published"]).optional(),
    image_url: z.string().url().nullable().optional(),
  });
  const jsonUnknown = await req.json().catch(() => undefined);
  const parsed = Body.safeParse(jsonUnknown);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body", issues: parsed.error.flatten() }, { status: 400 });
  const b = parsed.data;
  const updates: Record<string, unknown> = {};
  if (b.color != null) updates.color = normColor(b.color);
  if (b.size != null) updates.size = normSize(b.size);
  if (b.sku !== undefined) updates.sku = b.sku ?? null;
  if (b.price_cents_override !== undefined) updates.price_cents_override = b.price_cents_override ?? null;
  if (b.status) updates.status = b.status;
  if (b.image_url !== undefined) updates.image_url = b.image_url ?? null;

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

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string; variantId: string }> }) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const { id, variantId } = await ctx.params;
  const { error } = await adminSupabase
    .from("product_variants")
    .delete()
    .eq("id", variantId)
    .eq("product_id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
