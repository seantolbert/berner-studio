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

  const { data, error } = await adminSupabase
    .from("product_categories")
    .select("id, name, slug")
    .order("name", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });

  const Body = z.object({
    name: z.string().min(1).max(100),
    slug: z.string().optional(),
  });
  const jsonUnknown = await req.json().catch(() => undefined);
  const parsed = Body.safeParse(jsonUnknown);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.flatten() }, { status: 400 });
  }

  const name = parsed.data.name.trim();
  const slug = slugify(parsed.data.slug || name);
  if (!slug) return NextResponse.json({ error: "Invalid slug" }, { status: 400 });

  const { data: existingBySlug } = await adminSupabase
    .from("product_categories")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (existingBySlug) return NextResponse.json({ error: "Category slug already exists" }, { status: 409 });

  const { data, error } = await adminSupabase
    .from("product_categories")
    .insert({ name, slug })
    .select("id, name, slug")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ item: data });
}
