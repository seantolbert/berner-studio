"use client";

import Link from "next/link";
import AdminGuard from "@/app/admin/AdminGuard";

type Card = { title: string; desc: string; href: string };

export default function AdminDashboardPage() {
  const content: Card[] = [
    { title: "Home CMS", desc: "Promo, hero, boards/bottle content", href: "/admin/cms/home" },
    { title: "Products", desc: "Create, edit, publish products", href: "/admin/cms/products" },
    { title: "Media", desc: "Upload and manage images", href: "/admin/cms/media" },
    { title: "SEO", desc: "Global SEO defaults", href: "/admin/cms/seo" },
    { title: "About", desc: "Edit About page content", href: "/admin/cms/about" },
    { title: "FAQ", desc: "Manage FAQs", href: "/admin/cms/faq" },
    { title: "Gallery", desc: "Manage gallery images", href: "/admin/cms/gallery" },
  ];
  const ops: Card[] = [
    { title: "Orders", desc: "View recent orders and payment status", href: "/admin/orders" },
  ];

  return (
    <main className="min-h-screen w-full p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold mb-2">Admin Dashboard</h1>
        <p className="text-sm opacity-80 mb-4">Quick links to manage site content and operations.</p>
        <AdminGuard>
          <section className="mb-6">
            <h2 className="text-base font-medium mb-2">Content</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {content.map((c) => (
                <Link
                  key={c.href}
                  href={c.href}
                  className="block rounded-lg border border-black/10 dark:border-white/10 p-4 hover:bg-black/5 dark:hover:bg-white/10 transition"
                >
                  <div className="text-sm font-medium mb-1">{c.title}</div>
                  <div className="text-xs opacity-70">{c.desc}</div>
                </Link>
              ))}
            </div>
          </section>
          <section>
            <h2 className="text-base font-medium mb-2">Operations</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ops.map((c) => (
                <Link
                  key={c.href}
                  href={c.href}
                  className="block rounded-lg border border-black/10 dark:border-white/10 p-4 hover:bg-black/5 dark:hover:bg-white/10 transition"
                >
                  <div className="text-sm font-medium mb-1">{c.title}</div>
                  <div className="text-xs opacity-70">{c.desc}</div>
                </Link>
              ))}
            </div>
          </section>
        </AdminGuard>
      </div>
    </main>
  );
}
