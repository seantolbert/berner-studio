"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getProductBySlug } from "../data";
import { estimateProductETA } from "@/lib/leadtime";
import { formatCurrencyCents } from "@/lib/money";
import { DEFAULT_CURRENCY } from "@/lib/env";

function formatUsd(cents: number) {
  return formatCurrencyCents(cents);
}

export default function ProductPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const [added, setAdded] = useState(false);

  const product = useMemo(() => getProductBySlug(params?.slug as string), [params?.slug]);

  if (!product) {
    return (
      <main className="min-h-screen w-full p-6 flex items-center justify-center">
        <div className="text-sm opacity-70">Product not found.</div>
      </main>
    );
  }

  const addToCart = () => {
    try {
      const raw = localStorage.getItem("bs_cart");
      const arr = raw ? (JSON.parse(raw) as any[]) : [];
      const id = `prod-${product.slug}-${Date.now()}`;
      const line = { id, name: product.name, unitPrice: product.priceCents, quantity: 1, product: { slug: product.slug } };
      const next = Array.isArray(arr) ? [...arr, line] : [line];
      localStorage.setItem("bs_cart", JSON.stringify(next));
      setAdded(true);
    } catch {
      // ignore
    }
  };

  return (
    <main className="min-h-screen w-full p-6">
      {product ? <ProductJsonLd product={product} /> : null}
      <div className="max-w-5xl mx-auto grid gap-6 md:grid-cols-2 items-start">
        <div className="rounded-xl overflow-hidden border border-black/10 dark:border-white/10">
          <div className="w-full aspect-[4/3] bg-gradient-to-br from-black/5 to-black/10 dark:from-white/5 dark:to-white/10 flex items-center justify-center text-sm opacity-70">
            Product image placeholder
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-semibold">{product.name}</h1>
            <div className="text-lg font-medium mt-1">{formatUsd(product.priceCents)}</div>
            <div className="text-xs opacity-70 mt-1">{estimateProductETA().label}</div>
          </div>
          <p className="text-sm opacity-80">{product.description}</p>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={addToCart}
              className="inline-flex h-10 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Add to cart
            </button>
            <button
              type="button"
              onClick={() => router.push("/cart")}
              className="inline-flex h-10 px-4 rounded-md border border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10"
            >
              Go to cart
            </button>
          </div>
          {added && (
            <div className="text-xs opacity-70">Added to cart.</div>
          )}
        </div>
      </div>
    </main>
  );
}

function ProductJsonLd({ product }: { product: { slug: string; name: string; description: string; priceCents: number; image?: string } }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const base = (siteUrl || "").replace(/\/$/, "");
  const url = base ? `${base}/products/${product.slug}` : `/products/${product.slug}`;
  const image = product.image ? (product.image.startsWith("http") ? product.image : `${base}${product.image}`) : (base ? `${base}/og.svg` : "/og.svg");
  const json = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: [image],
    brand: { "@type": "Brand", name: "Berner Studio" },
    url,
    offers: {
      "@type": "Offer",
      priceCurrency: DEFAULT_CURRENCY.toUpperCase(),
      price: (product.priceCents / 100).toFixed(2),
      availability: "http://schema.org/InStock",
      url,
    },
  };
  return <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />;
}
