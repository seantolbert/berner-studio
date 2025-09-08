"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const MiniCartDrawer = require("@/app/components/MiniCartDrawer").default as any;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const useLocalCart = require("@/app/hooks/useLocalCart").default as any;

export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { items } = useLocalCart();
  const [cartOpen, setCartOpen] = useState(false);
  const isBuilder = pathname?.startsWith("/board-builder");

  // Non-sticky header on builder pages to keep header + content as one unit
  const containerClass = isBuilder
    ? "relative w-full border-b border-black/10 dark:border-white/10 bg-background"
    : "sticky top-0 z-30 w-full border-b border-black/10 dark:border-white/10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60";

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const HeaderBackButton = require("@/app/components/HeaderBackButton").default as any;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const AuthButton = require("@/app/components/AuthButton").default as any;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const MobileNav = require("@/app/components/MobileNav").default as any;

  return (
    <header className={containerClass}>
      <div className="mx-auto max-w-5xl px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="hidden md:inline-flex">
            <HeaderBackButton />
          </div>
          <div className="flex items-center gap-2">
            {/* Circular logo placeholder matching title height */}
            <div className="rounded-full border border-black/20 dark:border-white/20 bg-black/5 dark:bg-white/10 h-[1.3em] w-[1.3em]" aria-label="Logo placeholder" />
            <div className="text-lg md:text-xl" style={{ fontFamily: 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif' }}>Berner Studio</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MobileNav />
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="hidden md:inline-flex h-8 px-3 rounded-md border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 text-sm items-center gap-2"
          >
            <span>Cart</span>
            <CartCountBadge items={items} />
          </button>
          <div className="hidden md:inline-flex">
            <AuthButton />
          </div>
        </div>
        <MiniCartDrawer open={cartOpen} onOpenChange={setCartOpen} />
      </div>
    </header>
  );
}

function CartCountBadge({ items }: { items: Array<{ quantity: number }> | undefined }) {
  const count = useMemo(() => (items || []).reduce((s, it) => s + Math.max(0, Number(it.quantity) || 0), 0), [items]);
  if (!count) return null;
  return (
    <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-[11px] border border-black/15 dark:border-white/15 bg-black/5 dark:bg-white/10">
      {count}
    </span>
  );
}
