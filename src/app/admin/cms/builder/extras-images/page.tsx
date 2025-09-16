"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdminGuard from "@/app/admin/AdminGuard";

type ExtrasImage = {
  id: string;
  url: string;
  alt: string | null;
  is_primary: boolean;
  position: number;
  created_at: string;
};

export default function BuilderExtrasImagesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<ExtrasImage[]>([]);

  const [altInput, setAltInput] = useState("");
  const [isPrimaryInput, setIsPrimaryInput] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fileInput, setFileInput] = useState<File | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/builder/extras-images", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load images");
      setImages(data.items || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const addImage = async () => {
    if (!fileInput) {
      setError("Choose an image to upload");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("file", fileInput);
      fd.set("slug", `builder-extras-${Date.now()}`);
      const upload = await fetch("/api/admin/media/upload", { method: "POST", body: fd });
      const uploadData = await upload.json();
      if (!upload.ok) throw new Error(uploadData?.error || "Upload failed");
      const url = uploadData.url as string;

      const res = await fetch("/api/admin/builder/extras-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          alt: altInput.trim() || null,
          position: images.length,
          is_primary: isPrimaryInput,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to add image");
      setAltInput("");
      setIsPrimaryInput(false);
      setFileInput(null);
      await refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setSaving(false);
    }
  };

  const updateImage = async (id: string, updates: Partial<{ alt: string | null; position: number; is_primary: boolean }>) => {
    try {
      const res = await fetch(`/api/admin/builder/extras-images/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to update image");
      await refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    }
  };

  const deleteImage = async (id: string) => {
    if (!confirm("Delete this image?")) return;
    try {
      const res = await fetch(`/api/admin/builder/extras-images/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to delete image");
      await refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    }
  };

  return (
    <main className="min-h-screen w-full p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-semibold">Builder Extras Images</h1>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/admin" className="underline">Admin Dashboard</Link>
            <Link href="/admin/cms" className="underline">CMS Home</Link>
          </div>
        </div>
        <AdminGuard>
          <div className="mb-4 text-sm">
            Use <Link className="underline" href="/admin/cms/media">Media</Link> to upload files, then paste the public URL here.
          </div>
          {error && <div className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</div>}
          <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 space-y-3">
            <div className="text-sm font-medium">Add image</div>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <label className="flex flex-col gap-1">
                <span>Upload file</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const next = e.target.files?.[0] || null;
                    setFileInput(next);
                  }}
                  className="text-sm"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span>Alt text</span>
                <input
                  value={altInput}
                  onChange={(e) => setAltInput(e.target.value)}
                  placeholder="Description"
                  className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent"
                />
              </label>
              <label className="flex items-center gap-2 text-sm mt-6">
                <input type="checkbox" className="h-4 w-4" checked={isPrimaryInput} onChange={(e) => setIsPrimaryInput(e.target.checked)} />
                Set as primary
              </label>
              <div className="md:col-span-2 flex items-center justify-end">
                <button
                  type="button"
                  onClick={addImage}
                  disabled={saving || !fileInput}
                  className="h-9 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Add image"}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-black/10 dark:border-white/10 p-4">
            {loading ? (
              <div className="text-sm opacity-70">Loading…</div>
            ) : images.length === 0 ? (
              <div className="text-sm opacity-70">No extras images yet.</div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {images.map((img) => (
                  <div key={img.id} className="flex flex-col md:flex-row md:items-center md:gap-4 border border-black/10 dark:border-white/10 rounded-md p-3 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="h-16 w-16 rounded-md bg-black/5 dark:bg-white/10 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt={img.alt ?? ""} className="h-full w-full object-cover" />
                      </div>
                      <div>
                        <div className="font-medium">{img.alt || "No alt"}</div>
                        <div className="text-xs opacity-70">{img.url}</div>
                      </div>
                    </div>
                    <div className="flex-1 mt-3 md:mt-0 grid md:grid-cols-[1fr_auto_auto] gap-2 items-center">
                      <label className="flex flex-col gap-1">
                        <span className="text-xs opacity-70">Alt text</span>
                        <input
                          value={img.alt || ""}
                          onChange={(e) => updateImage(img.id, { alt: e.target.value || null })}
                          placeholder="Description"
                          className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs opacity-70">Position</span>
                        <input
                          type="number"
                          value={img.position}
                          onChange={(e) => updateImage(img.id, { position: Number(e.target.value) || 0 })}
                          className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent"
                        />
                      </label>
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => updateImage(img.id, { is_primary: true })}
                          className={`h-8 px-3 rounded-md border text-xs ${img.is_primary ? "border-emerald-500 text-emerald-700" : "border-black/10 dark:border-white/10"}`}
                        >
                          {img.is_primary ? "Primary" : "Set primary"}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteImage(img.id)}
                          className="h-8 px-3 rounded-md border border-red-200 text-red-700 dark:border-red-700/50 dark:text-red-200 text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </AdminGuard>
      </div>
    </main>
  );
}
