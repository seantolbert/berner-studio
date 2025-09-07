"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseUser } from "@/app/hooks/useSupabaseUser";

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const { user } = useSupabaseUser();
  const links: { label: string; href: string }[] = [
    { label: "Home", href: "/" },
    { label: "About the maker", href: "/about" },
    { label: "Care & FAQ", href: "/faq" },
    { label: "Gallery", href: "/gallery" },
    { label: "Cart", href: "/cart" },
    ...(user ? [{ label: "My designs", href: "/my-designs" }] : []),
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 md:hidden"
        aria-label="Open menu"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-2 right-2 left-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/10 dark:border-white/10">
              <div className="text-sm font-semibold">Menu</div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-black/5 dark:hover:bg-white/10"
                aria-label="Close menu"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            {/* User info */}
            <div className="px-4 py-3 border-b border-black/10 dark:border-white/10 text-sm">
              {user ? (
                <div>
                  Signed in as <span className="font-medium">{user.email}</span>
                </div>
              ) : (
                <div className="opacity-75">Not signed in</div>
              )}
            </div>
            <nav className="p-2">
              {links.map((l) => (
                <button
                  key={l.href}
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      router.push(l.href);
                    }}
                    className="w-full text-left px-3 py-3 rounded-md hover:bg-black/5 dark:hover:bg-white/10"
                >
                  {l.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
