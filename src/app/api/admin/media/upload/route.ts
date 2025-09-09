import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/supabase/serverAdmin";
import { requireAdminBasicAuth } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

function sanitizeFilename(name: string) {
  return (name || "").replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function ensureMediaBucket() {
  try {
    // @ts-expect-error storage API provides getBucket in supabase-js v2 (types may lag)
    const { data: bucket } = await adminSupabase!.storage.getBucket("media");
    if (!bucket) {
      await adminSupabase!.storage.createBucket("media", { public: true });
    }
  } catch {
    // Fallback: try list + create if needed
    try {
      const resp = (adminSupabase as unknown as { storage: { listBuckets?: () => Promise<{ data?: Array<{ name: string }>; error?: unknown }> } }).storage;
      const out = await resp.listBuckets?.();
      const exists = Array.isArray(out?.data) && out!.data!.some((b) => b.name === "media");
      if (!exists) {
        await (adminSupabase as unknown as { storage: { createBucket: (n: string, o: { public: boolean }) => Promise<unknown> } }).storage.createBucket("media", { public: true });
      }
    } catch {
      // ignore; upload will surface error if bucket is missing
    }
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
  const { data: _data, error } = await adminSupabase.storage.from("media").upload(path, Buffer.from(arrayBuffer), {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { data: pub } = adminSupabase.storage.from("media").getPublicUrl(path);
  return NextResponse.json({ path, url: pub?.publicUrl });
}
