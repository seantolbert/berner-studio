import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminBasicAuth } from "@/lib/adminAuth";
import { adminSupabase } from "@/lib/supabase/serverAdmin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) {
    return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  }
  const { data, error } = await adminSupabase
    .from("builder_extras_images")
    .select("id,url,alt,is_primary,position,created_at")
    .order("is_primary", { ascending: false })
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) {
    return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  }
  const Body = z.object({
    url: z.string().url(),
    alt: z.string().nullable().optional(),
    is_primary: z.boolean().optional(),
    position: z.number().int().optional(),
  });
  const jsonUnknown = await req.json().catch(() => undefined);
  const parsed = Body.safeParse(jsonUnknown);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body", issues: parsed.error.flatten() }, { status: 400 });
  const { url, alt, is_primary = false, position } = parsed.data;

  const { data, error } = await adminSupabase
    .from("builder_extras_images")
    .insert({ url, alt: alt ?? null, is_primary, position: typeof position === 'number' ? position : 0 })
    .select("id,url,alt,is_primary,position")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (is_primary && data?.id) {
    await adminSupabase.from("builder_extras_images").update({ is_primary: false }).neq("id", data.id);
    await adminSupabase.from("builder_extras_images").update({ is_primary: true }).eq("id", data.id);
  }

  return NextResponse.json({ item: data });
}
