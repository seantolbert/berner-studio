"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdminGuard from "@/app/admin/AdminGuard";

type Item = { id: string; url: string; alt: string | null; caption: string | null; position: number; published: boolean };

export default function AdminGalleryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [alt, setAlt] = useState("");
  const [caption, setCaption] = useState("");

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/gallery");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load gallery");
      setItems(data.items || []);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unexpected error";
      setError(message);
    } finally { setLoading(false); }
  }

  useEffect(() => { refresh(); }, []);

  return (
    <main className="min-h-screen w-full p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-semibold">Gallery</h1>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/admin" className="underline">Admin Dashboard</Link>
            <Link href="/admin/cms" className="underline">CMS Home</Link>
          </div>
        </div>
        <AdminGuard>
          <div className="mb-4">
            <Link href="/admin/cms" className="text-sm underline">Back to CMS</Link>
          </div>
          <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 mb-4">
            <div className="text-sm font-medium mb-2">Upload</div>
            {error && <div className="text-sm text-red-600 dark:text-red-400 mb-2">{error}</div>}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setUploading(true);
                setError(null);
                try {
                  const formEl = e.currentTarget as HTMLFormElement;
                  const fileInput = (formEl.elements.namedItem("file") as HTMLInputElement) || null;
                  const file = fileInput?.files?.[0];
                  if (!file) throw new Error("Choose a file");
                  const fd = new FormData();
                  fd.set("file", file);
                  fd.set("slug", `gallery-${Date.now()}`);
                  const up = await fetch("/api/admin/media/upload", { method: "POST", body: fd });
                  const upData = await up.json();
                  if (!up.ok) throw new Error(upData?.error || "Upload failed");
                  const res = await fetch("/api/admin/gallery", { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ url: upData.url, alt, caption, position: items.length, published: true }) });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data?.error || 'Failed to save');
                  setAlt(""); setCaption(""); formEl.reset();
                  await refresh();
                } catch (e: unknown) {
                  const message = e instanceof Error ? e.message : 'Unexpected error';
                  setError(message);
                } finally { setUploading(false); }
              }}
              className="grid md:grid-cols-3 gap-3"
            >
              <label className="flex flex-col gap-1 text-sm">
                <span>Image</span>
                <input name="file" type="file" accept="image/*" className="text-sm" />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span>Alt</span>
                <input value={alt} onChange={(e)=>setAlt(e.target.value)} className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent" />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span>Caption</span>
                <input value={caption} onChange={(e)=>setCaption(e.target.value)} className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent" />
              </label>
              <div className="md:col-span-3 flex items-center justify-end">
                <button disabled={uploading} className="h-9 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm" type="submit">{uploading? 'Uploading…':'Upload'}</button>
              </div>
            </form>
          </div>

          <div className="rounded-lg border border-black/10 dark:border-white/10 p-3">
            {loading ? (
              <div className="text-sm opacity-70">Loading…</div>
            ) : items.length === 0 ? (
              <div className="text-sm opacity-70">No images</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {items.map((g) => (
                  <div key={g.id} className="rounded border border-black/10 dark:border-white/10 overflow-hidden">
                    <div className="aspect-square bg-black/5 dark:bg-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={g.url} alt={g.alt || ''} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-2 space-y-1 text-xs">
                      <div className="truncate" title={g.caption || undefined}>{g.caption || <span className="opacity-60">(no caption)</span>}</div>
                      <div className="flex items-center gap-2">
                        <label className="inline-flex items-center gap-1">
                          <input type="checkbox" defaultChecked={g.published} onChange={async (e)=>{ try{ await fetch(`/api/admin/gallery/${g.id}`, { method:'PATCH', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ published: e.target.checked }) }); } catch{} }} /> Published
                        </label>
                        <button className="h-7 px-2 rounded-md border border-black/10 dark:border-white/10" onClick={async()=>{
                          const nalt = prompt('Alt text', g.alt || '') ?? undefined;
                          const ncap = prompt('Caption', g.caption || '') ?? undefined;
                          if (nalt === undefined && ncap === undefined) return;
                          try { await fetch(`/api/admin/gallery/${g.id}`, { method:'PATCH', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ alt: nalt ?? g.alt, caption: ncap ?? g.caption }) }); await refresh(); } catch{}
                        }}>Edit</button>
                        <button className="h-7 px-2 rounded-md border border-black/10 dark:border-white/10" onClick={async()=>{ if(!confirm('Delete image?')) return; try{ await fetch(`/api/admin/gallery/${g.id}`, { method:'DELETE' }); await refresh(); } catch{} }}>Delete</button>
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
