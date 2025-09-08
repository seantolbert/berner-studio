// Admin CMS shell with tabs
import Link from "next/link";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const AdminGuard = require("@/app/admin/AdminGuard").default as any;

export const dynamic = "force-dynamic";

export default function AdminCMSPage() {
  const tabs = [
    { href: "/admin/cms/home", label: "Home" },
    { href: "/admin/cms/products", label: "Products" },
    { href: "/admin/cms/media", label: "Media" },
    { href: "/admin/cms/seo", label: "SEO" },
  ];
  return (
    <main className="min-h-screen w-full p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold mb-3">Admin CMS</h1>
        <AdminGuard>
          <nav className="flex items-center gap-2 mb-4">
            {tabs.map((t) => (
              <Link key={t.href} href={t.href} className="inline-flex h-9 px-3 rounded-md border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 text-sm">
                {t.label}
              </Link>
            ))}
          </nav>
          <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 text-sm">
            Choose a tab to manage products, media, or SEO settings.
          </div>
        </AdminGuard>
      </div>
    </main>
  );
}
