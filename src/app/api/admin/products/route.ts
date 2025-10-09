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
  const Body = z.object({
    name: z.string().min(1).max(200),
    slug: z.string().optional(),
    price_cents: z.number().int().nonnegative(),
    category: z.string().min(1),
    short_desc: z.string().nullable().optional(),
    long_desc: z.string().nullable().optional(),
    status: z.enum(["draft", "published", "archived"]).optional(),
    collection: z.string().min(1).optional(),
    tags: z.array(z.string().min(1)).optional(),
    card_label: z.string().max(60).nullable().optional(),
  });
  const jsonUnknown = await req.json().catch(() => undefined);
  const parsed = Body.safeParse(jsonUnknown);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body", issues: parsed.error.flatten() }, { status: 400 });
  const b = parsed.data;
  const name = b.name;
  const slug = slugify(b.slug || name);
  const price_cents = b.price_cents;
  const category = b.category;
  const short_desc = b.short_desc ?? null;
  const long_desc = b.long_desc ?? null;
  const status = b.status ?? "draft";
  const cardLabelInput = typeof b.card_label === "string" ? b.card_label.trim() : null;
  const card_label = cardLabelInput ? cardLabelInput : null;
  let tags: string[] | undefined = undefined;
  if (Array.isArray(b.tags)) tags = b.tags;
  if (b.collection) tags = Array.from(new Set([...(tags || []), b.collection]));

  if (!name || !slug || !category) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

  const { data: existing } = await adminSupabase.from("products").select("id").eq("slug", slug).maybeSingle();
  if (existing) return NextResponse.json({ error: "Slug already exists" }, { status: 409 });

  const { data, error } = await adminSupabase
    .from("products")
    .insert({ name, slug, price_cents, category, short_desc, long_desc, status, card_label, ...(tags ? { tags } : {}) })
    .select("id, slug")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data?.id, slug: data?.slug });
}
