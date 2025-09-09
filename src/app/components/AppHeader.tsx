"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef } from "react";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const TopDrawer = require("@/app/components/TopDrawer").default as any;
const AuthButton = require("@/app/components/AuthButton").default as any;
import { mainNav } from "@/app/nav/config";

export default function AppHeader() {
  const pathname = usePathname();
  const isBuilder = pathname?.startsWith("/board-builder");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuBtnRef = useRef<HTMLButtonElement | null>(null);

  const containerClass = isBuilder
    ? "relative w-full border-b border-black/10 dark:border-white/10 bg-background"
    : "sticky top-0 z-30 w-full border-b border-black/10 dark:border-white/10 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60";

  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname?.startsWith(href);

  return (
    <header className={containerClass}>
      <div className="mx-auto max-w-5xl px-4 h-14 md:h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 active:opacity-80" aria-label="Go to homepage">
          <div className="rounded-full border border-black/20 dark:border-white/20 bg-black/5 dark:bg-white/10 h-6 w-6" aria-hidden />
          <div className="text-lg md:text-xl" style={{ fontFamily: 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif' }}>Berner Studio</div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main">
          {mainNav.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className={`px-3 py-2 rounded-md text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/10 ${
                it.cta
                  ? "ml-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  : isActive(it.href)
                    ? "underline underline-offset-4 decoration-2"
                    : ""
              }`}
              aria-current={isActive(it.href) ? "page" : undefined}
            >
              {it.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center">
            <AuthButton />
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            ref={menuBtnRef}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 md:hidden"
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            aria-controls="top-drawer"
            aria-label="Open menu"
          >
            <span className="relative block w-5 h-4">
              <span className="absolute left-1/2 top-0 -translate-x-1/2 block h-[2px] w-5 bg-current" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 block h-[2px] w-5 bg-current" />
              <span className="absolute left-1/2 bottom-0 -translate-x-1/2 block h-[2px] w-5 bg-current" />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      <TopDrawer open={menuOpen} onOpenChange={setMenuOpen} title="Menu" returnFocusRef={menuBtnRef} id="top-drawer">
        <div className="p-4">
          <div className="mb-3 pb-3 border-b border-black/10 dark:border-white/10 md:hidden">
            <AuthButton />
          </div>
          <nav className="grid gap-2 text-sm" aria-label="Main">
            {mainNav.map((it, idx) => (
              <Link
                key={it.href}
                href={it.href}
                onClick={() => setMenuOpen(false)}
                className={`h-12 rounded-md px-3 flex items-center justify-between transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  menuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                } ${
                  it.cta ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'hover:bg-black/5 dark:hover:bg-white/10'
                }`}
                style={{ transitionDelay: menuOpen ? `${idx * 40}ms` : '0ms' }}
                aria-current={isActive(it.href) ? 'page' : undefined}
              >
                <span>{it.label}</span>
                {isActive(it.href) && !it.cta ? <span className="text-xs opacity-70">Current</span> : null}
              </Link>
            ))}
          </nav>
          <div className="flex items-center justify-end mt-3">
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="h-8 px-3 rounded-md border border-black/10 dark:border-white/10 text-xs"
            >
              Close
            </button>
          </div>
        </div>
      </TopDrawer>
    </header>
  );
}
