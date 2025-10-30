"use client";

import { useEffect, useState } from "react";

type SeoOverridesPanelProps = {
  productId: string;
  primaryImage: string;
};

export default function SeoOverridesPanel({ productId, primaryImage }: SeoOverridesPanelProps) {
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDesc, setSeoDesc] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [ogImageUrl, setOgImageUrl] = useState("");
  const [seoSaving, setSeoSaving] = useState(false);
  const [seoError, setSeoError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/admin/products/${productId}/seo`);
        const data = await res.json();
        if (!active) return;
        if (res.ok && data?.item) {
          setSeoTitle(data.item.seo_title || "");
          setSeoDesc(data.item.seo_description || "");
          setCanonicalUrl(data.item.canonical_url || "");
          setOgImageUrl(data.item.og_image_url || "");
        }
      } catch (err) {
        console.error(err);
      }
    })();
    return () => {
      active = false;
    };
  }, [productId]);

  return (
    <div className="mt-6 rounded-lg border border-black/10 dark:border-white/10 p-4">
      <div className="text-lg font-semibold mb-1">SEO Overrides</div>
      <div className="text-xs opacity-70 mb-3">Optional. If left blank, global defaults will be used.</div>
      {seoError && <div className="text-sm text-red-600 dark:text-red-400">{seoError}</div>}
      <div className="grid md:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span>SEO Title</span>
          <input
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Canonical URL</span>
          <input
            value={canonicalUrl}
            onChange={(e) => setCanonicalUrl(e.target.value)}
            placeholder="https://berner-studio.com/products/..."
            className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm mt-3">
        <span>SEO Description</span>
        <textarea
          value={seoDesc}
          onChange={(e) => setSeoDesc(e.target.value)}
          rows={4}
          className="px-3 py-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm mt-3">
        <span>OpenGraph Image URL</span>
        <input
          value={ogImageUrl}
          onChange={(e) => setOgImageUrl(e.target.value)}
          placeholder="https://..."
          className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent"
        />
        <div className="flex items-center gap-2 mt-2">
          <button
            type="button"
            className="h-8 px-3 rounded-md border border-black/10 dark:border-white/10 text-xs"
            onClick={() => setOgImageUrl(primaryImage || "")}
          >
            Use primary image
          </button>
        </div>
      </label>
      <div className="flex items-center justify-end gap-2 mt-4">
        <button
          disabled={seoSaving}
          onClick={async () => {
            setSeoSaving(true);
            setSeoError(null);
            try {
              const res = await fetch(`/api/admin/products/${productId}/seo`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  seo_title: seoTitle || null,
                  seo_description: seoDesc || null,
                  canonical_url: canonicalUrl || null,
                  og_image_url: ogImageUrl || null,
                }),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data?.error || "Failed to save SEO");
            } catch (err: unknown) {
              const message = err instanceof Error ? err.message : "Unexpected error";
              setSeoError(message);
            } finally {
              setSeoSaving(false);
            }
          }}
          className="h-9 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
        >
          {seoSaving ? "Saving..." : "Save SEO"}
        </button>
      </div>
    </div>
  );
}
