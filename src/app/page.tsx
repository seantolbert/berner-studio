import ProductSection from "@/app/components/ProductSection";
import HomeHero, { type HomeHeroData } from "@/app/components/HomeHero";
import { supabaseAnon } from "@/lib/supabase/serverAnon";

export const revalidate = 60; // ISR for homepage content

export default async function HomePage() {
  const { data: hero } = await supabaseAnon
    .from("home_hero")
    .select("title,subtitle,image_url,primary_label,primary_href,secondary_label,secondary_href")
    .maybeSingle();

  const { data: secs } = await supabaseAnon
    .from("home_sections")
    .select("id,title,subtext,view_all_label,view_all_href,max_items,position,category")
    .order("position", { ascending: true });

  const sectionList = (secs || []) as Array<{
    id: string;
    title: string;
    subtext: string | null;
    view_all_label: string | null;
    view_all_href: string | null;
    max_items: number;
    category: string | null;
  }>;

  let shaped: Array<{
    id: string;
    title: string;
    subtext: string | null;
    view_all_label: string | null;
    view_all_href: string | null;
    max_items: number;
    category: string | null;
    collections: Array<{ label: string; href: string | null }>;
    products: Array<{ slug: string; name: string; price_cents: number; primary_image_url: string | null }>;
  }> = [];

  if (sectionList.length > 0) {
    const ids = sectionList.map((s) => s.id);
    const { data: sels } = await supabaseAnon
      .from("home_section_products")
      .select("section_id,product_id,position")
      .in("section_id", ids)
      .order("position", { ascending: true });
    const { data: cols } = await supabaseAnon
      .from("home_section_collections")
      .select("section_id,label,href,position")
      .in("section_id", ids)
      .order("position", { ascending: true });
    const prodIds = Array.from(new Set((sels || []).map((r: any) => r.product_id)));
    let productsById: Record<string, { slug: string; name: string; price_cents: number; primary_image_url: string | null }> = {};
    if (prodIds.length) {
      const { data: prods } = await supabaseAnon
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
    const bySection: Record<string, Array<{ slug: string; name: string; price_cents: number; primary_image_url: string | null }>> = {};
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
    shaped = sectionList.map((s) => ({
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
    // Category override
    const withCategory = shaped.filter((s) => s.category);
    if (withCategory.length) {
      const results: Record<string, Array<{ slug: string; name: string; price_cents: number; primary_image_url: string | null }>> = {};
      for (const s of withCategory) {
        const { data: prods } = await supabaseAnon
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
  }

  return (
    <main className="min-h-screen w-full">
      <HomeHero data={hero as HomeHeroData | null} />
      {shaped.map((s) => (
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
    </main>
  );
}
