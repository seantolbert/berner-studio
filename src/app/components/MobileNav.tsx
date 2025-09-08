"use client";

import { useEffect, useRef, useState } from "react";
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

  // Mount/animation state for smooth enter/exit
  const [rendered, setRendered] = useState(false);
  const [animOpen, setAnimOpen] = useState(false);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (rendered && animOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [rendered, animOpen]);

  const openWithAnim = () => {
    setRendered(true);
    // allow next frame to apply transitions
    requestAnimationFrame(() => setAnimOpen(true));
  };
  const closeWithAnim = () => {
    setAnimOpen(false);
    setTimeout(() => setRendered(false), 220);
  };

  // Swipe-to-close gesture state
  const startYRef = useRef<number | null>(null);
  const dragYRef = useRef<number>(0);
  const [dragY, setDragY] = useState(0);

  const onTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    startYRef.current = e.touches[0]?.clientY ?? null;
    dragYRef.current = 0;
    setDragY(0);
  };
  const onTouchMove: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (startYRef.current == null) return;
    const dy = Math.max(0, (e.touches[0]?.clientY ?? 0) - startYRef.current);
    dragYRef.current = dy;
    setDragY(dy);
  };
  const onTouchEnd: React.TouchEventHandler<HTMLDivElement> = () => {
    const threshold = 80; // px
    if (dragYRef.current > threshold) {
      setOpen(false);
    }
    // reset
    startYRef.current = null;
    dragYRef.current = 0;
    setDragY(0);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (rendered && animOpen) {
            closeWithAnim();
            setOpen(false);
          } else {
            openWithAnim();
            setOpen(true);
          }
        }}
        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 md:hidden"
        aria-label={rendered && animOpen ? "Close menu" : "Open menu"}
        aria-expanded={rendered && animOpen}
      >
        <span className="relative block w-5 h-4">
          <span
            className={`absolute left-1/2 top-0 -translate-x-1/2 block h-[2px] w-5 bg-current transition-transform duration-200 ${
              animOpen ? "translate-y-[6px] rotate-45" : ""
            }`}
          />
          <span
            className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 block h-[2px] w-5 bg-current transition-opacity duration-150 ${
              animOpen ? "opacity-0" : "opacity-100"
            }`}
          />
          <span
            className={`absolute left-1/2 bottom-0 -translate-x-1/2 block h-[2px] w-5 bg-current transition-transform duration-200 ${
              animOpen ? "-translate-y-[6px] -rotate-45" : ""
            }`}
          />
        </span>
      </button>

      {rendered && (
        <div
          className={`fixed inset-0 z-50 md:hidden`}
          onClick={() => {
            closeWithAnim();
            setOpen(false);
          }}
        >
          <button
            type="button"
            aria-label="Close menu"
            className={`absolute inset-0 transition-opacity duration-200 ${animOpen ? "opacity-100" : "opacity-0"} bg-black/40 backdrop-blur-sm`}
            onClick={() => {
              closeWithAnim();
              setOpen(false);
            }}
          />
          <div
            className={`absolute right-0 left-0 top-0 rounded-b-2xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-zinc-900/90 shadow-2xl backdrop-blur-md transition-transform duration-200 ease-out ${animOpen ? "translate-y-0" : "-translate-y-6"} max-h-[80vh] overflow-auto`}
            style={{ transform: `${animOpen ? "" : ""} translateY(${dragY}px)`, paddingTop: "env(safe-area-inset-top)" }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={(e) => {
              onTouchEnd(e);
              // if user did a small swipe, snap back
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/10 dark:border-white/10">
              <div className="text-sm font-semibold">Menu</div>
              <div className="text-xs opacity-70">Swipe down or tap outside to close</div>
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
                      closeWithAnim();
                      setOpen(false);
                      router.push(l.href);
                    }}
                    className="w-full text-left px-3 py-3 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-transform duration-150 hover:translate-x-0.5"
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
