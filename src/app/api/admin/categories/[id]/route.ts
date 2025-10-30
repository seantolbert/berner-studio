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

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const { id } = await ctx.params;

  const Body = z.object({
    name: z.string().min(1).max(100),
  });
  const jsonUnknown = await req.json().catch(() => undefined);
  const parsed = Body.safeParse(jsonUnknown);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { data: existing, error: existingError } = await adminSupabase
    .from("product_categories")
    .select("id, name, slug")
    .eq("id", id)
    .maybeSingle();
  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const name = parsed.data.name.trim();
  const nextSlug = slugify(name);
  if (!nextSlug) return NextResponse.json({ error: "Invalid slug" }, { status: 400 });

  if (nextSlug !== existing.slug) {
    const { data: slugConflict } = await adminSupabase
      .from("product_categories")
      .select("id")
      .eq("slug", nextSlug)
      .maybeSingle();
    if (slugConflict && slugConflict.id !== id) {
      return NextResponse.json({ error: "Another category already uses that name" }, { status: 409 });
    }
  }

  const { error: updateError } = await adminSupabase
    .from("product_categories")
    .update({ name, slug: nextSlug })
    .eq("id", id);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  if (existing.slug !== nextSlug) {
    const updates = await Promise.all([
      adminSupabase.from("products").update({ category: nextSlug }).eq("category", existing.slug),
      adminSupabase.from("home_sections").update({ category: nextSlug }).eq("category", existing.slug),
    ]);
    const failed = updates.find((result) => result.error);
    if (failed?.error) {
      return NextResponse.json(
        { error: `Category updated but failed to remap references: ${failed.error.message}` },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ ok: true, item: { id, name, slug: nextSlug } });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const { id } = await ctx.params;

  const { data: category, error: fetchError } = await adminSupabase
    .from("product_categories")
    .select("id, slug")
    .eq("id", id)
    .maybeSingle();
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [{ count: productCount, error: productError }, { count: sectionCount, error: sectionError }] =
    await Promise.all([
      adminSupabase
        .from("products")
        .select("id", { head: true, count: "exact" })
        .eq("category", category.slug),
      adminSupabase
        .from("home_sections")
        .select("id", { head: true, count: "exact" })
        .eq("category", category.slug),
    ]);

  if (productError) return NextResponse.json({ error: productError.message }, { status: 500 });
  if (sectionError) return NextResponse.json({ error: sectionError.message }, { status: 500 });

  if ((productCount ?? 0) > 0) {
    return NextResponse.json(
      { error: "Cannot delete a category while products are assigned to it.", count: productCount },
      { status: 409 }
    );
  }
  if ((sectionCount ?? 0) > 0) {
    return NextResponse.json(
      { error: "Cannot delete a category while home sections reference it.", count: sectionCount },
      { status: 409 }
    );
  }

  const { error: deleteError } = await adminSupabase.from("product_categories").delete().eq("id", id);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
