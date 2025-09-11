import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminSupabase } from "@/lib/supabase/serverAdmin";
import { requireAdminBasicAuth } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase)
    return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const sectionId = params.id;
  const { data, error } = await adminSupabase
    .from("home_section_collections")
    .select("id,label,href,position")
    .eq("section_id", sectionId)
    .order("position", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data || [] });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase)
    return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const sectionId = params.id;
  const Body = z.object({ label: z.string().min(1), href: z.string().nullable().optional() });
  const parsed = Body.safeParse(await req.json().catch(() => undefined));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.flatten() }, { status: 400 });
  const b = parsed.data;
  // Determine next position
  const { data: last } = await adminSupabase
    .from("home_section_collections")
    .select("position")
    .eq("section_id", sectionId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextPos = (last?.position ?? -1) + 1;
  const { data, error } = await adminSupabase
    .from("home_section_collections")
    .insert({ section_id: sectionId, label: b.label, href: b.href ?? null, position: nextPos })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data?.id });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase)
    return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const sectionId = params.id;
  const Body = z.object({ ids: z.array(z.string().uuid()).min(1) });
  const parsed = Body.safeParse(await req.json().catch(() => undefined));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.flatten() }, { status: 400 });
  const { ids } = parsed.data;
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const { error } = await adminSupabase
      .from("home_section_collections")
      .update({ position: i })
      .eq("id", id)
      .eq("section_id", sectionId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

