import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminSupabase } from "@/lib/supabase/serverAdmin";
import { requireAdminBasicAuth } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const { searchParams } = new URL(req.url);
  const publishedParam = searchParams.get("published");
  let query = adminSupabase
    .from("faq")
    .select("id, question, answer, position, published, updated_at")
    .order("position", { ascending: true })
    .order("updated_at", { ascending: false });
  if (publishedParam != null) {
    const bool = publishedParam === "true";
    query = query.eq("published", bool);
  }
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data || [] });
}

export async function POST(req: NextRequest) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const Body = z.object({
    question: z.string().min(1),
    answer: z.string().min(1),
    position: z.number().int().nonnegative().optional(),
    published: z.boolean().optional(),
  });
  const jsonUnknown = await req.json().catch(() => undefined);
  const parsed = Body.safeParse(jsonUnknown);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const b = parsed.data;
  const item = {
    question: b.question,
    answer: b.answer,
    position: b.position ?? 0,
    published: b.published ?? true,
  };
  const { data, error } = await adminSupabase.from("faq").insert(item).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data?.id });
}
