"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { formatCurrencyCents } from "@/lib/money";

type HomeSettings = {
  promo_enabled: boolean;
  promo_text: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  home_hero_url: string | null;
  hero_cta_primary_text: string | null;
  hero_cta_primary_href: string | null;
  hero_cta_secondary_text: string | null;
  hero_cta_secondary_href: string | null;
  hero_feature_1: string | null;
  hero_feature_2: string | null;
  hero_feature_3: string | null;
  boards_title: string | null;
  boards_description: string | null;
  boards_placeholder_url: string | null;
  boards_view_all_text: string | null;
  boards_cta_build_text: string | null;
  boards_cta_purist_text: string | null;
  boards_cta_classics_text: string | null;
  bottle_title: string | null;
  bottle_description: string | null;
  bottle_placeholder_url: string | null;
  testimonials_enabled: boolean;
  testimonial_quote: string | null;
  testimonial_author: string | null;
  apparel_title: string | null;
  apparel_empty_text: string | null;
  more_title: string | null;
  more_body: string | null;
};

export default function HomePage() {
  const router = useRouter();
  const [home, setHome] = useState<HomeSettings | null>(null);
  const [apparel, setApparel] = useState<Array<{ slug: string; name: string; price_cents: number; primary_image_url: string | null }>>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("homepage_settings")
          .select(
            "promo_enabled, promo_text, hero_title, hero_subtitle, home_hero_url, hero_cta_primary_text, hero_cta_primary_href, hero_cta_secondary_text, hero_cta_secondary_href, hero_feature_1, hero_feature_2, hero_feature_3, boards_title, boards_description, boards_placeholder_url, boards_view_all_text, boards_cta_build_text, boards_cta_purist_text, boards_cta_classics_text, bottle_title, bottle_description, bottle_placeholder_url, testimonials_enabled, testimonial_quote, testimonial_author, apparel_title, apparel_empty_text, more_title, more_body"
          )
          .maybeSingle();
        if (!mounted) return;
        if (!error) setHome((data as any) || null);
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("slug,name,price_cents,primary_image_url,status,deleted_at,category")
          .eq("category", "apparel")
          .eq("status", "published")
          .is("deleted_at", null)
          .order("updated_at", { ascending: false })
          .limit(12);
        if (!mounted) return;
        if (!error) {
          const items = (data || []).map((p: any) => ({
            slug: p.slug as string,
            name: p.name as string,
            price_cents: p.price_cents as number,
            primary_image_url: (p.primary_image_url as string) || null,
          }));
          setApparel(items);
        }
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);
  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-5xl grid gap-10">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-2xl border border-black/10 dark:border-white/10">
          <div className="grid md:grid-cols-2">
            {/* Left: promo copy */}
            <div className="p-6 md:p-10 flex flex-col gap-4">
              {home?.promo_enabled && home?.promo_text ? (
                <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-300/60 bg-emerald-100/60 text-emerald-900 px-3 py-1 text-xs font-semibold dark:bg-emerald-900/30 dark:text-emerald-100 dark:border-emerald-700/50">
                  <span>{home.promo_text}</span>
                </div>
              ) : null}
              <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
                {home?.hero_title || "Beautiful, custom boards. Built for the work you love."}
              </h1>
              <p className="text-sm md:text-base opacity-80 max-w-prose">
                {home?.hero_subtitle || "Design your perfect pattern, pick your edge and groove, then check out with confidence. Hand crafted finishes and premium hardwoods."}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => router.push(home?.hero_cta_primary_href || "/templates")}
                  className="inline-flex h-11 px-5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {home?.hero_cta_primary_text || "Build your board"}
                </button>
                <button
                  type="button"
                  onClick={() => router.push(home?.hero_cta_secondary_href || "/boards")}
                  className="inline-flex h-11 px-5 rounded-md border border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10"
                >
                  {home?.hero_cta_secondary_text || "Shop boards"}
                </button>
              </div>
              <div className="flex items-center gap-4 pt-2 text-xs opacity-70">
                <div className="inline-flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M3 12h18"/><path d="M3 6h18"/><path d="M3 18h18"/></svg>
                  {home?.hero_feature_1 || "Free shipping $75+"}
                </div>
                <div className="inline-flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><circle cx="12" cy="12" r="10"/><path d="M8 12l2 2 4-4"/></svg>
                  {home?.hero_feature_2 || "Made in USA"}
                </div>
                <div className="inline-flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M20 12H4"/><path d="M12 4v16"/></svg>
                  {home?.hero_feature_3 || "Easy returns"}
                </div>
              </div>
            </div>
            {/* Right: home hero image */}
            <div className="p-6 md:p-10">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
                {home?.home_hero_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={home.home_hero_url} alt="Home hero image" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-200/40 to-emerald-500/30 dark:from-emerald-900/30 dark:to-emerald-700/20" aria-hidden />
                )}
              </div>
            </div>
          </div>
        </section>
        <section className="rounded-xl border border-black/10 dark:border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold">{home?.boards_title || "Boards"}</h1>
            <button
              type="button"
              onClick={() => router.push("/boards")}
              className="inline-flex h-9 px-3 rounded-md border border-black/15 dark:border-white/15 text-sm hover:bg-black/5 dark:hover:bg-white/10"
            >
              {home?.boards_view_all_text || "View all"}
            </button>
          </div>
          {/* Placeholder hero image */}
          <div className="mb-4 rounded-lg overflow-hidden border border-black/10 dark:border-white/10">
            {home?.boards_placeholder_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={home.boards_placeholder_url} alt={home.boards_title || "Boards"} className="w-full aspect-[16/9] object-cover" />
            ) : (
              <div className="w-full aspect-[16/9] bg-gradient-to-br from-emerald-200/40 to-emerald-500/30 dark:from-emerald-900/30 dark:to-emerald-700/20 flex items-center justify-center text-emerald-900/70 dark:text-emerald-200/70 text-sm">
                Boards hero image placeholder
              </div>
            )}
          </div>
          {home?.boards_description && (
            <p className="text-sm opacity-80 mb-3">{home.boards_description}</p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/boards?collection=purist")}
              className="inline-flex h-11 px-5 rounded-md border border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10"
            >
              {home?.boards_cta_purist_text || "Purist"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/boards?collection=classics")}
              className="inline-flex h-11 px-5 rounded-md border border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10"
            >
              {home?.boards_cta_classics_text || "Classics"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/templates")}
              className="inline-flex h-11 px-5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {home?.boards_cta_build_text || "Create your own"}
            </button>
            
          </div>
        </section>

        {/* Bottle Openers removed per request */}

        {/* Apparel */}
        <section id="apparel" className="rounded-xl border border-black/10 dark:border-white/10 p-6">
          <h2 className="text-xl font-semibold mb-4">{home?.apparel_title || "Apparel"}</h2>
          {apparel.length === 0 ? (
            <div className="text-sm opacity-70">{home?.apparel_empty_text || "No apparel products available."}</div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {apparel.map((p) => (
                <div key={p.slug} className="rounded-lg border border-black/10 dark:border-white/10 overflow-hidden">
                  <div className="h-28 bg-gradient-to-br from-black/5 to-black/10 dark:from-white/5 dark:to-white/10 flex items-center justify-center" aria-hidden>
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
        </section>

        <section className="rounded-xl border border-dashed border-black/10 dark:border-white/10 p-6">
          <h2 className="text-xl font-medium mb-2">{home?.more_title || "More"}</h2>
          <p className="text-sm opacity-70">{home?.more_body || "More sections coming soon."}</p>
        </section>
      </div>
      {/* Footer moved to global layout */}
    </main>
  );
}
