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
    .from("homepage_settings")
    .select(
      "promo_enabled, promo_text, hero_title, hero_subtitle, boards_title, boards_description, boards_placeholder_url, boards_hero_title, boards_hero_subtitle, bottle_title, bottle_description, bottle_placeholder_url, testimonials_enabled, testimonial_quote, testimonial_author"
    )
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data || null });
}

export async function PATCH(req: NextRequest) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const Body = z.object({
    promo_enabled: z.boolean().optional(),
    promo_text: z.string().nullable().optional(),
    hero_title: z.string().nullable().optional(),
    hero_subtitle: z.string().nullable().optional(),
    boards_title: z.string().nullable().optional(),
    boards_description: z.string().nullable().optional(),
    boards_placeholder_url: z.string().url().nullable().optional(),
    boards_hero_title: z.string().nullable().optional(),
    boards_hero_subtitle: z.string().nullable().optional(),
    bottle_title: z.string().nullable().optional(),
    bottle_description: z.string().nullable().optional(),
    bottle_placeholder_url: z.string().url().nullable().optional(),
    testimonials_enabled: z.boolean().optional(),
    testimonial_quote: z.string().nullable().optional(),
    testimonial_author: z.string().nullable().optional(),
  });
  const jsonUnknown = await req.json().catch(() => undefined);
  const parsed = Body.safeParse(jsonUnknown);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body", issues: parsed.error.flatten() }, { status: 400 });
  const b = parsed.data;
  const payload = {
    id: true as const,
    promo_enabled: b.promo_enabled ?? false,
    promo_text: b.promo_text ?? null,
    hero_title: b.hero_title ?? null,
    hero_subtitle: b.hero_subtitle ?? null,
    boards_title: b.boards_title ?? null,
    boards_description: b.boards_description ?? null,
    boards_placeholder_url: b.boards_placeholder_url ?? null,
    boards_hero_title: b.boards_hero_title ?? null,
    boards_hero_subtitle: b.boards_hero_subtitle ?? null,
    bottle_title: b.bottle_title ?? null,
    bottle_description: b.bottle_description ?? null,
    bottle_placeholder_url: b.bottle_placeholder_url ?? null,
    testimonials_enabled: b.testimonials_enabled ?? false,
    testimonial_quote: b.testimonial_quote ?? null,
    testimonial_author: b.testimonial_author ?? null,
  };
  const { error } = await adminSupabase.from("homepage_settings").upsert(payload, { onConflict: "id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
