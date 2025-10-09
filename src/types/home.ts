export type HomeHero = {
  title: string | null;
  subtitle: string | null;
  image_url: string | null;
  primary_label: string | null;
  primary_href: string | null;
  secondary_label: string | null;
  secondary_href: string | null;
};

export type HomeSectionCollection = {
  label: string;
  href: string | null;
};

export type HomeSectionProduct = {
  slug: string;
  name: string;
  price_cents: number;
  primary_image_url: string | null;
  card_label: string | null;
  tags: string[];
};

export type HomeSection = {
  id: string;
  title: string;
  subtext: string | null;
  view_all_label: string | null;
  view_all_href: string | null;
  max_items: number;
  category: string | null;
  collections: HomeSectionCollection[];
  products: HomeSectionProduct[];
};

export type AdminHomeSection = {
  id: string;
  title: string;
  subtext: string | null;
  view_all_label: string | null;
  view_all_href: string | null;
  max_items: number;
  position: number;
  category: string | null;
  collections: Array<{ id: string; label: string; href: string }>;
};
