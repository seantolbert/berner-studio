import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/supabase/serverAdmin";
import { requireAdminBasicAuth } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

function slugify(input: string) {
  return (input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const id = params.id;
  const { data, error } = await adminSupabase
    .from("products")
    .select("id, slug, name, price_cents, category, status, short_desc, long_desc, primary_image_url, tags, updated_at, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ item: data });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const id = params.id;
  const body = (await req.json().catch(() => ({}))) as any;
  const updates: any = {};
  if (body.name) updates.name = String(body.name).slice(0, 200);
  if (body.price_cents != null) updates.price_cents = Math.max(0, Number(body.price_cents) | 0);
  if (body.category) updates.category = String(body.category);
  if (body.short_desc !== undefined) updates.short_desc = body.short_desc ? String(body.short_desc) : null;
  if (body.long_desc !== undefined) updates.long_desc = body.long_desc ? String(body.long_desc) : null;
  if (body.status) updates.status = ["draft", "published", "archived"].includes(body.status) ? body.status : "draft";
  if (body.primary_image_url !== undefined) updates.primary_image_url = body.primary_image_url ? String(body.primary_image_url) : null;
  if (Array.isArray(body.tags)) updates.tags = body.tags.map((t: any) => String(t));

  // Handle slug change and record previous slug
  if (body.slug) {
    const nextSlug = slugify(body.slug);
    const { data: prod } = await adminSupabase.from("products").select("slug").eq("id", id).maybeSingle();
    if (prod && prod.slug !== nextSlug) {
      const { data: existing } = await adminSupabase.from("products").select("id").eq("slug", nextSlug).maybeSingle();
      if (existing) return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
      updates.slug = nextSlug;
      // Keep previous slug for redirects
      if (prod.slug) {
        await adminSupabase.from("product_slugs").insert({ product_id: id, slug: prod.slug });
      }
    }
  }

  const { error } = await adminSupabase.from("products").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const id = params.id;
  // Soft delete: set deleted_at and archived status
  const { error } = await adminSupabase
    .from("products")
    .update({ deleted_at: new Date().toISOString(), status: "archived" })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

