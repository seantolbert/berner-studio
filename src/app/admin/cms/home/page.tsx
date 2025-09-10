"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdminGuard from "@/app/admin/AdminGuard";

export default function AdminHomePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [imgErr, setImgErr] = useState<string | null>(null);

  // Promo
  const [promoEnabled, setPromoEnabled] = useState(false);
  const [promoText, setPromoText] = useState("");

  // Hero copy + media
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [homeHeroUrl, setHomeHeroUrl] = useState("");

  // Hero CTAs
  const [heroCtaPrimaryText, setHeroCtaPrimaryText] = useState("");
  const [heroCtaPrimaryHref, setHeroCtaPrimaryHref] = useState("");
  const [heroCtaSecondaryText, setHeroCtaSecondaryText] = useState("");
  const [heroCtaSecondaryHref, setHeroCtaSecondaryHref] = useState("");

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/home");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load settings");
        if (aborted) return;
        const s = data?.item || {};
        setPromoEnabled(Boolean(s.promo_enabled));
        setPromoText(s.promo_text || "");
        setHeroTitle(s.hero_title || "");
        setHeroSubtitle(s.hero_subtitle || "");
        setHomeHeroUrl(s.home_hero_url || "");
        setHeroCtaPrimaryText(s.hero_cta_primary_text || "");
        setHeroCtaPrimaryHref(s.hero_cta_primary_href || "");
        setHeroCtaSecondaryText(s.hero_cta_secondary_text || "");
        setHeroCtaSecondaryHref(s.hero_cta_secondary_href || "");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        setError(message);
      } finally {
        setLoading(false);
      }
    })();
    return () => { aborted = true; };
  }, []);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/home", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promo_enabled: promoEnabled,
          promo_text: promoText,
          hero_title: heroTitle,
          hero_subtitle: heroSubtitle,
          home_hero_url: homeHeroUrl || null,
          hero_cta_primary_text: heroCtaPrimaryText || null,
          hero_cta_primary_href: heroCtaPrimaryHref || null,
          hero_cta_secondary_text: heroCtaSecondaryText || null,
          hero_cta_secondary_href: heroCtaSecondaryHref || null,
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

              {/* Promo Banner */}
              <section className="rounded-lg border border-black/10 dark:border-white/10 p-4">
                <div className="text-lg font-semibold mb-3">Promo Banner</div>
                <label className="inline-flex items-center gap-2 text-sm mb-2">
                  <input
                    type="checkbox"
                    checked={promoEnabled}
                    onChange={(e) => setPromoEnabled(e.target.checked)}
                  />
                  Show banner
                </label>
                <input
                  value={promoText}
                  onChange={(e) => setPromoText(e.target.value)}
                  placeholder="Free shipping $75+"
                  className="w-full h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm"
                />
              </section>

              {/* Hero */}
              <section className="rounded-lg border border-black/10 dark:border-white/10 p-4">
                <div className="text-lg font-semibold mb-3">Hero</div>
                <div className="grid md:grid-cols-2 gap-3">
                  <input
                    value={heroTitle}
                    onChange={(e) => setHeroTitle(e.target.value)}
                    placeholder="Headline"
                    className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm"
                  />
                  <input
                    value={heroSubtitle}
                    onChange={(e) => setHeroSubtitle(e.target.value)}
                    placeholder="Subheadline"
                    className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm"
                  />
                </div>

                <label className="flex flex-col gap-1 text-sm mt-3">
                  <span>Home hero image URL</span>
                  <input
                    value={homeHeroUrl}
                    onChange={(e) => setHomeHeroUrl(e.target.value)}
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
                        setHomeHeroUrl(data.url);
                        // Persist immediately to homepage settings
                        await fetch("/api/admin/home", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ home_hero_url: data.url }),
                        });
                        formEl.reset();
                      } catch (err: unknown) {
                        const message = err instanceof Error ? err.message : "Upload error";
                        setImgErr(message);
                      }
                    }}
                  >
                    <input name="file" type="file" accept="image/*" className="text-sm" />
                    <button className="h-8 px-2 rounded-md border border-black/10 dark:border-white/10 text-xs ml-2" type="submit">
                      Upload
                    </button>
                  </form>
                  {imgErr && <div className="text-xs text-red-600 dark:text-red-400">{imgErr}</div>}
                </div>

                <div className="grid md:grid-cols-2 gap-3 mt-3">
                  <input
                    value={heroCtaPrimaryText}
                    onChange={(e) => setHeroCtaPrimaryText(e.target.value)}
                    placeholder="Primary button text"
                    className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm"
                  />
                  <input
                    value={heroCtaPrimaryHref}
                    onChange={(e) => setHeroCtaPrimaryHref(e.target.value)}
                    placeholder="Primary button link (e.g., /templates)"
                    className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-3 mt-3">
                  <input
                    value={heroCtaSecondaryText}
                    onChange={(e) => setHeroCtaSecondaryText(e.target.value)}
                    placeholder="Secondary button text"
                    className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm"
                  />
                  <input
                    value={heroCtaSecondaryHref}
                    onChange={(e) => setHeroCtaSecondaryHref(e.target.value)}
                    placeholder="Secondary button link (e.g., /boards)"
                    className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm"
                  />
                </div>
              </section>

              <div className="flex items-center justify-end gap-2">
                <button
                  disabled={saving}
                  onClick={save}
                  className="h-9 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
                >
                  {saving ? "Saving…" : "Save Settings"}
                </button>
              </div>
            </div>
          )}
        </AdminGuard>
      </div>
    </main>
  );
}
