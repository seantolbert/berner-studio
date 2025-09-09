import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminSupabase } from "@/lib/supabase/serverAdmin";
import { requireAdminBasicAuth } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const { id } = await ctx.params;
  const Body = z.object({
    url: z.string().url().nullable().optional(),
    alt: z.string().nullable().optional(),
    caption: z.string().nullable().optional(),
    position: z.number().int().nonnegative().optional(),
    published: z.boolean().optional(),
  });
  const jsonUnknown = await req.json().catch(() => undefined);
  const parsed = Body.safeParse(jsonUnknown);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body", issues: parsed.error.flatten() }, { status: 400 });
  const b = parsed.data;
  const updates: Record<string, unknown> = {};
  if (b.url !== undefined) updates.url = b.url;
  if (b.alt !== undefined) updates.alt = b.alt;
  if (b.caption !== undefined) updates.caption = b.caption;
  if (b.position !== undefined) updates.position = b.position;
  if (b.published !== undefined) updates.published = b.published;
  const { error } = await adminSupabase.from("gallery").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const { id } = await ctx.params;
  const { error } = await adminSupabase.from("gallery").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
