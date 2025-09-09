"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { formatCurrencyCents } from "@/lib/money";
import Image from "next/image";
type HomeSettings = { boards_hero_title: string | null; boards_hero_subtitle: string | null };

type Item = { slug: string; name: string; price_cents: number; primary_image_url: string | null };
type ProductRow = { slug: string; name: string; price_cents: number; primary_image_url: string | null };

export default function BoardsPage() {
  return (
    <Suspense fallback={<main className="min-h-screen w-full p-6">Loading…</main>}>
      <BoardsPageContent />
    </Suspense>
  );
}

function BoardsPageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const initialCollection = (params?.get('collection') || '').toLowerCase();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const initial: 'all' | 'purist' | 'classics' =
    initialCollection === 'purist' || initialCollection === 'classics'
      ? (initialCollection as 'purist' | 'classics')
      : 'all';
  const [collection, setCollection] = useState<'all'|'purist'|'classics'>(initial);
  const [home, setHome] = useState<HomeSettings | null>(null);
  const [sort, setSort] = useState<'newest'|'price-asc'|'price-desc'>('newest');
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const { data: hs } = await supabase
          .from('homepage_settings')
          .select('boards_hero_title,boards_hero_subtitle')
          .maybeSingle();
        if (!aborted) setHome((hs as HomeSettings | null) || null);
        // Build base query with count for pagination
        let query = supabase
          .from("products")
          .select("slug,name,price_cents,primary_image_url,status,deleted_at,category,tags", { count: 'exact' })
          .eq("category", "boards")
          .eq("status", "published")
          .is("deleted_at", null)
          ;
        if (sort === 'newest') query = query.order('updated_at', { ascending: false });
        if (sort === 'price-asc') query = query.order('price_cents', { ascending: true });
        if (sort === 'price-desc') query = query.order('price_cents', { ascending: false });
        if (collection !== 'all') {
          // Filter by tags contains
          query = query.contains('tags', [collection]);
        }
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
    return () => {
      aborted = true;
    };
  }, [collection, sort, page]);

  return (
    <main className="min-h-screen w-full p-6">
      <div className="max-w-5xl mx-auto">
        {/* Hero */}
        <section className="rounded-xl border border-black/10 dark:border-white/10 p-6 mb-4">
          <h1 className="text-2xl font-semibold mb-2">{home?.boards_hero_title || 'Boards'}</h1>
          <p className="text-sm opacity-80 mb-4">{home?.boards_hero_subtitle || 'Explore our Purist and Classics collections, or design your own cutting board.'}</p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={()=>setCollection('purist')} className={`h-9 px-3 rounded-md border text-sm ${collection==='purist'?'border-emerald-500 text-emerald-700 dark:text-emerald-300':'border-black/10 dark:border-white/10'}`}>Purist</button>
            <button type="button" onClick={()=>setCollection('classics')} className={`h-9 px-3 rounded-md border text-sm ${collection==='classics'?'border-emerald-500 text-emerald-700 dark:text-emerald-300':'border-black/10 dark:border-white/10'}`}>Classics</button>
            <button type="button" onClick={()=>setCollection('all')} className={`h-9 px-3 rounded-md border text-sm ${collection==='all'?'border-emerald-500 text-emerald-700 dark:text-emerald-300':'border-black/10 dark:border-white/10'}`}>All</button>
            <div className="flex-1" />
            <button type="button" onClick={()=>router.push('/templates')} className="h-9 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm">Create your own</button>
          </div>
        </section>
        {loading ? (
          <div className="text-sm opacity-70">Loading…</div>
        ) : items.length === 0 ? (
          <div className="text-sm opacity-70">No boards available.</div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <div />
              <div className="flex items-center gap-2 text-sm">
                <span className="opacity-70">Sort:</span>
                <select value={sort} onChange={(e)=>{ setPage(1); setSort(e.target.value as 'newest'|'price-asc'|'price-desc'); }} className="h-9 px-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent">
                  <option value="newest">Newest</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>
            </div>
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
