"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AdminGuard from "@/app/admin/AdminGuard";

const CATEGORIES = [
  { value: "bottle-openers", label: "Bottle Openers" },
  { value: "apparel", label: "Apparel" },
  { value: "boards", label: "Boards" },
];

type Product = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  category: string;
  status: "draft" | "published" | "archived";
  short_desc: string | null;
  long_desc: string | null;
  primary_image_url: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  product_template_id?: string | null;
  card_label: string | null;
};

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [item, setItem] = useState<Product | null>(null);

  // Editable state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [price, setPrice] = useState<string>(""); // dollars
  const [category, setCategory] = useState<string>(CATEGORIES[0]?.value ?? "boards");
  const [shortDesc, setShortDesc] = useState("");
  const [longDesc, setLongDesc] = useState("");
  const [status, setStatus] = useState("draft");
  const [primaryImage, setPrimaryImage] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [collections, setCollections] = useState<Array<{ id: string; label: string; href: string | null }>>([]);
  const [productTemplateId, setProductTemplateId] = useState<string | "" | null>(null);
  const [cardLabel, setCardLabel] = useState("");
  const [templateOptions, setTemplateOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // SEO overrides
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDesc, setSeoDesc] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [ogImageUrl, setOgImageUrl] = useState("");
  const [seoSaving, setSeoSaving] = useState(false);
  const [seoError, setSeoError] = useState<string | null>(null);
  const [images, setImages] = useState<Array<{ id: string; url: string; alt: string | null; is_primary: boolean; position: number; color?: string | null }>>([]);
  const [imgLoading, setImgLoading] = useState(false);
  const [imgError, setImgError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadAlt, setUploadAlt] = useState("");
  const [uploadColor, setUploadColor] = useState<string>("");
  const [imageColorFilter, setImageColorFilter] = useState<string>("");

  // Variants (apparel)
  type VariantRow = { include: boolean; color: string; size: string; sku: string; price_cents_override?: string; status: 'draft'|'published' };
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [existingVariants, setExistingVariants] = useState<Array<{ id: string; color: string; size: string; sku: string | null; price_cents_override: number | null; status: 'draft'|'published'; updated_at: string }>>([]);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [variantsError, setVariantsError] = useState<string | null>(null);
  const defaultColors = ['grey','purple','blue'];
  const defaultSizes = ['S','M','L','XL'];
  const [selectedColors, setSelectedColors] = useState<string[]>(defaultColors);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(defaultSizes);

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

  async function refreshImages() {
    setImgLoading(true);
    setImgError(null);
    try {
      const res = await fetch(`/api/admin/products/${id}/images`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load images");
      setImages(data.items || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setImgError(message);
    } finally {
      setImgLoading(false);
    }
  }

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/products/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load product");
        if (aborted) return;
        const p = data.item as Product;
        setItem(p);
        setName(p.name);
        setSlug(p.slug);
        setPrice((p.price_cents / 100).toFixed(2));
        setCategory(p.category);
        setShortDesc(p.short_desc || "");
        setLongDesc(p.long_desc || "");
        setStatus(p.status);
        setPrimaryImage(p.primary_image_url || "");
        setTags(Array.isArray(p.tags) ? p.tags.map((t) => String(t)) : []);
        setProductTemplateId(p.product_template_id || "");
        setCardLabel(p.card_label || "");
        await refreshImages();
        // Load SEO overrides
        try {
          const seoRes = await fetch(`/api/admin/products/${id}/seo`);
          const seoData = await seoRes.json();
          if (seoRes.ok && seoData?.item) {
            setSeoTitle(seoData.item.seo_title || "");
            setSeoDesc(seoData.item.seo_description || "");
            setCanonicalUrl(seoData.item.canonical_url || "");
            setOgImageUrl(seoData.item.og_image_url || "");
          }
        } catch {}
        // Load existing variants
        await refreshVariants();
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Load available collections for tag shortcuts
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

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const price_cents = Math.round(Number(price || 0) * 100);
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          price_cents,
          category,
          short_desc: shortDesc,
          long_desc: longDesc,
          status,
          primary_image_url: primaryImage || null,
          tags,
          product_template_id: productTemplateId ? productTemplateId : null,
          card_label: cardLabel.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to save");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!confirm("Archive this product?")) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to delete");
      router.push("/admin/cms/products");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setError(message);
    } finally {
      setDeleting(false);
    }
  };

  function generateVariants() {
    const colors = selectedColors.slice();
    const sizes = selectedSizes.slice();
    const rows: VariantRow[] = [];
    for (const c of colors) {
      for (const s of sizes) {
        const sku = `${slug}-${c}-${s}`.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
        rows.push({ include: true, color: c, size: s.toUpperCase(), sku, status: 'draft' });
      }
    }
    setVariants(rows);
  }

  // Load product templates for selection via admin API
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/admin/product-templates`);
        const data = await res.json();
        if (!mounted) return;
        if (res.ok) {
          const items = Array.isArray(data.items)
            ? data.items.filter((entry: unknown): entry is { id: string; name: string } => {
                if (!entry || typeof entry !== "object") return false;
                const candidate = entry as { id?: unknown; name?: unknown };
                return typeof candidate.id === "string" && typeof candidate.name === "string";
              })
            : [];
          setTemplateOptions(items.map((item: { id: string; name: string }) => ({ id: item.id, name: item.name })));
        }
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  function updateVariant(idx: number, partial: Partial<VariantRow>) {
    setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, ...partial } : v)));
  }

  async function refreshVariants() {
    setVariantsLoading(true);
    setVariantsError(null);
    try {
      const res = await fetch(`/api/admin/products/${id}/variants`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load variants');
      setExistingVariants(data.items || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unexpected error';
      setVariantsError(message);
    } finally {
      setVariantsLoading(false);
    }
  }

  async function saveVariants() {
    const items = variants.filter((v) => v.include).map((v) => ({
      color: v.color,
      size: v.size,
      sku: v.sku || null,
      price_cents_override: v.price_cents_override ? Math.round(Number(v.price_cents_override) * 100) : null,
      status: v.status,
    }));
    if (items.length === 0) return;
    try {
      const res = await fetch(`/api/admin/products/${id}/variants`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ items }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to save variants');
      await refreshVariants();
      setVariants([]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unexpected error';
      setVariantsError(message);
    }
  }

  return (
    <main className="min-h-screen w-full p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-semibold">Edit Product</h1>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/admin" className="underline">Admin Dashboard</Link>
            <Link href="/admin/cms" className="underline">CMS Home</Link>
          </div>
        </div>
        <AdminGuard>
          <div className="mb-4 flex items-center justify-between">
            <Link href="/admin/cms/products" className="text-sm underline">Back to Products</Link>
            <button onClick={onDelete} disabled={deleting} className="h-9 px-3 rounded-md border border-red-300 text-red-700 dark:text-red-300 text-sm">
              {deleting ? "Archiving…" : "Archive"}
            </button>
          </div>

          {loading ? (
            <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 text-sm opacity-70">Loading…</div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-100 dark:border-red-700/50 p-4 text-sm">{error}</div>
          ) : item ? (
            <form onSubmit={onSave} className="rounded-lg border border-black/10 dark:border-white/10 p-4 space-y-4">
              <div className="grid md:grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-sm">
                  <span>Name</span>
                  <input value={name} onChange={(e) => setName(e.target.value)} required className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent" />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span>Slug</span>
                  <input value={slug} onChange={(e) => setSlug(e.target.value)} className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent" />
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
            </div>

            {category === 'boards' && (
              <div className="rounded-md border border-black/10 dark:border-white/10 p-3">
                <div className="text-sm font-medium mb-2">Board Template</div>
                <label className="flex items-center gap-2 text-sm">
                  <span className="w-32 opacity-80">Assigned template</span>
                  <select
                    value={productTemplateId || ""}
                    onChange={(e)=> setProductTemplateId(e.target.value)}
                    className="h-9 px-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent flex-1"
                  >
                    <option value="">— None —</option>
                    {templateOptions.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </label>
                <div className="text-[11px] opacity-70 mt-1">Templates come from the Product Templates table. Use the builder Save action to add more.</div>
              </div>
            )}

            {/* Collections */}
            <div className="rounded-md border border-black/10 dark:border-white/10 p-3">
              <div className="text-sm font-medium mb-2">Collections</div>
              {collections.length ? (
                <div className="flex flex-wrap gap-3">
                  {collections.map((collection) => (
                    <label key={collection.id} className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={hasTag(collection.label)}
                        onChange={(e) => (e.target.checked ? addTag(collection.label) : removeTag(collection.label))}
                      />
                      {collection.label}
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-xs opacity-70">No collections found. Manage collections under Home CMS sections.</div>
              )}
            </div>

            <label className="flex flex-col gap-1 text-sm">
              <span>Tags (optional)</span>
              <div className="flex items-center gap-2">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
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
                    <span key={tag} className="inline-flex items-center gap-2 rounded-full border border-black/10 dark:border-white/10 px-3 py-1 text-xs">
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
                <span>Primary image URL</span>
                <input value={primaryImage} onChange={(e) => setPrimaryImage(e.target.value)} placeholder="https://…" className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent" />
                <span className="text-[11px] opacity-70">You can upload images in the Media tab; the image picker will be added here next.</span>
              </label>

              <label className="flex flex-col gap-1 text-sm">
                <span>Short description</span>
                <input value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent" />
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
                <textarea value={longDesc} onChange={(e) => setLongDesc(e.target.value)} rows={10} className="px-3 py-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent" />
              </label>

              <div className="flex items-center justify-end gap-2">
                <Link href="/admin/cms/products" className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 text-sm">Cancel</Link>
                <button disabled={saving} className="h-9 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm" type="submit">
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          ) : null}

          {/* Images panel */}
          {item && (
            <div className="mt-6 rounded-lg border border-black/10 dark:border-white/10 p-4">
              <div className="text-lg font-semibold mb-3">Images</div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setUploading(true);
                      setImgError(null);
                      try {
                        const formEl = e.currentTarget as HTMLFormElement;
                  const fileInput = (formEl.elements.namedItem("file") as HTMLInputElement) || null;
                  const selected = fileInput?.files ? Array.from(fileInput.files) : [];
                  if (!selected.length) throw new Error("Choose at least one file");

                  const hasPrimary = images.some((img) => img.is_primary);
                  let primaryAssigned = hasPrimary;

                  for (let idx = 0; idx < selected.length; idx += 1) {
                    const file = selected[idx]!;
                    const fd = new FormData();
                    fd.set("file", file);
                    fd.set("slug", slug);
                    const up = await fetch("/api/admin/media/upload", { method: "POST", body: fd });
                    const upData = await up.json();
                    if (!up.ok) throw new Error(upData?.error || "Upload failed");

                    const res = await fetch(`/api/admin/products/${id}/images`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        url: upData.url,
                        alt: uploadAlt || null,
                        is_primary: primaryAssigned ? false : idx === 0,
                        color: uploadColor || null,
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data?.error || "Failed to save image");
                    if (!primaryAssigned && (idx === 0 || data?.is_primary)) {
                      primaryAssigned = true;
                    }
                  }
                  setUploadAlt("");
                  setUploadColor("");
                  formEl.reset();
                  await refreshImages();
                } catch (err: unknown) {
                  const message = err instanceof Error ? err.message : "Unexpected error";
                  setImgError(message);
                } finally {
                  setUploading(false);
                      }
                    }}
                    className="space-y-3"
                  >
                    {imgError && <div className="text-sm text-red-600 dark:text-red-400">{imgError}</div>}
                    <label className="flex flex-col gap-1 text-sm">
                      <span>Upload image(s) (JPG/PNG/WebP ≤ 5MB)</span>
                      <input name="file" type="file" accept="image/*" multiple className="text-sm" />
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      <span>Color (optional)</span>
                      <input value={uploadColor} onChange={(e)=>setUploadColor(e.target.value)} placeholder="e.g., grey" className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent" />
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      <span>Alt text</span>
                      <input value={uploadAlt} onChange={(e) => setUploadAlt(e.target.value)} className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent" />
                    </label>
                    <button disabled={uploading} className="h-9 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm" type="submit">
                      {uploading ? "Uploading…" : "Upload"}
                    </button>
                  </form>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm opacity-80">Existing</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs opacity-70">Filter:</span>
                      <input value={imageColorFilter} onChange={(e)=>setImageColorFilter(e.target.value)} onBlur={()=>refreshImages()} placeholder="color" className="h-8 px-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm w-28" />
                      <button type="button" className="h-8 px-2 rounded-md border border-black/10 dark:border-white/10 text-xs" onClick={()=>{ setImageColorFilter(''); refreshImages(); }}>Clear</button>
                    </div>
                  </div>
                  {imgLoading ? (
                    <div className="text-sm opacity-70">Loading…</div>
                  ) : images.length === 0 ? (
                    <div className="text-sm opacity-70">No images yet</div>
                  ) : (
                    <ul className="grid grid-cols-2 gap-3">
                      {images.map((im) => (
                        <li key={im.id} className="rounded border border-black/10 dark:border-white/10 overflow-hidden">
                          <div className="aspect-square bg-black/5 dark:bg-white/10">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={im.url} alt={im.alt || ""} className="w-full h-full object-cover" />
                          </div>
                          <div className="p-2 space-y-1">
                            <div className="text-xs truncate" title={im.alt || undefined}>{im.alt || <span className="opacity-60">(no alt)</span>}</div>
                            <div className="text-[11px] opacity-70">Color: {im.color || '—'}</div>
                            <div className="flex items-center gap-2">
                              {!im.is_primary ? (
                                <button
                                  className="h-7 px-2 rounded-md border border-black/10 dark:border-white/10 text-xs"
                                  onClick={async () => {
                                    setImgError(null);
                                    try {
                                      const res = await fetch(`/api/admin/products/${id}/images/${im.id}`, {
                                        method: "PATCH",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ is_primary: true }),
                                      });
                                      const data = await res.json();
                                      if (!res.ok) throw new Error(data?.error || "Failed to set primary");
                                      setPrimaryImage(im.url);
                                      await refreshImages();
                                  } catch (err: unknown) {
                                      const message = err instanceof Error ? err.message : "Unexpected error";
                                      setImgError(message);
                                  }
                                  }}
                                >
                                  Set primary
                                </button>
                              ) : (
                                <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-100">Primary</span>
                              )}
                              <div className="text-[11px] opacity-70">Color: {im.color || '—'}</div>
                              <button
                                className="h-7 px-2 rounded-md border border-black/10 dark:border-white/10 text-xs"
                                onClick={async () => {
                                  const val = prompt('Set color for this image (leave blank to clear):', im.color || '');
                                  if (val === null) return;
                                  try {
                                    const res = await fetch(`/api/admin/products/${id}/images/${im.id}`, { method:'PATCH', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ color: val || null }) });
                                    const data = await res.json();
                                    if (!res.ok) throw new Error(data?.error || 'Failed to set color');
                                    await refreshImages();
                                  } catch(err: unknown) {
                                    const message = err instanceof Error ? err.message : 'Unexpected error';
                                    setImgError(message);
                                  }
                                }}
                              >
                                Set color
                              </button>
                              <button
                                className="h-7 px-2 rounded-md border border-black/10 dark:border-white/10 text-xs"
                                onClick={async () => {
                                  setImgError(null);
                                  try {
                                    const res = await fetch(`/api/admin/products/${id}/images/${im.id}`, { method: "DELETE" });
                                    const data = await res.json();
                                    if (!res.ok) throw new Error(data?.error || "Failed to delete");
                                    await refreshImages();
                                  } catch (err: unknown) {
                                    const message = err instanceof Error ? err.message : "Unexpected error";
                                    setImgError(message);
                                  }
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Apparel Variants */}
          {item && item.category === 'apparel' && (
            <div className="mt-6 rounded-lg border border-black/10 dark:border-white/10 p-4">
              <div className="text-lg font-semibold mb-1">Apparel Variants</div>
              <div className="text-xs opacity-70 mb-3">Generate color × size combinations, then save. You can edit or remove variants anytime.</div>
              {variantsError && <div className="text-sm text-red-600 dark:text-red-400 mb-2">{variantsError}</div>}
              {/* Color and size multi-selects */}
              <div className="grid md:grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-sm font-medium mb-1">Colors</div>
                  <div className="flex flex-wrap gap-2">
                    {defaultColors.map((c) => {
                      const active = selectedColors.includes(c);
                      return (
                        <button key={c} type="button" onClick={() => setSelectedColors((prev) => active ? prev.filter(x=>x!==c) : [...prev, c])} className={`h-8 px-3 rounded-md border text-xs ${active ? 'border-emerald-500 text-emerald-700 dark:text-emerald-300' : 'border-black/10 dark:border-white/10'}`}>{c}</button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Sizes</div>
                  <div className="flex flex-wrap gap-2">
                    {defaultSizes.map((s) => {
                      const active = selectedSizes.includes(s);
                      return (
                        <button key={s} type="button" onClick={() => setSelectedSizes((prev) => active ? prev.filter(x=>x!==s) : [...prev, s])} className={`h-8 px-3 rounded-md border text-xs ${active ? 'border-emerald-500 text-emerald-700 dark:text-emerald-300' : 'border-black/10 dark:border-white/10'}`}>{s}</button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <button type="button" className="h-8 px-3 rounded-md border border-black/10 dark:border-white/10 text-sm" onClick={generateVariants}>Generate combinations</button>
                <span className="text-xs opacity-70">Creates rows below; edit then Save variants.</span>
              </div>
              {variants.length > 0 && (
                <div className="rounded border border-black/10 dark:border-white/10 overflow-x-auto mb-3">
                  <table className="w-full text-sm">
                    <thead className="bg-black/5 dark:bg-white/10">
                      <tr>
                        <th className="px-2 py-1 text-left">Include</th>
                        <th className="px-2 py-1 text-left">Color</th>
                        <th className="px-2 py-1 text-left">Size</th>
                        <th className="px-2 py-1 text-left">SKU</th>
                        <th className="px-2 py-1 text-left">Price override</th>
                        <th className="px-2 py-1 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {variants.map((v, idx) => (
                        <tr key={`${v.color}-${v.size}-${idx}`} className="border-t border-black/10 dark:border-white/10">
                          <td className="px-2 py-1"><input type="checkbox" checked={v.include} onChange={(e)=>updateVariant(idx,{ include: e.target.checked })} /></td>
                          <td className="px-2 py-1"><input value={v.color} onChange={(e)=>updateVariant(idx,{ color: e.target.value })} className="h-8 px-2 rounded border border-black/10 dark:border-white/10 bg-transparent" /></td>
                          <td className="px-2 py-1"><input value={v.size} onChange={(e)=>updateVariant(idx,{ size: e.target.value.toUpperCase() })} className="h-8 px-2 rounded border border-black/10 dark:border-white/10 bg-transparent w-16" /></td>
                          <td className="px-2 py-1"><input value={v.sku} onChange={(e)=>updateVariant(idx,{ sku: e.target.value })} className="h-8 px-2 rounded border border-black/10 dark:border-white/10 bg-transparent" /></td>
                          <td className="px-2 py-1"><input value={v.price_cents_override ?? ''} onChange={(e)=>updateVariant(idx,{ price_cents_override: e.target.value })} placeholder="$0.00" className="h-8 px-2 rounded border border-black/10 dark:border-white/10 bg-transparent w-28" /></td>
                          <td className="px-2 py-1">
                            <select value={v.status} onChange={(e)=>updateVariant(idx,{ status: e.target.value as 'draft' | 'published' })} className="h-8 px-2 rounded border border-black/10 dark:border-white/10 bg-transparent">
                              <option value="draft">Draft</option>
                              <option value="published">Published</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {variants.length > 0 && (
                <div className="flex items-center justify-end mb-4">
                  <button type="button" className="h-9 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm" onClick={saveVariants}>Save variants</button>
                </div>
              )}

              <div className="text-sm font-medium mb-1">Existing variants</div>
              {variantsLoading ? (
                <div className="text-sm opacity-70">Loading…</div>
              ) : existingVariants.length === 0 ? (
                <div className="text-sm opacity-70">No variants yet</div>
              ) : (
                <div className="rounded border border-black/10 dark:border-white/10 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-black/5 dark:bg-white/10">
                      <tr>
                        <th className="px-2 py-1 text-left">Color</th>
                        <th className="px-2 py-1 text-left">Size</th>
                        <th className="px-2 py-1 text-left">SKU</th>
                        <th className="px-2 py-1 text-left">Price</th>
                        <th className="px-2 py-1 text-left">Status</th>
                        <th className="px-2 py-1 text-left">Updated</th>
                        <th className="px-2 py-1 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {existingVariants.map((ev) => (
                        <tr key={ev.id} className="border-t border-black/10 dark:border-white/10">
                          <td className="px-2 py-1">{ev.color}</td>
                          <td className="px-2 py-1">{ev.size}</td>
                          <td className="px-2 py-1">{ev.sku || '—'}</td>
                          <td className="px-2 py-1">{ev.price_cents_override != null ? `$${(ev.price_cents_override/100).toFixed(2)}` : '—'}</td>
                          <td className="px-2 py-1 capitalize">{ev.status}</td>
                          <td className="px-2 py-1 whitespace-nowrap">{new Date(ev.updated_at).toLocaleString()}</td>
                          <td className="px-2 py-1">
                            <button className="h-7 px-2 rounded-md border border-black/10 dark:border-white/10 text-xs mr-2" onClick={async()=>{
                              try { await fetch(`/api/admin/products/${id}/variants/${ev.id}`, { method:'PATCH', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ status: ev.status === 'published' ? 'draft' : 'published' })}); await refreshVariants(); } catch {}
                            }}>{ev.status==='published'?'Unpublish':'Publish'}</button>
                            <button className="h-7 px-2 rounded-md border border-black/10 dark:border-white/10 text-xs" onClick={async()=>{
                              if (!confirm('Delete this variant?')) return;
                              try { await fetch(`/api/admin/products/${id}/variants/${ev.id}`, { method:'DELETE' }); await refreshVariants(); } catch {}
                            }}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* SEO overrides */}
          {item && (
            <div className="mt-6 rounded-lg border border-black/10 dark:border-white/10 p-4">
              <div className="text-lg font-semibold mb-1">SEO Overrides</div>
              <div className="text-xs opacity-70 mb-3">Optional. If left blank, global defaults will be used.</div>
              {seoError && <div className="text-sm text-red-600 dark:text-red-400">{seoError}</div>}
              <div className="grid md:grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-sm">
                  <span>SEO Title</span>
                  <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent" />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span>Canonical URL</span>
                  <input value={canonicalUrl} onChange={(e) => setCanonicalUrl(e.target.value)} placeholder="https://berner-studio.com/products/..." className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent" />
                </label>
              </div>
              <label className="flex flex-col gap-1 text-sm mt-3">
                <span>SEO Description</span>
                <textarea value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} rows={4} className="px-3 py-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent" />
              </label>
              <label className="flex flex-col gap-1 text-sm mt-3">
                <span>OpenGraph Image URL</span>
                <input value={ogImageUrl} onChange={(e) => setOgImageUrl(e.target.value)} placeholder="https://…" className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent" />
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
                      const res = await fetch(`/api/admin/products/${id}/seo`, {
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
                  {seoSaving ? "Saving…" : "Save SEO"}
                </button>
              </div>
            </div>
          )}
        </AdminGuard>
      </div>
    </main>
  );
}
