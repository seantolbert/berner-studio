"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import TopDrawer from "@/app/components/TopDrawer";
import AuthButton from "@/app/components/AuthButton";
import { mainNav } from "@/app/nav/config";

export default function AppHeader() {
  const pathname = usePathname();
  const isBuilder = pathname?.startsWith("/board-builder");
  const isAdmin = pathname?.startsWith("/admin");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuBtnRef = useRef<HTMLButtonElement | null>(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const readCartCount = () => {
      try {
        const raw = window.localStorage.getItem("bs_cart");
        if (!raw) {
          setCartCount(0);
          return;
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
          setCartCount(0);
          return;
        }
        const total = parsed.reduce((sum: number, item: { quantity?: number }) => {
          const qty = typeof item?.quantity === "number" ? item.quantity : 0;
          return sum + Math.max(0, qty);
        }, 0);
        setCartCount(total);
      } catch {
        setCartCount(0);
      }
    };

    readCartCount();

    const handleCartUpdate = () => readCartCount();

    window.addEventListener("cart:update", handleCartUpdate);
    window.addEventListener("storage", handleCartUpdate);

    return () => {
      window.removeEventListener("cart:update", handleCartUpdate);
      window.removeEventListener("storage", handleCartUpdate);
    };
  }, []);

  const containerClass = isBuilder
    ? "relative z-50 w-full border-b border-black/10 dark:border-white/10 bg-background"
    : "sticky top-0 z-50 w-full border-b border-black/10 dark:border-white/10 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60";

  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname?.startsWith(href);

  return (
    <header className={containerClass}>
      <div className="mx-auto max-w-5xl px-4 h-14 md:h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 active:opacity-80" aria-label="Go to homepage">
          <Image
            src="/logo.svg"
            alt="Berner Studio logo"
            width={28}
            height={28}
            className="h-7 w-7 object-contain"
            priority
          />
          <div className="text-lg md:text-xl" style={{ fontFamily: 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif' }}>Berner Studio</div>
        </Link>

        <div className="flex items-center gap-2 ml-auto md:flex-row-reverse">
          <nav className="hidden md:flex items-center gap-1 justify-end" aria-label="Main">
            {mainNav.map((it) => (
              it.href === "/cart" ? (
                <Link
                  key={it.href}
                  href={it.href}
                  className={`relative flex h-10 w-10 items-center justify-center rounded-md transition-colors hover:bg-black/5 dark:hover:bg-white/10 ${
                    isActive(it.href) ? "bg-black/5 dark:bg-white/10" : ""
                  }`}
                  aria-label="View cart"
                  aria-current={isActive(it.href) ? "page" : undefined}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <circle cx="9" cy="19" r="1.5" />
                    <circle cx="17" cy="19" r="1.5" />
                    <path d="M3 4h2l2.5 10.5a1 1 0 0 0 .97.75H17a1 1 0 0 0 .97-.75L20 8H6" />
                  </svg>
                  {cartCount > 0 ? (
                    <span className="absolute -top-1 -right-1 inline-flex min-h-[1.25rem] min-w-[1.25rem] items-center justify-center rounded-full bg-emerald-600 px-1 text-[11px] font-semibold text-white">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  ) : null}
                </Link>
              ) : (
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
              )
            ))}
          </nav>
          {isAdmin ? (
            <div className="hidden md:flex items-center gap-2">
              <AuthButton />
            </div>
          ) : null}
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
          {isAdmin ? (
            <div className="mb-3 pb-3 border-b border-black/10 dark:border-white/10 md:hidden flex items-center justify-end gap-2">
              <AuthButton />
            </div>
          ) : null}
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
