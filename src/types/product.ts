import type { BoardLayout, BoardSize } from "@/types/board";

export type ProductSummary = {
  slug: string;
  name: string;
  price_cents: number;
  primary_image_url: string | null;
};

export type ProductVariant = {
  id: string;
  color: string | null;
  size: string | null;
  sku: string | null;
  price_cents_override: number | null;
  status: "draft" | "published";
};

export type ProductImage = {
  id: string;
  url: string;
  alt: string | null;
  color: string | null;
};

export type ProductTemplateDetail = {
  id: string;
  name: string;
  size: BoardSize;
  strip3Enabled: boolean;
  layout: BoardLayout;
};

export type ProductCore = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  category: string | null;
  status: string;
  primary_image_url: string | null;
  short_desc: string | null;
  long_desc: string | null;
};

export type ProductDetail = {
  product: ProductCore;
  template: ProductTemplateDetail | null;
  variants: ProductVariant[];
  images: ProductImage[];
};

export type ProductSort = "newest" | "price-asc" | "price-desc";
export type ProductCategory = "" | "boards" | "bottle-openers" | "apparel";
