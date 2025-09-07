"use client";

import { usePathname, useRouter } from "next/navigation";

export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
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
            onClick={() => router.push("/cart")}
            className="hidden md:inline-flex h-8 px-3 rounded-md border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 text-sm"
          >
            Cart
          </button>
          <div className="hidden md:inline-flex">
            <AuthButton />
          </div>
        </div>
      </div>
    </header>
  );
}
