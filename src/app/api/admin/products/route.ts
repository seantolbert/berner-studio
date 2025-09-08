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

export async function GET(req: NextRequest) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const status = searchParams.get("status") || undefined;
  let query = adminSupabase.from("products").select("id, slug, name, price_cents, category, status, updated_at").order("updated_at", { ascending: false });
  if (status) query = query.eq("status", status);
  if (q) query = query.ilike("name", `%${q}%`);
  const { data, error } = await query.limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data || [] });
}

export async function POST(req: NextRequest) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const body = (await req.json().catch(() => ({}))) as any;
  const name = String(body.name || "").slice(0, 200);
  const slug = slugify(body.slug || name);
  const price_cents = Math.max(0, Number(body.price_cents || 0)) | 0;
  const category = body.category as string;
  const short_desc = body.short_desc ? String(body.short_desc) : null;
  const long_desc = body.long_desc ? String(body.long_desc) : null;
  const status = body.status === "published" ? "published" : body.status === "archived" ? "archived" : "draft";

  if (!name || !slug || !category) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

  const { data: existing } = await adminSupabase.from("products").select("id").eq("slug", slug).maybeSingle();
  if (existing) return NextResponse.json({ error: "Slug already exists" }, { status: 409 });

  const { data, error } = await adminSupabase
    .from("products")
    .insert({ name, slug, price_cents, category, short_desc, long_desc, status })
    .select("id, slug")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data?.id, slug: data?.slug });
}

