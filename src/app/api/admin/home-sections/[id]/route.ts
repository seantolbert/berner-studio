import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminSupabase } from "@/lib/supabase/serverAdmin";
import { requireAdminBasicAuth } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase)
    return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const { id } = await params;
  const Body = z.object({
    title: z.string().min(1).optional(),
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
  const { error } = await adminSupabase
    .from("home_sections")
    .update({
      ...(b.title !== undefined ? { title: b.title } : {}),
      ...(b.subtext !== undefined ? { subtext: b.subtext } : {}),
      ...(b.view_all_label !== undefined ? { view_all_label: b.view_all_label } : {}),
      ...(b.view_all_href !== undefined ? { view_all_href: b.view_all_href } : {}),
      ...(b.max_items !== undefined ? { max_items: b.max_items } : {}),
      ...(b.category !== undefined ? { category: b.category } : {}),
    })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase)
    return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const { id } = await params;
  const { error } = await adminSupabase.from("home_sections").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
