import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminSupabase } from "@/lib/supabase/serverAdmin";
import { requireAdminBasicAuth } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const { id } = await ctx.params;
  const { data, error } = await adminSupabase
    .from("product_seo")
    .select("seo_title, seo_description, canonical_url, og_image_url")
    .eq("product_id", id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data || null });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const { id } = await ctx.params;
  const Body = z.object({
    seo_title: z.string().nullable().optional(),
    seo_description: z.string().nullable().optional(),
    canonical_url: z.string().url().nullable().optional(),
    og_image_url: z.string().url().nullable().optional(),
  });
  const jsonUnknown = await req.json().catch(() => undefined);
  const parsed = Body.safeParse(jsonUnknown);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body", issues: parsed.error.flatten() }, { status: 400 });
  const b = parsed.data;
  const payload = {
    product_id: id,
    seo_title: b.seo_title ?? null,
    seo_description: b.seo_description ?? null,
    canonical_url: b.canonical_url ?? null,
    og_image_url: b.og_image_url ?? null,
  };
  // Upsert row
  const { error } = await adminSupabase
    .from("product_seo")
    .upsert(payload, { onConflict: "product_id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
