"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProductCategories } from "@/app/hooks/useProductCategories";

export default function AppFooter() {
  const pathname = usePathname() || "/";
  const { categories } = useProductCategories();

  // Hide footer on specific routes
  const hide =
    pathname.startsWith("/templates") ||
    pathname.startsWith("/board-builder"); // includes /board-builder and /board-builder/extras

  if (hide) return null;

  return (
    <footer className="w-full mt-10 border-t border-black/10 dark:border-white/10">
      <div className="mx-auto max-w-5xl p-6 grid gap-8 md:grid-cols-4">
        <div>
          <div className="text-base font-semibold mb-2">Berner Studio</div>
          <p className="text-sm opacity-70">
            Handcrafted cutting boards and essentials. Built to last, designed by you.
          </p>
        </div>
        <div>
          <div className="text-sm font-semibold mb-2">Shop</div>
          <ul className="text-sm space-y-1 opacity-80">
            {categories.length === 0 ? (
              <>
                <li><Link href="/products?category=boards" className="hover:underline">Boards</Link></li>
                <li><Link href="/products?category=bottle-openers" className="hover:underline">Bottle openers</Link></li>
                <li><Link href="/products?category=apparel" className="hover:underline">Apparel</Link></li>
              </>
            ) : (
              categories.map((cat) => (
                <li key={cat.id}>
                  <Link href={`/products?category=${encodeURIComponent(cat.slug)}`} className="hover:underline">
                    {cat.name}
                  </Link>
                </li>
              ))
            )}
            <li><Link href="/cart" className="hover:underline">Cart</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-semibold mb-2">Company</div>
          <ul className="text-sm space-y-1 opacity-80">
            <li><Link href="/info" className="hover:underline">Info</Link></li>
            <li><Link href="/faq" className="hover:underline">Care & FAQ</Link></li>
            <li><Link href="/gallery" className="hover:underline">Gallery</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-semibold mb-2">Stay in the loop</div>
          <p className="text-sm opacity-70 mb-3">Promos, launches, and tips. No spam.</p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="you@example.com"
              className="flex-1 h-10 px-3 rounded-md border border-black/15 dark:border-white/15 bg-transparent text-sm"
            />
            <button className="h-10 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm" type="button">Subscribe</button>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-6 pb-6 text-xs opacity-60 flex items-center justify-between">
        <span>© {new Date().getFullYear()} Berner Studio</span>
        <a href="#" className="hover:underline">Back to top</a>
      </div>
    </footer>
  );
}
