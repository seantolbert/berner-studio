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
  const [category, setCategory] = useState(CATEGORIES[0].value);
  const [shortDesc, setShortDesc] = useState("");
  const [longDesc, setLongDesc] = useState("");
  const [status, setStatus] = useState("draft");
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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const price_cents = Math.round(Number(price || 0) * 100);
    try {
      const form = e.currentTarget as HTMLFormElement;
      const fileInput = (form.elements.namedItem("files") as HTMLInputElement) || null;
      const list = fileInput?.files;
      const pickedFiles = list && list.length ? Array.from(list) : [];

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, price_cents, category, short_desc: shortDesc, long_desc: longDesc, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create product");
      const id = data?.id as string | undefined;
      const createdSlug = (data?.slug as string | undefined) || slug || name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

      // If an image was selected, upload and attach as primary
      if (id && pickedFiles.length) {
        try {
          for (let i = 0; i < pickedFiles.length; i++) {
            const file = pickedFiles[i];
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
            </div>

            <label className="flex flex-col gap-1 text-sm">
              <span>Short description</span>
              <input value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent" />
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
