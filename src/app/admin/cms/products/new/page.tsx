"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import AdminGuard from "@/app/admin/AdminGuard";

const CATEGORIES = [
  { value: "bottle-openers", label: "Bottle Openers" },
  { value: "apparel", label: "Apparel" },
  { value: "boards", label: "Boards" },
];

export default function NewProductPage() {
  const router = useRouter();
  const slugify = (input: string) =>
    (input || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [price, setPrice] = useState<string>(""); // dollars
  const [category, setCategory] = useState<string>(CATEGORIES[0]?.value ?? "boards");
  const [shortDesc, setShortDesc] = useState("");
  const [longDesc, setLongDesc] = useState("");
  const [status, setStatus] = useState("draft");
  const [collections, setCollections] = useState<Array<{ id: string; label: string; href: string | null }>>([]);
  const [cardLabel, setCardLabel] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imgAlt, setImgAlt] = useState("");
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      // Revoke any existing object URLs on unmount
      previewUrls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [previewUrls]);

  // Load available collections from home sections
  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/home-sections");
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to load sections");
        const opts: Array<{ id: string; label: string; href: string | null }> = [];
        for (const s of (json.items || [])) {
          for (const c of (s.collections || [])) {
            opts.push({ id: c.id, label: c.label, href: c.href ?? null });
          }
        }
        // unique by label (case-insensitive)
        const seen = new Set<string>();
        const unique = opts.filter((o) => {
          const key = (o.label || "").toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        if (!aborted) setCollections(unique);
      } catch {}
    })();
    return () => {
      aborted = true;
    };
  }, []);

  const addTag = (raw: string) => {
    const value = raw.trim();
    if (!value) return;
    setTags((prev) => {
      if (prev.some((tag) => tag.toLowerCase() === value.toLowerCase())) return prev;
      return [...prev, value];
    });
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    const target = tag.toLowerCase();
    setTags((prev) => prev.filter((item) => item.toLowerCase() !== target));
  };

  const hasTag = (tag: string) => tags.some((item) => item.toLowerCase() === tag.toLowerCase());

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const price_cents = Math.round(Number(price || 0) * 100);
    try {
      const form = e.currentTarget as HTMLFormElement;
      const fileInput = (form.elements.namedItem("files") as HTMLInputElement) || null;
      const list = fileInput?.files;
      const pickedFiles: File[] = list && list.length ? (Array.from(list) as File[]) : [];

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          price_cents,
          category,
          short_desc: shortDesc,
          long_desc: longDesc,
          status,
          collection:
            collections
              .map((c) => c.label)
              .find((label) => hasTag(label)) || undefined,
          card_label: cardLabel.trim() || null,
          tags,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create product");
      const id = data?.id as string | undefined;
      const createdSlug = (data?.slug as string | undefined) || slug || name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

      // If an image was selected, upload and attach as primary
      if (id && pickedFiles.length) {
        try {
          for (let i = 0; i < pickedFiles.length; i++) {
            const file: File = pickedFiles[i]!;
            const fd = new FormData();
            fd.set("file", file);
            fd.set("slug", createdSlug || `product-${Date.now()}`);
            const up = await fetch("/api/admin/media/upload", { method: "POST", body: fd });
            const upData = await up.json();
            if (!up.ok) throw new Error(upData?.error || "Upload failed");

            const imgRes = await fetch(`/api/admin/products/${id}/images`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url: upData.url, alt: imgAlt, is_primary: i === 0 }),
            });
            const imgJson = await imgRes.json();
            if (!imgRes.ok) throw new Error(imgJson?.error || "Failed to save image");
          }
        } catch (imgErr: unknown) {
          console.warn("One or more image uploads failed", imgErr);
        }
      }

      if (id) router.push(`/admin/cms/products/${id}`);
      else router.push("/admin/cms/products");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen w-full p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-semibold">New Product</h1>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/admin" className="underline">Admin Dashboard</Link>
            <Link href="/admin/cms" className="underline">CMS Home</Link>
          </div>
        </div>
        <AdminGuard>
          <div className="mb-4">
            <Link href="/admin/cms/products" className="text-sm underline">Back to Products</Link>
          </div>
          <form onSubmit={onSubmit} className="rounded-lg border border-black/10 dark:border-white/10 p-4 space-y-4">
            {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}

            <div className="grid md:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-sm">
                <span>Name</span>
                <input
                  value={name}
                  onChange={(e) => {
                    const v = e.target.value;
                    setName(v);
                    if (!slugEdited) setSlug(slugify(v));
                  }}
                  required
                  className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span>Slug (optional)</span>
                <input
                  value={slug}
                  onChange={(e) => {
                    setSlugEdited(true);
                    setSlug(e.target.value);
                  }}
                  onBlur={() => setSlug((s) => slugify(s))}
                  placeholder="auto from name"
                  className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent"
                />
                <span className="text-[11px] opacity-70">Preview: /products/{slug || slugify(name) || "(auto)"}</span>
              </label>
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              <label className="flex flex-col gap-1 text-sm">
                <span>Price</span>
                <div className="flex items-center gap-1">
                  <span className="px-2 opacity-70">$</span>
                  <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="0.00" className="h-9 flex-1 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent" />
                </div>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span>Category</span>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 px-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent">
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span>Status</span>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 px-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
              <div className="rounded-md border border-black/10 dark:border-white/10 p-3 md:col-span-3">
                <div className="text-sm font-medium mb-2">Collections</div>
                {collections.length ? (
                  <div className="flex flex-wrap gap-3">
                    {collections.map((c) => (
                      <label key={c.id} className="inline-flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={hasTag(c.label)}
                          onChange={(e) => (e.target.checked ? addTag(c.label) : removeTag(c.label))}
                        />
                        {c.label}
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs opacity-70">No collections found. Manage collections under Home CMS sections.</div>
                )}
                <span className="text-[11px] opacity-70 mt-2 block">Collections are defined under Home CMS sections.</span>
              </div>
            </div>

            <label className="flex flex-col gap-1 text-sm">
              <span>Short description</span>
              <input value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent" />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span>Tags (optional)</span>
              <div className="flex items-center gap-2">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag(tagInput);
                    }
                  }}
                  placeholder="Type a tag and press Enter"
                  className="h-9 flex-1 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent"
                />
                <button
                  type="button"
                  onClick={() => addTag(tagInput)}
                  className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 text-sm"
                >
                  Add
                </button>
              </div>
              {tags.length ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-2 rounded-full border border-black/10 dark:border-white/10 px-3 py-1 text-xs"
                    >
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`} className="opacity-70 hover:opacity-100">
                        x
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
              <span className="text-[11px] opacity-70">Tags help with internal grouping and filters. They are case-insensitive.</span>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span>Product card label (optional)</span>
              <input
                value={cardLabel}
                maxLength={60}
                onChange={(e) => setCardLabel(e.target.value)}
                placeholder="e.g. Limited Release"
                className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent"
              />
              <span className="text-[11px] opacity-70">Shown as a badge on product cards (max 60 characters).</span>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span>Long description (Markdown)</span>
              <textarea value={longDesc} onChange={(e) => setLongDesc(e.target.value)} rows={8} className="px-3 py-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent" />
            </label>

            {/* Optional: primary image upload */}
            <div className="grid md:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-sm">
                <span>Images (optional)</span>
                <input
                  ref={fileInputRef}
                  name="files"
                  type="file"
                  accept="image/*"
                  multiple
                  className="text-sm"
                  onChange={(e) => {
                    // Revoke old previews
                    previewUrls.forEach((u) => URL.revokeObjectURL(u));
                    const files = e.target.files ? Array.from(e.target.files) : [];
                    const urls = files.map((f) => URL.createObjectURL(f));
                    setPreviewUrls(urls);
                  }}
                />
                <span className="text-[11px] opacity-70">JPG/PNG/WebP up to 5MB each</span>
                {previewUrls.length > 0 && (
                  <div className="mt-2 grid grid-cols-5 gap-2">
                    {previewUrls.map((u, idx) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={idx} src={u} alt={`Preview ${idx + 1}`} className="h-16 w-16 object-cover rounded border border-black/10 dark:border-white/10" />
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        if (fileInputRef.current) fileInputRef.current.value = "";
                        previewUrls.forEach((u) => URL.revokeObjectURL(u));
                        setPreviewUrls([]);
                      }}
                      className="h-8 px-2 rounded-md border border-black/10 dark:border-white/10 text-xs"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span>Image alt text</span>
                <input value={imgAlt} onChange={(e) => setImgAlt(e.target.value)} className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent" />
              </label>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Link href="/admin/cms/products" className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 text-sm">Cancel</Link>
              <button disabled={submitting} className="h-9 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm" type="submit">
                {submitting ? "Creating…" : "Create"}
              </button>
            </div>
          </form>
        </AdminGuard>
      </div>
    </main>
  );
}
