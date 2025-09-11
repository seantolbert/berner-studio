import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminSupabase } from "@/lib/supabase/serverAdmin";
import { requireAdminBasicAuth } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const Body = z.object({
    name: z.string().min(1).optional(),
    price_per_stick: z.number().nonnegative().optional(),
    enabled: z.boolean().optional(),
    color: z.string().min(1).optional(),
  });
  const parsed = Body.safeParse(await req.json().catch(() => undefined));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.flatten() }, { status: 400 });
  const b = parsed.data;
  const { key } = await params;
  const { error } = await adminSupabase
    .from("builder_woods")
    .update({
      ...(b.name !== undefined ? { name: b.name } : {}),
      ...(b.price_per_stick !== undefined ? { price_per_stick: b.price_per_stick } : {}),
      ...(b.enabled !== undefined ? { enabled: b.enabled } : {}),
      ...(b.color !== undefined ? { color: b.color } : {}),
    })
    .eq("key", key);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const { key } = await params;
  const { error } = await adminSupabase.from("builder_woods").delete().eq("key", key);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
