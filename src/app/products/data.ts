export type Product = {
  slug: string;
  name: string;
  priceCents: number;
  category: "bottle-openers" | "apparel";
  description: string;
  image?: string;
};

export const PRODUCTS: Product[] = [
  { slug: "classic-steel-opener", name: "Classic Steel", priceCents: 2400, category: "bottle-openers", description: "Sturdy stainless opener with a timeless silhouette." },
  { slug: "walnut-handle-opener", name: "Walnut Handle", priceCents: 3200, category: "bottle-openers", description: "Solid walnut handle, oiled for grip and durability." },
  { slug: "maple-brass-opener", name: "Maple + Brass", priceCents: 3600, category: "bottle-openers", description: "Maple body with brass hardware for a warm finish." },
  { slug: "pocket-keychain-opener", name: "Pocket Keychain", priceCents: 1800, category: "bottle-openers", description: "Compact keychain opener for everyday carry." },
  { slug: "magnetic-mount-opener", name: "Magnetic Mount", priceCents: 2800, category: "bottle-openers", description: "Magnetized mount catches caps and stows easily." },
  { slug: "limited-edition-opener", name: "Limited Edition", priceCents: 4000, category: "bottle-openers", description: "Short-run series with unique grain and finishes." },

  { slug: "logo-tee", name: "Logo Tee", priceCents: 2500, category: "apparel", description: "Soft cotton tee with subtle mark." },
  { slug: "embroidered-cap", name: "Embroidered Cap", priceCents: 2200, category: "apparel", description: "Low-profile cap with embroidered logo." },
  { slug: "heavy-hoodie", name: "Heavy Hoodie", priceCents: 4800, category: "apparel", description: "Midweight fleece for year-round comfort." },
  { slug: "work-apron", name: "Work Apron", priceCents: 5400, category: "apparel", description: "Durable canvas apron with adjustable straps." },
  { slug: "beanie", name: "Beanie", priceCents: 1800, category: "apparel", description: "Cuffed knit beanie in seasonal colors." },
  { slug: "crewneck", name: "Crewneck", priceCents: 4200, category: "apparel", description: "Classic fit crewneck sweatshirt." },
];

export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

