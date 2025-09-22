"use client";

import Link from "next/link";
import ProductCard, { ProductItem } from "@/app/components/ProductCard";

type ActionProps = {
  label: string;
  href?: string;
  onClick?: () => void;
  size?: "sm" | "md";
  className?: string;
};

function ActionPill({ label, href, onClick, size = "sm", className = "" }: ActionProps) {
  const sizeClasses = size === "md" ? "h-9 px-3 text-sm" : "h-8 px-3 text-xs";
  const classes = `${sizeClasses} inline-flex items-center justify-center rounded-md border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 whitespace-nowrap ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={classes}>
      {label}
    </button>
  );
}

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
  const viewAllAction =
    viewAll && (viewAll.href ? { href: viewAll.href } : viewAll.onClick ? { onClick: viewAll.onClick } : null);
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
                {collections.map((c, idx) => (
                  <ActionPill
                    key={`${c.label}-${idx}`}
                    {...(c.href ? { href: c.href } : {})}
                    {...(c.onClick ? { onClick: c.onClick } : {})}
                    label={c.label}
                  />
                ))}
              </div>
            ) : null}
          </div>
          {viewAll && viewAllAction ? (
            <ActionPill label={viewAll.label} size="md" {...viewAllAction} />
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
