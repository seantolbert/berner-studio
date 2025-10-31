"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { formatCurrencyCents } from "@/lib/money";
import {
  fetchProductSummaries,
  fetchBoardCollections,
} from "@/services/productsClient";
import type { ProductSummary, ProductCategory, ProductSort } from "@/types/product";
import { useProductCategories } from "@/app/hooks/useProductCategories";

function parseSort(value: string | null): ProductSort {
  if (value === "price-asc" || value === "price-desc" || value === "newest") return value;
  return "newest";
}

function parseCategory(value: string | null): ProductCategory {
  if (!value) return "";
  return value;
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<main className="min-h-screen w-full p-6">Loading…</main>}>
      <ProductsContent />
    </Suspense>
  );
}

function ProductsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();
  const [items, setItems] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<ProductSort>(parseSort(params?.get("sort")));
  const [page, setPage] = useState<number>(Number(params?.get("page") || 1) || 1);
  const pageSize = 12;
  const [total, setTotal] = useState<number | null>(null);
  const [category, setCategory] = useState<ProductCategory>(
    parseCategory(params?.get("category"))
  );
  const [collection, setCollection] = useState<string>(params?.get("collection") || "");
  const [boardCollections, setBoardCollections] = useState<string[]>([]);
  const { categories: categoryOptions } = useProductCategories();
  const fallbackCategoryOptions = [
    { id: "boards", name: "Boards", slug: "boards" },
    { id: "bottle-openers", name: "Bottle Openers", slug: "bottle-openers" },
    { id: "apparel", name: "Apparel", slug: "apparel" },
  ];
  const displayCategories = categoryOptions.length ? categoryOptions : fallbackCategoryOptions;

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchProductSummaries({ sort, page, pageSize, category, collection })
      .then(({ items, total }) => {
        if (!active) return;
        setItems(items);
        setTotal(total);
      })
      .catch(() => {
        if (!active) return;
        setItems([]);
        setTotal(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [sort, page, category, collection]);

  // Keep filters in the URL (no full reload)
  useEffect(() => {
    const sp = new URLSearchParams();
    if (sort && sort !== 'newest') sp.set('sort', sort);
    if (page && page !== 1) sp.set('page', String(page));
    if (category) sp.set('category', category);
    if (category === 'boards' && collection) sp.set('collection', collection);
    const next = sp.toString();
    const current = params?.toString() || '';
    if (next !== current) {
      const url = next ? `${pathname}?${next}` : pathname;
      router.replace(url);
    }
  }, [sort, page, category, collection, pathname, params, router]);

  // Load board collections (labels) from admin-defined Home sections with category 'boards'
  useEffect(() => {
    if (category !== "boards") {
      setBoardCollections([]);
      return;
    }
    let active = true;
    fetchBoardCollections()
      .then((labels) => {
        if (!active) return;
        setBoardCollections(labels.length ? labels : ["purist", "classics"]);
      })
      .catch(() => {
        if (!active) return;
        setBoardCollections(["purist", "classics"]);
      });
    return () => {
      active = false;
    };
  }, [category]);

  return (
    <main className="min-h-screen w-full p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-semibold">All Products</h1>
          <div className="flex items-center gap-2 text-sm">
            <span className="opacity-70">Sort:</span>
            <select
              value={sort}
              onChange={(event) => {
                setPage(1);
                setSort(parseSort(event.target.value));
              }}
              className="h-9 px-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent"
            >
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Category filters */}
        <div className="mb-4 flex items-center gap-2 text-sm flex-wrap">
          <button
            type="button"
            onClick={() => {
              setPage(1);
              setCategory("");
              setCollection("");
            }}
            className={`h-9 px-3 rounded-md border ${category === "" ? "border-emerald-500 text-emerald-700 dark:text-emerald-300" : "border-black/10 dark:border-white/10"}`}
          >
            All
          </button>
          {displayCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setPage(1);
                setCategory(cat.slug as ProductCategory);
                setCollection("");
              }}
              className={`h-9 px-3 rounded-md border ${category === cat.slug ? "border-emerald-500 text-emerald-700 dark:text-emerald-300" : "border-black/10 dark:border-white/10"}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Board collections when Boards is selected */}
        {category === 'boards' && (
          <div className="mb-4 flex items-center gap-2 text-sm">
            {boardCollections.map((lbl) => (
              <button
                key={lbl}
                type="button"
                onClick={()=>{ setPage(1); setCollection(collection===lbl? '': lbl); }}
                className={`h-9 px-3 rounded-md border ${collection===lbl? 'border-emerald-500 text-emerald-700 dark:text-emerald-300':'border-black/10 dark:border-white/10'}`}
              >
                {lbl.charAt(0).toUpperCase()+lbl.slice(1)}
              </button>
            ))}
            <button type="button" onClick={()=>{ setPage(1); setCollection(''); }} className={`h-9 px-3 rounded-md border ${collection===''? 'border-emerald-500 text-emerald-700 dark:text-emerald-300':'border-black/10 dark:border-white/10'}`}>All</button>
          </div>
        )}
        {loading ? (
          <div className="text-sm opacity-70">Loading…</div>
        ) : items.length === 0 ? (
          <div className="text-sm opacity-70">No products available.</div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {items.map((p) => (
                <Link
                  key={p.slug}
                  href={`/products/${p.slug}`}
                  className="group block rounded-lg border border-black/10 dark:border-white/10 overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <div className="relative h-40 bg-gradient-to-br from-black/5 to-black/10 dark:from-white/5 dark:to-white/10 flex items-center justify-center" aria-hidden>
                    {p.primary_image_url ? (
                      <Image
                        src={p.primary_image_url}
                        alt={p.name}
                        fill
                        sizes="(max-width: 768px) 50vw, 33vw"
                        className="object-cover transition duration-200 group-hover:scale-[1.02]"
                        unoptimized
                      />
                    ) : (
                      <span className="text-xs opacity-70">Image coming soon</span>
                    )}
                  </div>
                  <div className="p-3">
                    {p.card_label ? (
                      <div className="text-[11px] uppercase tracking-wide font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                        {p.card_label}
                      </div>
                    ) : null}
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    <div className="text-xs opacity-70">{formatCurrencyCents(p.price_cents)}</div>
                  </div>
                </Link>
              ))}
            </div>
            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <button type="button" disabled={page<=1} onClick={()=>setPage((p)=>Math.max(1,p-1))} className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 text-sm disabled:opacity-50">Prev</button>
              <div className="text-sm opacity-70">Page {page}{total!=null? ` of ${Math.max(1, Math.ceil(total/pageSize))}`: ''}</div>
              <button type="button" disabled={total!=null ? page>=Math.ceil(total/pageSize) : items.length<pageSize} onClick={()=>setPage((p)=>p+1)} className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 text-sm disabled:opacity-50">Next</button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
