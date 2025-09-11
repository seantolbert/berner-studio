"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Button from "@/app/components/ui/Button";
import ProductSection from "@/app/components/ProductSection";
import type { ProductItem } from "@/app/components/ProductCard";

type HomeHero = {
  title: string | null;
  subtitle: string | null;
  image_url: string | null;
  primary_label: string | null;
  primary_href: string | null; // kept for future use
  secondary_label: string | null;
  secondary_href: string | null; // kept for future use
};

export default function HomePage() {
  const [hero, setHero] = useState<HomeHero | null>(null);
  const [sections, setSections] = useState<
    Array<{
      id: string;
      title: string;
      subtext: string | null;
      view_all_label: string | null;
      view_all_href: string | null;
      max_items: number;
      category: string | null;
      collections: Array<{ label: string; href: string | null }>;
      products: ProductItem[];
    }>
  >([]);

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("home_hero")
          .select(
            "title,subtitle,image_url,primary_label,primary_href,secondary_label,secondary_href"
          )
          .maybeSingle();
        if (!aborted && !error) setHero((data as HomeHero) || null);
      } catch {}
    })();
    return () => {
      aborted = true;
    };
  }, []);

  // Load configurable sections and their products
  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const { data: secs, error: sErr } = await supabase
          .from("home_sections")
          .select("id,title,subtext,view_all_label,view_all_href,max_items,position,category")
          .order("position", { ascending: true });
        if (sErr) return; // silent fail
        const sectionList = (secs || []) as Array<{
          id: string;
          title: string;
          subtext: string | null;
          view_all_label: string | null;
          view_all_href: string | null;
          max_items: number;
          category: string | null;
        }>;
        if (sectionList.length === 0) {
          if (!aborted) setSections([]);
          return;
        }
        const ids = sectionList.map((s) => s.id);
        const { data: sels, error: selErr } = await supabase
          .from("home_section_products")
          .select("section_id,product_id,position")
          .in("section_id", ids)
          .order("position", { ascending: true });
        if (selErr) return;
        const { data: cols, error: colErr } = await supabase
          .from("home_section_collections")
          .select("section_id,label,href,position")
          .in("section_id", ids)
          .order("position", { ascending: true });
        if (colErr) return;
        const prodIds = Array.from(new Set((sels || []).map((r: any) => r.product_id)));
        let productsById: Record<string, ProductItem> = {};
        if (prodIds.length) {
          const { data: prods } = await supabase
            .from("products")
            .select("id,slug,name,price_cents,primary_image_url,status,deleted_at")
            .in("id", prodIds)
            .eq("status", "published")
            .is("deleted_at", null);
          for (const p of (prods || []) as any[]) {
            productsById[p.id] = {
              slug: p.slug,
              name: p.name,
              price_cents: p.price_cents,
              primary_image_url: p.primary_image_url || null,
            };
          }
        }
        const bySection: Record<string, ProductItem[]> = {};
        const collectionsBySection: Record<string, Array<{ label: string; href: string | null }>> = {};
        for (const s of (sels || []) as any[]) {
          const arr = bySection[s.section_id] || (bySection[s.section_id] = []);
          const item = productsById[s.product_id];
          if (item) arr.push(item);
        }
        for (const c of (cols || []) as any[]) {
          const arr = collectionsBySection[c.section_id] || (collectionsBySection[c.section_id] = []);
          arr.push({ label: c.label as string, href: (c.href as string) || null });
        }
        const shaped = sectionList.map((s) => ({
          id: s.id,
          title: s.title,
          subtext: s.subtext,
          view_all_label: s.view_all_label,
          view_all_href: s.view_all_href,
          max_items: s.max_items || 3,
          category: s.category || null,
          collections: collectionsBySection[s.id] || [],
          products: bySection[s.id] || [],
        }));
        // For sections with category, load products by category (overrides manual selection)
        const withCategory = shaped.filter((s) => s.category);
        if (withCategory.length) {
          const results: Record<string, ProductItem[]> = {};
          for (const s of withCategory) {
            const { data: prods } = await supabase
              .from("products")
              .select("slug,name,price_cents,primary_image_url,status,deleted_at,category")
              .eq("category", s.category!)
              .eq("status", "published")
              .is("deleted_at", null)
              .order("updated_at", { ascending: false })
              .limit(Math.max(3, s.max_items || 3));
            results[s.id] = ((prods || []) as any[]).map((p: any) => ({
              slug: p.slug,
              name: p.name,
              price_cents: p.price_cents,
              primary_image_url: p.primary_image_url || null,
            }));
          }
          for (const s of shaped) {
            if (s.category) s.products = results[s.id] || [];
          }
        }
        if (!aborted) setSections(shaped);
      } catch {}
    })();
    return () => {
      aborted = true;
    };
  }, []);

  const title = hero?.title || "Craft Your Perfect Board";
  const subtitle =
    hero?.subtitle ||
    "Premium, hand-crafted cutting boards. Customize the look, size, and wood combination to fit your kitchen.";
  const imageUrl = hero?.image_url || "/og.svg"; // placeholder in /public
  const primaryLabel = hero?.primary_label || "Start Building";
  const secondaryLabel = hero?.secondary_label || "Browse Boards";

  return (
    <main className="min-h-screen w-full">
      <section className="w-full px-6 py-16 md:py-24">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="text-base md:text-lg mt-3 md:mt-4 text-foreground">
              {subtitle}
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <Button variant="link" size="lg" onClick={() => {}} aria-disabled>
                {primaryLabel}
              </Button>
              <Button variant="link" size="lg" onClick={() => {}} aria-disabled>
                {secondaryLabel}
              </Button>
            </div>
          </div>
          <div className="w-full">
            <div className="aspect-[4/3] w-full overflow-hidden rounded-md">
              <img
                src={imageUrl}
                alt="Featured board"
                className="h-full w-full object-cover"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </section>
      {/* Dynamic sections */}
      {sections.map((s) => (
        <ProductSection
          key={s.id}
          title={s.title}
          subtext={s.subtext || undefined}
          collections={s.collections?.map((c) => (c.href ? { label: c.label, href: c.href } : { label: c.label }))}
          viewAll={s.view_all_label && s.view_all_href ? { label: s.view_all_label, href: s.view_all_href } : undefined}
          products={s.products}
          maxItems={Math.max(3, s.max_items || 3)}
          className="py-10"
        />
      ))}
      {/* Footer handled by global layout */}
    </main>
  );
}
