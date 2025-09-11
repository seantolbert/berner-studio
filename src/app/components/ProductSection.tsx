"use client";

import Link from "next/link";
import ProductCard, { ProductItem } from "@/app/components/ProductCard";

type ViewAll =
  | { label: string; href: string; onClick?: never }
  | { label: string; href?: never; onClick: () => void };

export type ProductSectionProps = {
  title: string;
  subtext?: string | undefined;
  viewAll?: ViewAll | undefined;
  collections?: Array<{ label: string; href?: string; onClick?: () => void }> | undefined;
  products: ProductItem[]; // provide at least 3 for intended layout
  maxItems?: number | undefined; // optional clamp, default 3
  className?: string | undefined;
};

export default function ProductSection({
  title,
  subtext,
  viewAll,
  collections,
  products,
  maxItems = 3,
  className = "",
}: ProductSectionProps) {
  const items = products.slice(0, Math.max(3, maxItems));
  return (
    <section className={`w-full ${className}`} aria-label={title}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-end justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
            {subtext ? (
              <p className="text-sm md:text-base text-foreground/80 mt-1">{subtext}</p>
            ) : null}
            {collections && collections.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-3">
                {collections.map((c, idx) =>
                  c.href ? (
                    <Link
                      key={`${c.label}-${idx}`}
                      href={c.href}
                      className="h-8 px-3 rounded-md border border-black/10 dark:border-white/10 text-xs hover:bg-black/5 dark:hover:bg-white/10"
                    >
                      {c.label}
                    </Link>
                  ) : (
                    <button
                      key={`${c.label}-${idx}`}
                      type="button"
                      onClick={c.onClick}
                      className="h-8 px-3 rounded-md border border-black/10 dark:border-white/10 text-xs hover:bg-black/5 dark:hover:bg-white/10"
                    >
                      {c.label}
                    </button>
                  )
                )}
              </div>
            ) : null}
          </div>
          {viewAll ? (
            viewAll.href ? (
              <Link
                href={viewAll.href}
                className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 text-sm hover:bg-black/5 dark:hover:bg-white/10 whitespace-nowrap"
              >
                {viewAll.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={viewAll.onClick}
                className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 text-sm hover:bg-black/5 dark:hover:bg-white/10 whitespace-nowrap"
              >
                {viewAll.label}
              </button>
            )
          ) : null}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((p) => (
            <ProductCard key={p.slug} item={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
