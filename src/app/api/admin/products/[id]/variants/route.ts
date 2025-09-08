import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/supabase/serverAdmin";
import { requireAdminBasicAuth } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

type VariantInput = {
  color: string;
  size: string;
  sku?: string | null;
  price_cents_override?: number | null;
  status?: "draft" | "published";
  image_url?: string | null;
};

function normColor(c: string) {
  return (c || "").trim();
}

function normSize(s: string) {
  return (s || "").trim().toUpperCase();
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const { id } = params;
  const { data, error } = await adminSupabase
    .from("product_variants")
    .select("id, color, size, sku, price_cents_override, status, image_url, updated_at")
    .eq("product_id", id)
    .order("color", { ascending: true })
    .order("size", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data || [] });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const { id } = params;
  const body = (await req.json().catch(() => ({}))) as any;
  const inputs: VariantInput[] = Array.isArray(body?.items)
    ? body.items
    : body?.item
    ? [body.item]
    : [];
  if (!inputs.length) return NextResponse.json({ error: "No variants provided" }, { status: 400 });

  const results: { created: number; updated: number; errors: Array<{ input: any; error: string }> } = {
    created: 0,
    updated: 0,
    errors: [],
  };

  for (const v of inputs) {
    const color = normColor(v.color);
    const size = normSize(v.size);
    if (!color || !size) {
      results.errors.push({ input: v, error: "Missing color or size" });
      continue;
    }
    const sku = v.sku ? String(v.sku) : null;
    const price = v.price_cents_override != null ? Math.max(0, Number(v.price_cents_override) | 0) : null;
    const status: "draft" | "published" = v.status === "published" ? "published" : "draft";
    const image_url = v.image_url ? String(v.image_url) : null;

    // Find existing by case-insensitive color + exact size
    const { data: existing, error: findErr } = await adminSupabase
      .from("product_variants")
      .select("id")
      .eq("product_id", id)
      .eq("size", size)
      .ilike("color", color)
      .maybeSingle();
    if (findErr) {
      results.errors.push({ input: v, error: findErr.message });
      continue;
    }

    if (existing?.id) {
      const { error: updErr } = await adminSupabase
        .from("product_variants")
        .update({ color, size, sku, price_cents_override: price, status, image_url })
        .eq("id", existing.id);
      if (updErr) results.errors.push({ input: v, error: updErr.message });
      else results.updated += 1;
    } else {
      const { error: insErr } = await adminSupabase
        .from("product_variants")
        .insert({ product_id: id, color, size, sku, price_cents_override: price, status, image_url });
      if (insErr) results.errors.push({ input: v, error: insErr.message });
      else results.created += 1;
    }
  }

  return NextResponse.json(results);
}

