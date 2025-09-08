import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/supabase/serverAdmin";
import { requireAdminBasicAuth } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string; imageId: string } }) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const { id, imageId } = params;
  const body = (await req.json().catch(() => ({}))) as any;
  const updates: any = {};
  if (body.alt !== undefined) updates.alt = body.alt ? String(body.alt) : null;
  if (body.position != null) updates.position = Number(body.position) | 0;
  if (body.is_primary != null) updates.is_primary = Boolean(body.is_primary);
  if (body.color !== undefined) updates.color = body.color ? String(body.color) : null;

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

export async function DELETE(req: NextRequest, { params }: { params: { id: string; imageId: string } }) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const { id, imageId } = params;
  // Delete image row. We do not delete the file from storage here (can be added later).
  const { error } = await adminSupabase.from("product_images").delete().eq("id", imageId).eq("product_id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
