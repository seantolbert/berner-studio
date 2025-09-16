import ProductSection from "@/app/components/ProductSection";
import HomeHero from "@/app/components/HomeHero";
import { getHomeHero, getHomeSections } from "@/services/home";

export const revalidate = 60; // ISR for homepage content

export default async function HomePage() {
  const [hero, sections] = await Promise.all([getHomeHero(), getHomeSections()]);

  return (
    <main className="min-h-screen w-full">
      <HomeHero data={hero} />
      {sections.map((section) => (
        <ProductSection
          key={section.id}
          title={section.title}
          subtext={section.subtext || undefined}
          collections={section.collections.map((collection) =>
            collection.href ? { label: collection.label, href: collection.href } : { label: collection.label }
          )}
          viewAll={section.view_all_label && section.view_all_href ? { label: section.view_all_label, href: section.view_all_href } : undefined}
          products={section.products}
          maxItems={Math.max(3, section.max_items)}
          className="py-10"
        />
      ))}
    </main>
  );
}
