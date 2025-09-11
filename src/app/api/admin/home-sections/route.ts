import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminSupabase } from "@/lib/supabase/serverAdmin";
import { requireAdminBasicAuth } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase)
    return NextResponse.json({ error: "Admin not configured" }, { status: 500 });

  const { data: sections, error } = await adminSupabase
    .from("home_sections")
    .select("id, title, subtext, view_all_label, view_all_href, max_items, position, category")
    .order("position", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // fetch selections
  const ids = (sections || []).map((s) => s.id);
  let productsBySection: Record<string, { product_id: string; position: number }[]> = {};
  let collectionsBySection: Record<string, { id: string; label: string; href: string | null; position: number }[]> = {};
  if (ids.length) {
    const { data: selections, error: selErr } = await adminSupabase
      .from("home_section_products")
      .select("section_id, product_id, position")
      .in("section_id", ids)
      .order("position", { ascending: true });
    if (selErr)
      return NextResponse.json({ error: selErr.message }, { status: 500 });
    for (const row of selections || []) {
      const arr = productsBySection[row.section_id] || (productsBySection[row.section_id] = []);
      arr.push({ product_id: row.product_id, position: row.position });
    }

    const { data: colls, error: colErr } = await adminSupabase
      .from("home_section_collections")
      .select("id, section_id, label, href, position")
      .in("section_id", ids)
      .order("position", { ascending: true });
    if (colErr)
      return NextResponse.json({ error: colErr.message }, { status: 500 });
    for (const c of colls || []) {
      const arr = collectionsBySection[c.section_id] || (collectionsBySection[c.section_id] = []);
      arr.push({ id: c.id, label: c.label, href: c.href ?? null, position: c.position });
    }
  }

  const payload = (sections || []).map((s) => ({
    ...s,
    products: productsBySection[s.id] || [],
    collections: collectionsBySection[s.id] || [],
  }));
  return NextResponse.json({ items: payload });
}

export async function POST(req: NextRequest) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase)
    return NextResponse.json({ error: "Admin not configured" }, { status: 500 });

  const Body = z.object({
    title: z.string().min(1),
    subtext: z.string().nullable().optional(),
    view_all_label: z.string().nullable().optional(),
    view_all_href: z.string().nullable().optional(),
    max_items: z.number().int().min(3).max(12).optional(),
    category: z.enum(["bottle-openers", "apparel", "boards"]).nullable().optional(),
  });
  const parsed = Body.safeParse(await req.json().catch(() => undefined));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.flatten() }, { status: 400 });
  const b = parsed.data;

  // Determine next position
  const { data: last } = await adminSupabase
    .from("home_sections")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextPos = (last?.position ?? -1) + 1;

  const { data, error } = await adminSupabase
    .from("home_sections")
    .insert({
      title: b.title,
      subtext: b.subtext ?? null,
      view_all_label: b.view_all_label ?? null,
      view_all_href: b.view_all_href ?? null,
      max_items: b.max_items ?? 3,
      position: nextPos,
      category: b.category ?? null,
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data?.id });
}
