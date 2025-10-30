"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminGuard from "@/app/admin/AdminGuard";
import CategoryManager, { type CategoryRecord } from "@/app/admin/cms/products/CategoryManager";
import ProductFormSection from "../[id]/components/ProductFormSection";
import type { CollectionOption, TemplateOption } from "../[id]/types";

type PendingImage = { file: File; url: string };

const slugify = (input: string) =>
  (input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [collectionsByCategory, setCollectionsByCategory] = useState<Record<string, CollectionOption[]>>({});
  const [templateOptions, setTemplateOptions] = useState<TemplateOption[]>([]);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [price, setPrice] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft");
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productTemplateId, setProductTemplateId] = useState<string>("");

  const [imgAlt, setImgAlt] = useState("");
  const [selectedImages, setSelectedImages] = useState<PendingImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const selectedImagesRef = useRef<PendingImage[]>([]);

  const refreshCategories = useCallback(async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to load categories");
      const items: CategoryRecord[] = Array.isArray(data?.items) ? data.items : [];
      setCategories(items);
      setCategory((prev) => {
        if (prev && items.some((entry) => entry.slug === prev)) return prev;
        return items[0]?.slug ?? "";
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load categories";
      setCategoriesError(message);
      setCategories([]);
      setCategory("");
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const updateFileInputFiles = (items: PendingImage[]) => {
    if (!fileInputRef.current) return;
    const dt = new DataTransfer();
    items.forEach(({ file }) => dt.items.add(file));
    fileInputRef.current.files = dt.files;
    if (!items.length) {
      fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    selectedImagesRef.current = selectedImages;
  }, [selectedImages]);

  useEffect(() => {
    return () => {
      selectedImagesRef.current.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, []);

  useEffect(() => {
    refreshCategories();
  }, [refreshCategories]);

  const refreshCollections = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/home-sections");
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load sections");
      const map: Record<string, CollectionOption[]> = {};
      for (const section of json.items || []) {
        const sectionCategory =
          typeof section?.category === "string" && section.category.trim().length ? section.category : null;
        if (!sectionCategory) continue;
        const list = map[sectionCategory] || (map[sectionCategory] = []);
        for (const collection of section.collections || []) {
          const label =
            typeof collection?.label === "string" && collection.label.trim().length ? collection.label : null;
          if (!label) continue;
          const key = label.toLowerCase();
          if (list.some((entry) => entry.label.toLowerCase() === key)) continue;
          list.push({
            id: collection.id ?? `${section.id}-${label}`,
            label,
            href: collection.href ?? null,
          });
        }
      }
      setCollectionsByCategory(map);
    } catch {
      setCollectionsByCategory({});
    }
  }, []);

  useEffect(() => {
    refreshCollections();
  }, [refreshCollections]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/product-templates");
        const data = await res.json();
        if (!active) return;
        if (res.ok && Array.isArray(data?.items)) {
          const templates = data.items.filter(
            (entry: unknown): entry is TemplateOption =>
              entry != null &&
              typeof entry === "object" &&
              typeof (entry as { id?: unknown }).id === "string" &&
              typeof (entry as { name?: unknown }).name === "string"
          );
          setTemplateOptions(templates.map((template: TemplateOption) => ({ id: template.id, name: template.name })));
        } else {
          setTemplateOptions([]);
        }
      } catch {
        if (!active) return;
        setTemplateOptions([]);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (category !== "boards") {
      setProductTemplateId("");
    }
  }, [category]);

  const addTag = (raw: string) => {
    const value = raw.trim();
    if (!value) return;
    setTags((prev) => {
      if (prev.some((tag) => tag.toLowerCase() === value.toLowerCase())) return prev;
      return [...prev, value];
    });
  };

  const removeTag = (tag: string) => {
    const target = tag.toLowerCase();
    setTags((prev) => prev.filter((item) => item.toLowerCase() !== target));
  };

  useEffect(() => {
    if (!category) return;
    const allowed = new Set((collectionsByCategory[category] || []).map((entry) => entry.label.toLowerCase()));
    const known = new Set<string>();
    for (const list of Object.values(collectionsByCategory)) {
      for (const entry of list) known.add(entry.label.toLowerCase());
    }
    if (!known.size) return;
    setTags((prev) =>
      prev.filter((tag) => {
        const lower = tag.toLowerCase();
        if (!known.has(lower)) return true;
        return allowed.has(lower);
      })
    );
  }, [category, collectionsByCategory]);

  const handleManageCategories = () => {
    setCategoryManagerOpen(true);
  };

  const hasTag = (tag: string) => tags.some((item) => item.toLowerCase() === tag.toLowerCase());

  const currentCollections = useMemo(
    () => (category ? collectionsByCategory[category] || [] : []),
    [category, collectionsByCategory]
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!category) {
      setError("Choose a category before creating the product.");
      return;
    }

    setSubmitting(true);
    const price_cents = Math.round(Number(price || 0) * 100);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          price_cents,
          category,
          long_desc: description,
          status,
          collection: currentCollections.map((c) => c.label).find((label) => hasTag(label)) || undefined,
          tags,
          ...(category === "boards" ? { product_template_id: productTemplateId || undefined } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create product");
      const id = data?.id as string | undefined;
      const createdSlug =
        (data?.slug as string | undefined) ||
        slug ||
        slugify(name);

      const pickedFiles = selectedImages.map((item) => item.file);
      if (id && pickedFiles.length) {
        try {
          for (let idx = 0; idx < pickedFiles.length; idx += 1) {
            const file = pickedFiles[idx]!;
            const fd = new FormData();
            fd.set("file", file);
            fd.set("slug", createdSlug || `product-${Date.now()}`);
            const uploadRes = await fetch("/api/admin/media/upload", { method: "POST", body: fd });
            const uploadData = await uploadRes.json();
            if (!uploadRes.ok) throw new Error(uploadData?.error || "Upload failed");

            const imgRes = await fetch(`/api/admin/products/${id}/images`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url: uploadData.url, alt: imgAlt, is_primary: idx === 0 }),
            });
            const imgJson = await imgRes.json();
            if (!imgRes.ok) throw new Error(imgJson?.error || "Failed to save image");
          }
        } catch (imageError) {
          console.warn("One or more image uploads failed", imageError);
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
    <>
      <main className="min-h-screen w-full p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-semibold">New Product</h1>
            <div className="flex items-center gap-3 text-sm">
              <Link href="/admin" className="underline">
                Admin Dashboard
              </Link>
              <Link href="/admin/cms" className="underline">
                CMS Home
              </Link>
            </div>
          </div>
          <AdminGuard>
            <div className="mb-4">
              <Link href="/admin/cms/products" className="text-sm underline">
                Back to Products
              </Link>
            </div>

            <ProductFormSection
              name={name}
              slug={slug}
              price={price}
              category={category}
              status={status}
              description={description}
              tags={tags}
              productTemplateId={productTemplateId}
              templateOptions={templateOptions}
              categories={categories}
              categoriesLoading={categoriesLoading}
              categoriesError={categoriesError}
              currentCollections={currentCollections}
              saving={submitting}
              canSave={Boolean(category)}
              onSubmit={handleSubmit}
              onNameChange={(value) => {
                setName(value);
                if (!slugEdited) setSlug(slugify(value));
              }}
              onSlugChange={(value) => {
                setSlugEdited(true);
                setSlug(value);
              }}
              onPriceChange={setPrice}
              onCategoryChange={setCategory}
              onManageCategories={handleManageCategories}
              onStatusChange={(value) => setStatus(value)}
              onDescriptionChange={setDescription}
              onAddTag={addTag}
              onRemoveTag={removeTag}
              hasTag={hasTag}
              showTemplateSelector={category === "boards"}
              onTemplateChange={setProductTemplateId}
            />

            <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 space-y-4 mt-4">
              {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}
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
                    onChange={(event) => {
                      selectedImagesRef.current.forEach((item) => URL.revokeObjectURL(item.url));
                      const files = event.target.files ? Array.from(event.target.files) : [];
                      const mapped = files.map((file) => ({ file, url: URL.createObjectURL(file) }));
                      setSelectedImages(mapped);
                      updateFileInputFiles(mapped);
                    }}
                  />
                  <span className="text-[11px] opacity-70">JPG/PNG/WebP up to 5MB each</span>
                  {selectedImages.length > 0 && (
                    <div className="mt-2 grid grid-cols-5 gap-2">
                      {selectedImages.map((item, idx) => (
                        <div key={item.url} className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.url}
                            alt={`Preview ${idx + 1}`}
                            className="h-16 w-16 object-cover rounded border border-black/10 dark:border-white/10"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedImages((prev) => {
                                const next = prev.filter((_, index) => index !== idx);
                                const removed = prev[idx];
                                if (removed) URL.revokeObjectURL(removed.url);
                                updateFileInputFiles(next);
                                return next;
                              });
                            }}
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-black/80 text-white text-xs flex items-center justify-center"
                            aria-label={`Remove preview ${idx + 1}`}
                          >
                            x
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          selectedImagesRef.current.forEach((item) => URL.revokeObjectURL(item.url));
                          setSelectedImages([]);
                          updateFileInputFiles([]);
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
                  <input
                    value={imgAlt}
                    onChange={(event) => setImgAlt(event.target.value)}
                    className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent"
                  />
                </label>
              </div>
            </div>
          </AdminGuard>
        </div>
      </main>
      <CategoryManager
        open={categoryManagerOpen}
        onClose={() => setCategoryManagerOpen(false)}
        categories={categories}
        refreshCategories={refreshCategories}
        onCategoryCreated={(cat) => {
          setCategory(cat.slug);
          refreshCollections();
        }}
        onCategoryRenamed={(cat, previousSlug) => {
          setCategory((prev) => (prev && prev === previousSlug ? cat.slug : prev));
          refreshCollections();
        }}
      />
    </>
  );
}
