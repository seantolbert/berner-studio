import { NextResponse } from "next/server";
import { z } from "zod";
import { adminSupabase } from "@/lib/supabase/serverAdmin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    if (!adminSupabase) {
      return NextResponse.json({ error: "Supabase admin not configured" }, { status: 500 });
    }
    const BodySchema = z.object({ piId: z.string() });
    const jsonUnknown = await req.json().catch(() => undefined);
    const parsed = BodySchema.safeParse(jsonUnknown ?? {});
    if (!parsed.success) return NextResponse.json({ error: "Invalid body", issues: parsed.error.flatten() }, { status: 400 });
    const piId = parsed.data.piId;
    if (!piId) return NextResponse.json({ error: "Missing piId" }, { status: 400 });

    const { data, error } = await adminSupabase
      .from("orders")
      .select("id,status,amount_cents,currency,capture_method,save_card,created_at")
      .eq("stripe_payment_intent_id", piId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ order: data });
  } catch (err: unknown) {
    const anyErr = err as { message?: string } | undefined;
    const message = anyErr?.message || "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
