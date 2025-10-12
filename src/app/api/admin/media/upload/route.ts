import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/supabase/serverAdmin";
import { requireAdminBasicAuth } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

function sanitizeFilename(name: string) {
  return (name || "").replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function ensureMediaBucket() {
  if (!adminSupabase) return;
  try {
    const { data: bucket } = await adminSupabase.storage.getBucket("media");
    if (bucket) return;
  } catch {
    // ignore and attempt to create
  }
  try {
    await adminSupabase.storage.createBucket("media", { public: true });
  } catch {
    // ignore; subsequent upload errors will surface if creation failed
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAdminBasicAuth(req);
  if (auth) return auth;
  if (!adminSupabase) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid form" }, { status: 400 });
  const file = form.get("file") as File | null;
  const slug = String(form.get("slug") || "").trim();
  if (!file) return NextResponse.json({ error: "Missing file" }, { status: 400 });
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 413 });
  await ensureMediaBucket();
  const now = Date.now();
  const safe = sanitizeFilename(file.name || "upload");
  const path = `products/${slug}/${now}-${safe}`;
  const arrayBuffer = await file.arrayBuffer();
  const { error } = await adminSupabase.storage.from("media").upload(path, Buffer.from(arrayBuffer), {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { data: pub } = adminSupabase.storage.from("media").getPublicUrl(path);
  return NextResponse.json({ path, url: pub?.publicUrl });
}
