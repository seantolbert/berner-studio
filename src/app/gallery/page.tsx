"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type G = { id: string; url: string; alt: string | null; caption: string | null };

export default function GalleryPage() {
  const [items, setItems] = useState<G[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('gallery')
          .select('id,url,alt,caption')
          .eq('published', true)
          .order('position', { ascending: true });
        if (error) throw error;
        if (!aborted) setItems((data as G[]) || []);
      } catch (error: unknown) {
        if (!aborted) {
          const message =
            error instanceof Error ? error.message : "Failed to load gallery";
          setError(message);
        }
      } finally { if (!aborted) setLoading(false); }
    })();
    return () => { aborted = true; };
  }, []);

  return (
    <main className="min-h-screen w-full p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Gallery</h1>
        {error && <div className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</div>}
        {loading ? (
          <div className="text-sm opacity-70">Loading…</div>
        ) : items.length === 0 ? (
          <div className="text-sm opacity-70">No images yet.</div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {items.map((g) => (
              <figure key={g.id} className="rounded-lg overflow-hidden border border-black/10 dark:border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.url} alt={g.alt || ''} className="w-full h-40 object-cover" />
                {g.caption && <figcaption className="p-2 text-xs opacity-80">{g.caption}</figcaption>}
              </figure>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
