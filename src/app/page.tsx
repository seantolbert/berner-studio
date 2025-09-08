"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type HomeSettings = {
  promo_enabled: boolean;
  promo_text: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  boards_title: string | null;
  boards_description: string | null;
  boards_placeholder_url: string | null;
  bottle_title: string | null;
  bottle_description: string | null;
  bottle_placeholder_url: string | null;
  testimonials_enabled: boolean;
  testimonial_quote: string | null;
  testimonial_author: string | null;
};

export default function HomePage() {
  const router = useRouter();
  const [home, setHome] = useState<HomeSettings | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("homepage_settings")
          .select(
            "promo_enabled, promo_text, hero_title, hero_subtitle, boards_title, boards_description, boards_placeholder_url, bottle_title, bottle_description, bottle_placeholder_url, testimonials_enabled, testimonial_quote, testimonial_author"
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
                  onClick={() => router.push("/templates")}
                  className="inline-flex h-11 px-5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Build your board
                </button>
                <a
                  href="#bottle-openers"
                  className="inline-flex h-11 px-5 rounded-md border border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10"
                >
                  Shop bottle openers
                </a>
              </div>
              <div className="flex items-center gap-4 pt-2 text-xs opacity-70">
                <div className="inline-flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M3 12h18"/><path d="M3 6h18"/><path d="M3 18h18"/></svg>
                  Free shipping $75+
                </div>
                <div className="inline-flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><circle cx="12" cy="12" r="10"/><path d="M8 12l2 2 4-4"/></svg>
                  Made in USA
                </div>
                <div className="inline-flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M20 12H4"/><path d="M12 4v16"/></svg>
                  Easy returns
                </div>
              </div>
            </div>
            {/* Right: visual */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-200/40 to-emerald-500/30 dark:from-emerald-900/30 dark:to-emerald-700/20" aria-hidden />
              <div className="relative h-full w-full aspect-[16/12] md:aspect-auto flex items-center justify-center text-emerald-900/70 dark:text-emerald-200/70 text-sm p-6 text-center">
                {home?.testimonials_enabled && (home?.testimonial_quote || home?.testimonial_author) ? (
                  <div>
                    <div className="text-base md:text-lg italic">“{home?.testimonial_quote || ""}”</div>
                    {home?.testimonial_author && <div className="mt-2 text-xs opacity-80">— {home.testimonial_author}</div>}
                  </div>
                ) : (
                  <span>Aesthetic testimonial (placeholder)</span>
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
              onClick={() => router.push("/templates")}
              className="inline-flex h-9 px-3 rounded-md border border-black/15 dark:border-white/15 text-sm hover:bg-black/5 dark:hover:bg-white/10"
            >
              View all
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
              onClick={() => router.push("/templates")}
              className="inline-flex h-11 px-5 rounded-md border border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10"
            >
              Purist
            </button>
            <button
              type="button"
              onClick={() => router.push("/templates")}
              className="inline-flex h-11 px-5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Create your own
            </button>
            
          </div>
        </section>

        <section id="bottle-openers" className="rounded-xl border border-black/10 dark:border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">{home?.bottle_title || "Bottle Openers"}</h2>
            <button
              type="button"
              onClick={() => router.push("/gallery")}
              className="inline-flex h-9 px-3 rounded-md border border-black/15 dark:border-white/15 text-sm hover:bg-black/5 dark:hover:bg-white/10"
            >
              View all
            </button>
          </div>
          {home?.bottle_description && (
            <p className="text-sm opacity-80 mb-4">{home.bottle_description}</p>
          )}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {[ 
              { slug: "classic-steel-opener", name: "Classic Steel", price: "$24" },
              { slug: "walnut-handle-opener", name: "Walnut Handle", price: "$32" },
              { slug: "maple-brass-opener", name: "Maple + Brass", price: "$36" },
              { slug: "pocket-keychain-opener", name: "Pocket Keychain", price: "$18" },
              { slug: "magnetic-mount-opener", name: "Magnetic Mount", price: "$28" },
              { slug: "limited-edition-opener", name: "Limited Edition", price: "$40" },
            ].map((p) => (
              <div key={p.slug} className="rounded-lg border border-black/10 dark:border-white/10 overflow-hidden">
                <div className="h-28 bg-gradient-to-br from-black/5 to-black/10 dark:from-white/5 dark:to-white/10" aria-hidden />
                <div className="p-3">
                  <div className="text-sm font-medium truncate">{p.name}</div>
                  <div className="text-xs opacity-70">{p.price}</div>
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
        </section>

        {/* Apparel */}
        <section id="apparel" className="rounded-xl border border-black/10 dark:border-white/10 p-6">
          <h2 className="text-xl font-semibold mb-4">Apparel</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {[ 
              { slug: "logo-tee", name: "Logo Tee", price: "$25" },
              { slug: "embroidered-cap", name: "Embroidered Cap", price: "$22" },
              { slug: "heavy-hoodie", name: "Heavy Hoodie", price: "$48" },
              { slug: "work-apron", name: "Work Apron", price: "$54" },
              { slug: "beanie", name: "Beanie", price: "$18" },
              { slug: "crewneck", name: "Crewneck", price: "$42" },
            ].map((p) => (
              <div key={p.slug} className="rounded-lg border border-black/10 dark:border-white/10 overflow-hidden">
                <div className="h-28 bg-gradient-to-br from-black/5 to-black/10 dark:from-white/5 dark:to-white/10" aria-hidden />
                <div className="p-3">
                  <div className="text-sm font-medium truncate">{p.name}</div>
                  <div className="text-xs opacity-70">{p.price}</div>
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
        </section>

        <section className="rounded-xl border border-dashed border-black/10 dark:border-white/10 p-6">
          <h2 className="text-xl font-medium mb-2">More</h2>
          <p className="text-sm opacity-70">More sections coming soon.</p>
        </section>
      </div>
      {/* Footer */}
      <footer className="w-full mt-10 border-t border-black/10 dark:border-white/10">
        <div className="mx-auto max-w-5xl p-6 grid gap-8 md:grid-cols-4">
          <div>
            <div className="text-base font-semibold mb-2">Berner Studio</div>
            <p className="text-sm opacity-70">
              Handcrafted cutting boards and essentials. Built to last, designed by you.
            </p>
          </div>
          <div>
            <div className="text-sm font-semibold mb-2">Shop</div>
            <ul className="text-sm space-y-1 opacity-80">
              <li><button type="button" onClick={() => router.push("/templates")} className="hover:underline">Boards</button></li>
              <li><a href="#bottle-openers" className="hover:underline">Bottle openers</a></li>
              <li><a href="#apparel" className="hover:underline">Apparel</a></li>
              <li><button type="button" onClick={() => router.push("/cart")} className="hover:underline">Cart</button></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold mb-2">Company</div>
            <ul className="text-sm space-y-1 opacity-80">
              <li><button type="button" onClick={() => router.push("/about")} className="hover:underline">About the maker</button></li>
              <li><button type="button" onClick={() => router.push("/faq")} className="hover:underline">Care & FAQ</button></li>
              <li><button type="button" onClick={() => router.push("/gallery")} className="hover:underline">Gallery</button></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold mb-2">Stay in the loop</div>
            <p className="text-sm opacity-70 mb-3">Promos, launches, and tips. No spam.</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="you@example.com"
                className="flex-1 h-10 px-3 rounded-md border border-black/15 dark:border-white/15 bg-transparent text-sm"
              />
              <button className="h-10 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm" type="button">Subscribe</button>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-5xl px-6 pb-6 text-xs opacity-60 flex items-center justify-between">
          <span>© {new Date().getFullYear()} Berner Studio</span>
          <a href="#" className="hover:underline">Back to top</a>
        </div>
      </footer>
    </main>
  );
}
