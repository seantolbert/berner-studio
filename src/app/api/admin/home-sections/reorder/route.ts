import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminSupabase } from "@/lib/supabase/serverAdmin";
import { requireAdminBasicAuth } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase)
    return NextResponse.json({ error: "Admin not configured" }, { status: 500 });

  const Body = z.object({ ids: z.array(z.string().uuid()).min(1) });
  const parsed = Body.safeParse(await req.json().catch(() => undefined));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.flatten() }, { status: 400 });
  const { ids } = parsed.data;

  // Batch update positions
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const { error } = await adminSupabase
      .from("home_sections")
      .update({ position: i })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

