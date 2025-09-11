"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Image from "next/image";
import { formatCurrencyCents } from "@/lib/money";

type Item = { slug: string; name: string; price_cents: number; primary_image_url: string | null };
type ProductRow = { slug: string; name: string; price_cents: number; primary_image_url: string | null };

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
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<'newest'|'price-asc'|'price-desc'>(
    (params?.get('sort') as any) || 'newest'
  );
  const [page, setPage] = useState<number>(Number(params?.get('page') || 1) || 1);
  const pageSize = 12;
  const [total, setTotal] = useState<number | null>(null);
  const [category, setCategory] = useState<''|'boards'|'bottle-openers'|'apparel'>(
    ((params?.get('category') as any) || '') as any
  );
  const [collection, setCollection] = useState<string>((params?.get('collection') as any) || '');
  const [boardCollections, setBoardCollections] = useState<string[]>([]);

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        // Build base query with count for pagination
        let query = supabase
          .from("products")
          .select("slug,name,price_cents,primary_image_url,status,deleted_at", { count: 'exact' })
          .eq("status", "published")
          .is("deleted_at", null);
        if (category) query = query.eq('category', category);
        if (category === 'boards' && collection) {
          query = query.contains('tags', [collection]);
        }
        if (sort === 'newest') query = query.order('updated_at', { ascending: false });
        if (sort === 'price-asc') query = query.order('price_cents', { ascending: true });
        if (sort === 'price-desc') query = query.order('price_cents', { ascending: false });
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        const { data, error, count } = await query.range(from, to);
        if (!aborted && !error) {
          const rows = ((data as unknown) as ProductRow[]) || [];
          setItems(
            rows.map((p) => ({
              slug: p.slug,
              name: p.name,
              price_cents: p.price_cents,
              primary_image_url: p.primary_image_url,
            }))
          );
          setTotal(typeof count === 'number' ? count : null);
        }
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => { aborted = true; };
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
    if (category !== 'boards') { setBoardCollections([]); return; }
    (async () => {
      try {
        const { data: secs } = await supabase
          .from('home_sections')
          .select('id,category')
          .eq('category','boards');
        const ids = (secs || []).map((s: any)=> s.id);
        if (!ids.length) { setBoardCollections(['purist','classics']); return; }
        const { data: cols } = await supabase
          .from('home_section_collections')
          .select('section_id,label,position')
          .in('section_id', ids)
          .order('position', { ascending: true });
        const labels = Array.from(new Set(((cols||[]) as any[]).map(c=> (c.label as string).toLowerCase())));
        setBoardCollections(labels.length ? labels : ['purist','classics']);
      } catch {
        setBoardCollections(['purist','classics']);
      }
    })();
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
              onChange={(e) => { setPage(1); setSort(e.target.value as any); }}
              className="h-9 px-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent"
            >
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Category filters */}
        <div className="mb-4 flex items-center gap-2 text-sm">
          <button type="button" onClick={()=>{ setPage(1); setCategory(''); setCollection(''); }} className={`h-9 px-3 rounded-md border ${category===''? 'border-emerald-500 text-emerald-700 dark:text-emerald-300':'border-black/10 dark:border-white/10'}`}>All</button>
          <button type="button" onClick={()=>{ setPage(1); setCategory('boards'); setCollection(''); }} className={`h-9 px-3 rounded-md border ${category==='boards'? 'border-emerald-500 text-emerald-700 dark:text-emerald-300':'border-black/10 dark:border-white/10'}`}>Boards</button>
          <button type="button" onClick={()=>{ setPage(1); setCategory('bottle-openers'); setCollection(''); }} className={`h-9 px-3 rounded-md border ${category==='bottle-openers'? 'border-emerald-500 text-emerald-700 dark:text-emerald-300':'border-black/10 dark:border-white/10'}`}>Bottle Openers</button>
          <button type="button" onClick={()=>{ setPage(1); setCategory('apparel'); setCollection(''); }} className={`h-9 px-3 rounded-md border ${category==='apparel'? 'border-emerald-500 text-emerald-700 dark:text-emerald-300':'border-black/10 dark:border-white/10'}`}>Apparel</button>
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
                <div key={p.slug} className="rounded-lg border border-black/10 dark:border-white/10 overflow-hidden">
                  <div className="relative h-40 bg-gradient-to-br from-black/5 to-black/10 dark:from-white/5 dark:to-white/10 flex items-center justify-center" aria-hidden>
                    {p.primary_image_url ? (
                      <Image src={p.primary_image_url} alt={p.name} fill sizes="(max-width: 768px) 50vw, 33vw" className="object-cover" unoptimized />
                    ) : (
                      <span className="text-xs opacity-70">Image coming soon</span>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    <div className="text-xs opacity-70">{formatCurrencyCents(p.price_cents)}</div>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => router.push(`/products/${p.slug}`)}
                        className="inline-flex h-8 px-3 rounded-md border border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => router.push(`/products/${p.slug}`)}
                        className="inline-flex h-8 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        Add to cart
                      </button>
                    </div>
                  </div>
                </div>
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
