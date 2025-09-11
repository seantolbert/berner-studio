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
    .from("builder_pricing")
    .select("currency,cell_price,base_small,base_regular,base_large,extra_third_strip,extra_juice_groove,extra_brass_feet")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data || null });
}

export async function PATCH(req: NextRequest) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });

  const Body = z.object({
    currency: z.string().min(1).max(10).optional(),
    cell_price: z.number().nonnegative().optional(),
    base_small: z.number().nonnegative().optional(),
    base_regular: z.number().nonnegative().optional(),
    base_large: z.number().nonnegative().optional(),
    extra_third_strip: z.number().nonnegative().optional(),
    extra_juice_groove: z.number().nonnegative().optional(),
    extra_brass_feet: z.number().nonnegative().optional(),
  });
  const jsonUnknown = await req.json().catch(() => undefined);
  const parsed = Body.safeParse(jsonUnknown);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.flatten() }, { status: 400 });
  const b = parsed.data;
  const payload = {
    id: true as const,
    ...(b.currency !== undefined ? { currency: b.currency } : {}),
    ...(b.cell_price !== undefined ? { cell_price: b.cell_price } : {}),
    ...(b.base_small !== undefined ? { base_small: b.base_small } : {}),
    ...(b.base_regular !== undefined ? { base_regular: b.base_regular } : {}),
    ...(b.base_large !== undefined ? { base_large: b.base_large } : {}),
    ...(b.extra_third_strip !== undefined ? { extra_third_strip: b.extra_third_strip } : {}),
    ...(b.extra_juice_groove !== undefined ? { extra_juice_groove: b.extra_juice_groove } : {}),
    ...(b.extra_brass_feet !== undefined ? { extra_brass_feet: b.extra_brass_feet } : {}),
  };
  const { error } = await adminSupabase.from("builder_pricing").upsert(payload, { onConflict: "id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

