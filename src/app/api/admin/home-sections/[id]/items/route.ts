import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminSupabase } from "@/lib/supabase/serverAdmin";
import { requireAdminBasicAuth } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase)
    return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const { id: sectionId } = await params;
  const Body = z.object({ product_ids: z.array(z.string().uuid()).min(1) });
  const parsed = Body.safeParse(await req.json().catch(() => undefined));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.flatten() }, { status: 400 });
  const { product_ids } = parsed.data;

  // Replace existing selections atomically-ish
  const { error: delErr } = await adminSupabase
    .from("home_section_products")
    .delete()
    .eq("section_id", sectionId);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  const rows = product_ids.map((pid, idx) => ({ section_id: sectionId, product_id: pid, position: idx }));
  const { error: insErr } = await adminSupabase.from("home_section_products").insert(rows);
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
