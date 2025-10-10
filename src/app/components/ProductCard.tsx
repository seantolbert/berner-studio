"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { formatCurrencyCents } from "@/lib/money";

export type ProductItem = {
  slug: string;
  name: string;
  price_cents: number;
  primary_image_url: string | null;
  card_label: string | null;
  tags?: string[] | null;
};

export default function ProductCard({ item }: { item: ProductItem }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="rounded-md border border-black/10 dark:border-white/10 overflow-hidden">
      <Link
        href={`/products/${item.slug}`}
        className="relative block h-44 bg-gradient-to-br from-black/5 to-black/10 dark:from-white/5 dark:to-white/10"
        aria-label={`View ${item.name}`}
      >
        {/* Loading skeleton overlay */}
        {item.primary_image_url && !loaded && <div className="skeleton-layer" />}
        {item.primary_image_url ? (
          <Image
            src={item.primary_image_url}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-opacity duration-300"
            style={{ opacity: loaded ? 1 : 0 }}
            unoptimized
            priority={false}
            onLoadingComplete={() => setLoaded(true)}
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-xs opacity-70">
            Image coming soon
          </span>
        )}
      </Link>
      <div className="p-3">
        {item.card_label ? (
          <div className="text-[11px] uppercase tracking-wide font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
            {item.card_label}
          </div>
        ) : null}
        <div className="text-sm font-medium truncate">{item.name}</div>
        <div className="text-xs opacity-70">{formatCurrencyCents(item.price_cents)}</div>
      </div>
    </div>
  );
}
