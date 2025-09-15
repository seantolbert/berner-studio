import { NextResponse } from "next/server";
import { adminSupabase } from "@/lib/supabase/serverAdmin";

export const dynamic = "force-dynamic";

// Public read-only endpoint for builder pricing.
// Uses server-side Supabase client to read values allowed by RLS.
export async function GET() {
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const { data, error } = await adminSupabase
    .from("builder_pricing")
    .select("currency,cell_price,base_small,base_regular,base_large,extra_third_strip,extra_juice_groove,extra_brass_feet")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data || null });
}

