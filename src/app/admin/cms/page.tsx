// Admin CMS shell with tabs
import Link from "next/link";
import AdminGuard from "@/app/admin/AdminGuard";

export const dynamic = "force-dynamic";

export default function AdminCMSPage() {
  const tabs = [
    { href: "/admin/cms/home", label: "Home" },
    { href: "/admin/cms/products", label: "Products" },
    { href: "/admin/cms/media", label: "Media" },
    { href: "/admin/cms/seo", label: "SEO" },
    { href: "/admin/cms/info", label: "Info" },
    { href: "/admin/cms/faq", label: "FAQ" },
    { href: "/admin/cms/gallery", label: "Gallery" },
    { href: "/admin/cms/builder/pricing", label: "Builder Pricing" },
    { href: "/admin/cms/builder/extras-images", label: "Builder Extras Images" },
  ];
  return (
    <main className="min-h-screen w-full p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-semibold">Admin CMS</h1>
          <Link href="/admin" className="text-sm underline">← Admin Dashboard</Link>
        </div>
        <AdminGuard>
          <nav className="flex items-center gap-2 mb-4">
            {tabs.map((t) => (
              <Link key={t.href} href={t.href} className="inline-flex h-9 px-3 rounded-md border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 text-sm">
                {t.label}
              </Link>
            ))}
          </nav>
          <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 text-sm">Choose a tab to manage products, media, SEO, or builder pricing.</div>
        </AdminGuard>
      </div>
    </main>
  );
}
