import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminSupabase } from "@/lib/supabase/serverAdmin";
import { requireAdminBasicAuth } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase)
    return NextResponse.json({ error: "Admin not configured" }, { status: 500 });

  const { data, error } = await adminSupabase
    .from("home_hero")
    .select("title,subtitle,image_url,primary_label,primary_href,secondary_label,secondary_href")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data || null });
}

export async function PATCH(req: NextRequest) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase)
    return NextResponse.json({ error: "Admin not configured" }, { status: 500 });

  const Body = z.object({
    title: z.string().nullable().optional(),
    subtitle: z.string().nullable().optional(),
    image_url: z.string().url().nullable().optional(),
    primary_label: z.string().nullable().optional(),
    primary_href: z.string().nullable().optional(),
    secondary_label: z.string().nullable().optional(),
    secondary_href: z.string().nullable().optional(),
  });
  const jsonUnknown = await req.json().catch(() => undefined);
  const parsed = Body.safeParse(jsonUnknown);
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.flatten() },
      { status: 400 }
    );
  const b = parsed.data;
  const payload = {
    id: true as const,
    title: b.title ?? null,
    subtitle: b.subtitle ?? null,
    image_url: b.image_url ?? null,
    primary_label: b.primary_label ?? null,
    primary_href: b.primary_href ?? null,
    secondary_label: b.secondary_label ?? null,
    secondary_href: b.secondary_href ?? null,
  };

  const { error } = await adminSupabase
    .from("home_hero")
    .upsert(payload, { onConflict: "id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

