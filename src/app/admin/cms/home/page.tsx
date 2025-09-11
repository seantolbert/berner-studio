"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdminGuard from "@/app/admin/AdminGuard";
import Button from "@/app/components/ui/Button";
import SectionsManager from "@/app/admin/cms/home/SectionsManager";

export default function AdminHomePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [primaryLabel, setPrimaryLabel] = useState("");
  const [primaryHref, setPrimaryHref] = useState("");
  const [secondaryLabel, setSecondaryLabel] = useState("");
  const [secondaryHref, setSecondaryHref] = useState("");
  const [imgErr, setImgErr] = useState<string | null>(null);

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/home-hero");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load hero");
        if (aborted) return;
        const s = data?.item || {};
        setTitle(s.title || "");
        setSubtitle(s.subtitle || "");
        setImageUrl(s.image_url || "");
        setPrimaryLabel(s.primary_label || "");
        setPrimaryHref(s.primary_href || "");
        setSecondaryLabel(s.secondary_label || "");
        setSecondaryHref(s.secondary_href || "");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        setError(message);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      aborted = true;
    };
  }, []);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/home-hero", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || null,
          subtitle: subtitle || null,
          image_url: imageUrl || null,
          primary_label: primaryLabel || null,
          primary_href: primaryHref || null,
          secondary_label: secondaryLabel || null,
          secondary_href: secondaryHref || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to save");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen w-full p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-semibold">Home CMS</h1>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/admin" className="underline">Admin Dashboard</Link>
            <Link href="/admin/cms" className="underline">CMS Home</Link>
          </div>
        </div>
        <AdminGuard>
          {loading ? (
            <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 text-sm opacity-70">Loading…</div>
          ) : (
            <div className="space-y-6">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-100 dark:border-red-700/50 p-3 text-sm">
                  {error}
                </div>
              )}

              <section className="rounded-lg border border-black/10 dark:border-white/10 p-4">
                <div className="text-lg font-semibold mb-3">Hero</div>
                <div className="grid md:grid-cols-2 gap-3">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Headline"
                    className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm"
                  />
                  <input
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Subtext"
                    className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm"
                  />
                </div>

                <label className="flex flex-col gap-1 text-sm mt-3">
                  <span>Hero image URL</span>
                  <input
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://…"
                    className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent"
                  />
                </label>
                <div className="flex items-center gap-2 mt-2">
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setImgErr(null);
                      try {
                        const formEl = e.currentTarget as HTMLFormElement;
                        const input = (formEl.elements.namedItem("file") as HTMLInputElement) || null;
                        const file = input?.files?.[0];
                        if (!file) throw new Error("Choose a file");
                        const fd = new FormData();
                        fd.set("file", file);
                        fd.set("slug", "homepage-hero");
                        const up = await fetch("/api/admin/media/upload", { method: "POST", body: fd });
                        const data = await up.json();
                        if (!up.ok) throw new Error(data?.error || "Upload failed");
                        setImageUrl(data.url);
                        await fetch("/api/admin/home-hero", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ image_url: data.url }),
                        });
                        formEl.reset();
                      } catch (err: unknown) {
                        const message = err instanceof Error ? err.message : "Upload error";
                        setImgErr(message);
                      }
                    }}
                  >
                    <input name="file" type="file" accept="image/*" className="text-sm" />
                    <Button type="submit" variant="ghost" size="sm" className="ml-2">Upload</Button>
                  </form>
                  {imgErr && (
                    <div className="text-xs text-red-600 dark:text-red-400">{imgErr}</div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-3 mt-3">
                  <input
                    value={primaryLabel}
                    onChange={(e) => setPrimaryLabel(e.target.value)}
                    placeholder="Primary button text"
                    className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm"
                  />
                  <input
                    value={primaryHref}
                    onChange={(e) => setPrimaryHref(e.target.value)}
                    placeholder="Primary button link (optional)"
                    className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-3 mt-3">
                  <input
                    value={secondaryLabel}
                    onChange={(e) => setSecondaryLabel(e.target.value)}
                    placeholder="Secondary button text"
                    className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm"
                  />
                  <input
                    value={secondaryHref}
                    onChange={(e) => setSecondaryHref(e.target.value)}
                    placeholder="Secondary button link (optional)"
                    className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm"
                  />
                </div>
              </section>

              <div className="flex items-center justify-end gap-2">
                <Button disabled={saving} onClick={save}>
                  {saving ? "Saving…" : "Save"}
                </Button>
              </div>

              {/* Sections manager */}
              <SectionsManager />
            </div>
          )}
        </AdminGuard>
      </div>
    </main>
  );
}
