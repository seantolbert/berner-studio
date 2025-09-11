import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminSupabase } from "@/lib/supabase/serverAdmin";
import { requireAdminBasicAuth } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const { data, error } = await adminSupabase
    .from("builder_woods")
    .select("key,name,price_per_stick,enabled,color")
    .order("name", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data || [] });
}

export async function POST(req: NextRequest) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const Body = z.object({
    key: z.string().min(1),
    name: z.string().min(1),
    price_per_stick: z.number().nonnegative().default(0),
    enabled: z.boolean().default(true),
    color: z.string().min(1).optional(),
  });
  const parsed = Body.safeParse(await req.json().catch(() => undefined));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.flatten() }, { status: 400 });
  const b = parsed.data;
  const { error } = await adminSupabase.from("builder_woods").insert({
    key: b.key,
    name: b.name,
    price_per_stick: b.price_per_stick,
    enabled: b.enabled,
    color: b.color ?? null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
