import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminSupabase } from "@/lib/supabase/serverAdmin";
import { requireAdminBasicAuth } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; cid: string }> }) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const { id: sectionId, cid } = await params;
  const Body = z.object({ label: z.string().min(1).optional(), href: z.string().nullable().optional() });
  const parsed = Body.safeParse(await req.json().catch(() => undefined));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.flatten() }, { status: 400 });
  const b = parsed.data;
  const { error } = await adminSupabase
    .from("home_section_collections")
    .update({
      ...(b.label !== undefined ? { label: b.label } : {}),
      ...(b.href !== undefined ? { href: b.href } : {}),
    })
    .eq("id", cid)
    .eq("section_id", sectionId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; cid: string }> }) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const { id: sectionId, cid } = await params;
  const { error } = await adminSupabase
    .from("home_section_collections")
    .delete()
    .eq("id", cid)
    .eq("section_id", sectionId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
