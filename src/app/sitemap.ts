import type { MetadataRoute } from "next";
import { PRODUCTS } from "@/app/products/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "";
  const now = new Date().toISOString();
  const urls: MetadataRoute.Sitemap = [
    { url: withBase(base, "/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: withBase(base, "/board-builder"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: withBase(base, "/board-builder/extras"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: withBase(base, "/cart"), lastModified: now, changeFrequency: "weekly", priority: 0.3 },
    { url: withBase(base, "/checkout"), lastModified: now, changeFrequency: "weekly", priority: 0.3 },
  ];
  for (const p of PRODUCTS) {
    urls.push({
      url: withBase(base, `/products/${p.slug}`),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }
  return urls;
}

function withBase(base: string, path: string) {
  return base ? `${base}${path}` : path;
}

