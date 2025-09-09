"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { formatCurrencyCents } from "@/lib/money";

type Item = { slug: string; name: string; price_cents: number; primary_image_url: string | null };

export default function BottleOpenersPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("slug,name,price_cents,primary_image_url,status,deleted_at,category")
          .eq("category", "bottle-openers")
          .eq("status", "published")
          .is("deleted_at", null)
          .order("updated_at", { ascending: false })
          .limit(48);
        if (!aborted && !error) {
          setItems(
            (data || []).map((p: any) => ({
              slug: p.slug as string,
              name: p.name as string,
              price_cents: p.price_cents as number,
              primary_image_url: (p.primary_image_url as string) || null,
            }))
          );
        }
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => {
      aborted = true;
    };
  }, []);

  return (
    <main className="min-h-screen w-full p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Bottle Openers</h1>
        {loading ? (
          <div className="text-sm opacity-70">Loading…</div>
        ) : items.length === 0 ? (
          <div className="text-sm opacity-70">No bottle openers available.</div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {items.map((p) => (
              <div key={p.slug} className="rounded-lg border border-black/10 dark:border-white/10 overflow-hidden">
                <div className="h-40 bg-gradient-to-br from-black/5 to-black/10 dark:from-white/5 dark:to-white/10 flex items-center justify-center" aria-hidden>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {p.primary_image_url ? (
                    <img src={p.primary_image_url} alt={p.name} className="w-full h-full object-cover" />
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
        )}
      </div>
    </main>
  );
}

