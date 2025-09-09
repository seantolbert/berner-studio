import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/supabase/serverAdmin";
import { requireAdminBasicAuth } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const { id } = params;
  const body = (await req.json().catch(() => ({}))) as any;
  const updates: any = {};
  if (body.url !== undefined) updates.url = body.url ? String(body.url) : null;
  if (body.alt !== undefined) updates.alt = body.alt ? String(body.alt) : null;
  if (body.caption !== undefined) updates.caption = body.caption ? String(body.caption) : null;
  if (body.position !== undefined) updates.position = Number(body.position) | 0;
  if (body.published !== undefined) updates.published = Boolean(body.published);
  const { error } = await adminSupabase.from("gallery").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const { id } = params;
  const { error } = await adminSupabase.from("gallery").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

