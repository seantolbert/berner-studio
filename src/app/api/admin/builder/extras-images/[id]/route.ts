import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminBasicAuth } from "@/lib/adminAuth";
import { adminSupabase } from "@/lib/supabase/serverAdmin";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const { id } = await ctx.params;
  const Body = z.object({
    url: z.string().url().optional(),
    alt: z.string().nullable().optional(),
    is_primary: z.boolean().optional(),
    position: z.number().int().optional(),
  });
  const parsed = Body.safeParse(await req.json().catch(() => undefined));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body", issues: parsed.error.flatten() }, { status: 400 });
  const updates: Record<string, unknown> = {};
  if (parsed.data.url !== undefined) updates.url = parsed.data.url;
  if (parsed.data.alt !== undefined) updates.alt = parsed.data.alt;
  if (parsed.data.position !== undefined) updates.position = parsed.data.position;
  if (parsed.data.is_primary !== undefined) updates.is_primary = parsed.data.is_primary;
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: "No updates specified" }, { status: 400 });

  const { data, error } = await adminSupabase
    .from("builder_extras_images")
    .update(updates)
    .eq("id", id)
    .select("id,url,alt,is_primary,position")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (parsed.data.is_primary) {
    await adminSupabase.from("builder_extras_images").update({ is_primary: false }).neq("id", id);
    await adminSupabase.from("builder_extras_images").update({ is_primary: true }).eq("id", id);
  }

  return NextResponse.json({ item: data });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const { id } = await ctx.params;

  const { data: existing } = await adminSupabase
    .from("builder_extras_images")
    .select("is_primary")
    .eq("id", id)
    .maybeSingle();

  const { error } = await adminSupabase.from("builder_extras_images").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (existing?.is_primary) {
    const { data: nextPrimary } = await adminSupabase
      .from("builder_extras_images")
      .select("id")
      .order("position", { ascending: true })
      .order("created_at", { ascending: true })
      .maybeSingle();
    if (nextPrimary?.id) {
      await adminSupabase.from("builder_extras_images").update({ is_primary: true }).eq("id", nextPrimary.id);
    }
  }

  return NextResponse.json({ ok: true });
}
