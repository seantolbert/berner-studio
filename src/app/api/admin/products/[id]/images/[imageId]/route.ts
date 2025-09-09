import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminSupabase } from "@/lib/supabase/serverAdmin";
import { requireAdminBasicAuth } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string; imageId: string }> }) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const { id, imageId } = await ctx.params;
  const Body = z.object({
    alt: z.string().nullable().optional(),
    position: z.number().int().nonnegative().optional(),
    is_primary: z.boolean().optional(),
    color: z.string().nullable().optional(),
  });
  const jsonUnknown = await req.json().catch(() => undefined);
  const parsed = Body.safeParse(jsonUnknown);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body", issues: parsed.error.flatten() }, { status: 400 });
  const b = parsed.data;
  const updates: Record<string, unknown> = {};
  if (b.alt !== undefined) updates.alt = b.alt;
  if (b.position !== undefined) updates.position = b.position;
  if (b.is_primary !== undefined) updates.is_primary = b.is_primary;
  if (b.color !== undefined) updates.color = b.color;

  const { data: img, error: getErr } = await adminSupabase
    .from("product_images")
    .select("id, url")
    .eq("id", imageId)
    .eq("product_id", id)
    .maybeSingle();
  if (getErr) return NextResponse.json({ error: getErr.message }, { status: 500 });
  if (!img) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { error } = await adminSupabase.from("product_images").update(updates).eq("id", imageId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (updates.is_primary === true) {
    await adminSupabase.from("product_images").update({ is_primary: false }).eq("product_id", id);
    await adminSupabase.from("product_images").update({ is_primary: true }).eq("id", imageId);
    await adminSupabase.from("products").update({ primary_image_url: img.url }).eq("id", id);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string; imageId: string }> }) {
  const auth = requireAdminBasicAuth(_req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const { id, imageId } = await ctx.params;
  // Delete image row. We do not delete the file from storage here (can be added later).
  const { error } = await adminSupabase.from("product_images").delete().eq("id", imageId).eq("product_id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
