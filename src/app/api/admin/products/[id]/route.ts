import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const { id } = await ctx.params;
  const { data, error } = await adminSupabase
    .from("products")
    .select("id, slug, name, price_cents, category, status, short_desc, long_desc, primary_image_url, tags, updated_at, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ item: data });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const { id } = await ctx.params;
  const Body = z.object({
    name: z.string().max(200).optional(),
    price_cents: z.number().int().nonnegative().optional(),
    category: z.string().optional(),
    short_desc: z.string().nullable().optional(),
    long_desc: z.string().nullable().optional(),
    status: z.enum(["draft", "published", "archived"]).optional(),
    primary_image_url: z.string().url().nullable().optional(),
    tags: z.array(z.string()).optional(),
    slug: z.string().optional(),
  });
  const jsonUnknown = await req.json().catch(() => undefined);
  const parsed = Body.safeParse(jsonUnknown);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body", issues: parsed.error.flatten() }, { status: 400 });
  const b = parsed.data;
  const updates: Record<string, unknown> = {};
  if (b.name) updates.name = b.name;
  if (b.price_cents != null) updates.price_cents = b.price_cents;
  if (b.category) updates.category = b.category;
  if (b.short_desc !== undefined) updates.short_desc = b.short_desc;
  if (b.long_desc !== undefined) updates.long_desc = b.long_desc;
  if (b.status) updates.status = b.status;
  if (b.primary_image_url !== undefined) updates.primary_image_url = b.primary_image_url;
  if (b.tags) updates.tags = b.tags.map((t) => String(t));

  // Handle slug change and record previous slug
  if (b.slug) {
    const nextSlug = slugify(b.slug);
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

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const { id } = await ctx.params;
  // Soft delete: set deleted_at and archived status
  const { error } = await adminSupabase
    .from("products")
    .update({ deleted_at: new Date().toISOString(), status: "archived" })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
