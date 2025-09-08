import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/supabase/serverAdmin";
import { requireAdminBasicAuth } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const { data, error } = await adminSupabase
    .from("homepage_settings")
    .select(
      "promo_enabled, promo_text, hero_title, hero_subtitle, boards_title, boards_description, boards_placeholder_url, bottle_title, bottle_description, bottle_placeholder_url, testimonials_enabled, testimonial_quote, testimonial_author"
    )
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data || null });
}

export async function PATCH(req: NextRequest) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const body = (await req.json().catch(() => ({}))) as any;
  const payload: any = {
    id: true,
    promo_enabled: body.promo_enabled ?? false,
    promo_text: body.promo_text ?? null,
    hero_title: body.hero_title ?? null,
    hero_subtitle: body.hero_subtitle ?? null,
    boards_title: body.boards_title ?? null,
    boards_description: body.boards_description ?? null,
    boards_placeholder_url: body.boards_placeholder_url ?? null,
    bottle_title: body.bottle_title ?? null,
    bottle_description: body.bottle_description ?? null,
    bottle_placeholder_url: body.bottle_placeholder_url ?? null,
    testimonials_enabled: body.testimonials_enabled ?? false,
    testimonial_quote: body.testimonial_quote ?? null,
    testimonial_author: body.testimonial_author ?? null,
  };
  const { error } = await adminSupabase.from("homepage_settings").upsert(payload, { onConflict: "id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

