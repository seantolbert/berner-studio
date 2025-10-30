"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import AdminGuard from "@/app/admin/AdminGuard";
import CategoryManager, { type CategoryRecord } from "@/app/admin/cms/products/CategoryManager";
import ProductFormSection from "./components/ProductFormSection";
import ImagesPanel from "./components/ImagesPanel";
import VariantsPanel from "./components/VariantsPanel";
import SeoOverridesPanel from "./components/SeoOverridesPanel";
import type { CollectionOption } from "./types";

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

  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [collectionsByCategory, setCollectionsByCategory] = useState<Record<string, CollectionOption[]>>({});

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [price, setPrice] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft");
  const [primaryImage, setPrimaryImage] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [productTemplateId, setProductTemplateId] = useState<string | "" | null>(null);
  const [templateOptions, setTemplateOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
    setTags((prev) => prev.filter((itemTag) => itemTag.toLowerCase() !== target));
  };

  const handleManageCategories = () => setCategoryManagerOpen(true);

  const hasTag = (tag: string) => tags.some((itemTag) => itemTag.toLowerCase() === tag.toLowerCase());

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/products/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load product");
        if (aborted) return;
        const product = data.item as Product;
        setItem(product);
        setName(product.name);
        setSlug(product.slug);
        setPrice((product.price_cents / 100).toFixed(2));
        setCategory(product.category);
        setDescription(product.long_desc || "");
        setStatus(product.status);
        setPrimaryImage(product.primary_image_url || "");
        setTags(Array.isArray(product.tags) ? product.tags.map((t) => String(t)) : []);
        setProductTemplateId(product.product_template_id || "");
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
  }, [id]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/admin/product-templates`);
        const data = await res.json();
        if (!mounted) return;
        if (res.ok) {
          const templates: Array<{ id: string; name: string }> = Array.isArray(data.items)
            ? data.items.filter((entry: unknown): entry is { id: string; name: string } => {
                if (!entry || typeof entry !== "object") return false;
                const candidate = entry as { id?: unknown; name?: unknown };
                return typeof candidate.id === "string" && typeof candidate.name === "string";
              })
            : [];
          setTemplateOptions(templates.map((template) => ({ id: template.id, name: template.name })));
        }
      } catch (err) {
        console.error(err);
      }
    })();
    return () => {
      mounted = false;
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

  const onSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!category) {
      setError("Choose a category before saving.");
      return;
    }
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
          long_desc: description,
          status,
          primary_image_url: primaryImage || null,
          tags,
          product_template_id: productTemplateId ? productTemplateId : null,
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

  const onArchive = async () => {
    if (!confirm("Archive this product?")) return;
    setArchiving(true);
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
      setArchiving(false);
    }
  };

  const onDelete = async () => {
    if (!confirm("Permanently delete this product? This cannot be undone.")) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/products/${id}?hard=true`, { method: "DELETE" });
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

  const currentCollections = category ? collectionsByCategory[category] || [] : [];

  return (
    <>
      <main className="min-h-screen w-full p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-semibold">Edit Product</h1>
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
            <div className="mb-4 flex items-center justify-between">
              <Link href="/admin/cms/products" className="text-sm underline">
                Back to Products
              </Link>
              <div className="flex items-center gap-2">
                <button
                  onClick={onArchive}
                  disabled={archiving || deleting}
                  className="h-9 px-3 rounded-md border border-amber-300 text-amber-700 dark:text-amber-300 text-sm"
                >
                  {archiving ? "Archiving..." : "Archive"}
                </button>
                <button
                  onClick={onDelete}
                  disabled={archiving || deleting}
                  className="h-9 px-3 rounded-md border border-red-400 bg-red-50 text-red-700 dark:border-red-700/70 dark:bg-red-900/20 dark:text-red-200 text-sm"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>

            {loading ? (
              <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 text-sm opacity-70">Loading...</div>
            ) : error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-100 dark:border-red-700/50 p-4 text-sm">
                {error}
              </div>
            ) : item ? (
              <>
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
                  saving={saving}
                  canSave={Boolean(category)}
                  onSubmit={onSave}
                  onNameChange={(value) => setName(value)}
                  onSlugChange={(value) => setSlug(value)}
                  onPriceChange={(value) => setPrice(value)}
                  onCategoryChange={(value) => setCategory(value)}
                  onManageCategories={handleManageCategories}
                  onStatusChange={(value) => setStatus(value)}
                  onDescriptionChange={(value) => setDescription(value)}
                  onAddTag={addTag}
                  onRemoveTag={removeTag}
                  hasTag={hasTag}
                  showTemplateSelector={category === "boards"}
                  onTemplateChange={(value) => setProductTemplateId(value)}
                />
                <ImagesPanel productId={id} slug={slug} onPrimaryImageChange={setPrimaryImage} />
                {category === "apparel" ? <VariantsPanel productId={id} slug={slug} /> : null}
                <SeoOverridesPanel productId={id} primaryImage={primaryImage} />
              </>
            ) : null}
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
