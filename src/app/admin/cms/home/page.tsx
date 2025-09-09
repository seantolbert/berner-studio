"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdminGuard from "@/app/admin/AdminGuard";

export default function AdminHomePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [promoEnabled, setPromoEnabled] = useState(false);
  const [promoText, setPromoText] = useState("");

  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");

  const [boardsTitle, setBoardsTitle] = useState("");
  const [boardsDesc, setBoardsDesc] = useState("");
  const [boardsImg, setBoardsImg] = useState("");
  const [boardsHeroTitle, setBoardsHeroTitle] = useState("");
  const [boardsHeroSubtitle, setBoardsHeroSubtitle] = useState("");

  const [bottleTitle, setBottleTitle] = useState("");
  const [bottleDesc, setBottleDesc] = useState("");
  const [bottleImg, setBottleImg] = useState("");

  const [testimonialsEnabled, setTestimonialsEnabled] = useState(false);
  const [testimonialQuote, setTestimonialQuote] = useState("");
  const [testimonialAuthor, setTestimonialAuthor] = useState("");

  const [saving, setSaving] = useState(false);
  const [imgErr, setImgErr] = useState<string | null>(null);
  const [uploadingBoards, setUploadingBoards] = useState(false);
  const [uploadingBottle, setUploadingBottle] = useState(false);

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
        setBoardsTitle(s.boards_title || "");
        setBoardsDesc(s.boards_description || "");
        setBoardsImg(s.boards_placeholder_url || "");
        setBoardsHeroTitle(s.boards_hero_title || "");
        setBoardsHeroSubtitle(s.boards_hero_subtitle || "");
        setBottleTitle(s.bottle_title || "");
        setBottleDesc(s.bottle_description || "");
        setBottleImg(s.bottle_placeholder_url || "");
        setTestimonialsEnabled(Boolean(s.testimonials_enabled));
        setTestimonialQuote(s.testimonial_quote || "");
        setTestimonialAuthor(s.testimonial_author || "");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        if (!aborted) setError(message);
      } finally {
        if (!aborted) setLoading(false);
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
      const res = await fetch("/api/admin/home", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promo_enabled: promoEnabled,
          promo_text: promoText,
          hero_title: heroTitle,
          hero_subtitle: heroSubtitle,
          boards_title: boardsTitle,
          boards_description: boardsDesc,
          boards_placeholder_url: boardsImg,
          boards_hero_title: boardsHeroTitle,
          boards_hero_subtitle: boardsHeroSubtitle,
          bottle_title: bottleTitle,
          bottle_description: bottleDesc,
          bottle_placeholder_url: bottleImg,
          testimonials_enabled: testimonialsEnabled,
          testimonial_quote: testimonialQuote,
          testimonial_author: testimonialAuthor,
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
          <div className="mb-4">
            <Link href="/admin/cms" className="text-sm underline">Back to CMS</Link>
          </div>

          {loading ? (
            <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 text-sm opacity-70">Loading…</div>
          ) : (
            <div className="space-y-6">
              {error && <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-100 dark:border-red-700/50 p-3 text-sm">{error}</div>}

              <section className="rounded-lg border border-black/10 dark:border-white/10 p-4">
                <div className="text-lg font-semibold mb-3">Promo Banner</div>
                <label className="inline-flex items-center gap-2 text-sm mb-2">
                  <input type="checkbox" checked={promoEnabled} onChange={(e) => setPromoEnabled(e.target.checked)} />
                  Show banner
                </label>
                <input value={promoText} onChange={(e) => setPromoText(e.target.value)} placeholder="Free shipping $75+" className="w-full h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm" />
              </section>

              <section className="rounded-lg border border-black/10 dark:border-white/10 p-4">
                <div className="text-lg font-semibold mb-3">Hero</div>
                <div className="grid md:grid-cols-2 gap-3">
                  <input value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} placeholder="Headline" className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm" />
                  <input value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} placeholder="Subheadline" className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm" />
                </div>
              </section>

              <section className="rounded-lg border border-black/10 dark:border-white/10 p-4">
                <div className="text-lg font-semibold mb-3">Boards Section</div>
                <div className="grid md:grid-cols-2 gap-3 mb-3">
                  <input value={boardsHeroTitle} onChange={(e) => setBoardsHeroTitle(e.target.value)} placeholder="Boards hero title" className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm" />
                  <input value={boardsHeroSubtitle} onChange={(e) => setBoardsHeroSubtitle(e.target.value)} placeholder="Boards hero subtitle" className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm" />
                </div>
                <div className="grid md:grid-cols-2 gap-3 mb-3">
                  <input value={boardsTitle} onChange={(e) => setBoardsTitle(e.target.value)} placeholder="Title" className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm" />
                  <input value={boardsDesc} onChange={(e) => setBoardsDesc(e.target.value)} placeholder="Description" className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm" />
                </div>
                <label className="flex flex-col gap-1 text-sm">
                  <span>Placeholder image URL</span>
                  <input value={boardsImg} onChange={(e) => setBoardsImg(e.target.value)} placeholder="https://…" className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent" />
                </label>
                <div className="flex items-center gap-2 mt-2">
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setImgErr(null);
                      setUploadingBoards(true);
                      try {
                        const formEl = e.currentTarget as HTMLFormElement;
                        const input = (formEl.elements.namedItem("file") as HTMLInputElement) || null;
                        const file = input?.files?.[0];
                        if (!file) throw new Error("Choose a file");
                        const fd = new FormData();
                        fd.set("file", file);
                        fd.set("slug", "homepage-boards");
                        const up = await fetch("/api/admin/media/upload", { method: "POST", body: fd });
                        const data = await up.json();
                        if (!up.ok) throw new Error(data?.error || "Upload failed");
                        setBoardsImg(data.url);
                        // Persist immediately to homepage settings
                        try {
                          const saveRes = await fetch("/api/admin/home", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ boards_placeholder_url: data.url }),
                          });
                          const saveJson = await saveRes.json().catch(() => ({}));
                          if (!saveRes.ok) throw new Error(saveJson?.error || "Failed to save image URL");
                        } catch (e) {
                          // Bubble as upload error for now
                          throw e;
                        }
                        formEl.reset();
                      } catch (err: unknown) {
                        const message = err instanceof Error ? err.message : "Upload error";
                        setImgErr(message);
                      } finally {
                        setUploadingBoards(false);
                      }
                    }}
                  >
                    <input name="file" type="file" accept="image/*" className="text-sm" />
                    <button disabled={uploadingBoards} className="h-8 px-2 rounded-md border border-black/10 dark:border-white/10 text-xs ml-2" type="submit">
                      {uploadingBoards ? "Uploading…" : "Upload"}
                    </button>
                  </form>
                </div>
              </section>

              <section className="rounded-lg border border-black/10 dark:border-white/10 p-4">
                <div className="text-lg font-semibold mb-3">Bottle Openers Section</div>
                <div className="grid md:grid-cols-2 gap-3 mb-3">
                  <input value={bottleTitle} onChange={(e) => setBottleTitle(e.target.value)} placeholder="Title" className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm" />
                  <input value={bottleDesc} onChange={(e) => setBottleDesc(e.target.value)} placeholder="Description" className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm" />
                </div>
                <label className="flex flex-col gap-1 text-sm">
                  <span>Placeholder image URL</span>
                  <input value={bottleImg} onChange={(e) => setBottleImg(e.target.value)} placeholder="https://…" className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent" />
                </label>
                <div className="flex items-center gap-2 mt-2">
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setImgErr(null);
                      setUploadingBottle(true);
                      try {
                        const formEl = e.currentTarget as HTMLFormElement;
                        const input = (formEl.elements.namedItem("file") as HTMLInputElement) || null;
                        const file = input?.files?.[0];
                        if (!file) throw new Error("Choose a file");
                        const fd = new FormData();
                        fd.set("file", file);
                        fd.set("slug", "homepage-bottle");
                        const up = await fetch("/api/admin/media/upload", { method: "POST", body: fd });
                        const data = await up.json();
                        if (!up.ok) throw new Error(data?.error || "Upload failed");
                        setBottleImg(data.url);
                        // Persist immediately to homepage settings
                        try {
                          const saveRes = await fetch("/api/admin/home", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ bottle_placeholder_url: data.url }),
                          });
                          const saveJson = await saveRes.json().catch(() => ({}));
                          if (!saveRes.ok) throw new Error(saveJson?.error || "Failed to save image URL");
                        } catch (e) {
                          throw e;
                        }
                        formEl.reset();
                      } catch (err: unknown) {
                        const message = err instanceof Error ? err.message : "Upload error";
                        setImgErr(message);
                      } finally {
                        setUploadingBottle(false);
                      }
                    }}
                  >
                    <input name="file" type="file" accept="image/*" className="text-sm" />
                    <button disabled={uploadingBottle} className="h-8 px-2 rounded-md border border-black/10 dark:border-white/10 text-xs ml-2" type="submit">
                      {uploadingBottle ? "Uploading…" : "Upload"}
                    </button>
                  </form>
                </div>
              </section>

              <section className="rounded-lg border border-black/10 dark:border-white/10 p-4">
                <div className="text-lg font-semibold mb-3">Testimonials</div>
                <label className="inline-flex items-center gap-2 text-sm mb-2">
                  <input type="checkbox" checked={testimonialsEnabled} onChange={(e) => setTestimonialsEnabled(e.target.checked)} />
                  Show testimonials
                </label>
                <div className="grid md:grid-cols-2 gap-3">
                  <input value={testimonialAuthor} onChange={(e) => setTestimonialAuthor(e.target.value)} placeholder="Author" className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm" />
                  <input value={testimonialQuote} onChange={(e) => setTestimonialQuote(e.target.value)} placeholder="Quote" className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm" />
                </div>
              </section>

              {imgErr && <div className="text-sm text-red-600 dark:text-red-400">{imgErr}</div>}

              <div className="flex items-center justify-end gap-2">
                <button disabled={saving} onClick={save} className="h-9 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm">
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
