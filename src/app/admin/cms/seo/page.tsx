// SEO management placeholder
import Link from "next/link";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const AdminGuard = require("@/app/admin/AdminGuard").default as any;

export const dynamic = "force-dynamic";

export default function AdminSEOPage() {
  return (
    <main className="min-h-screen w-full p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold mb-3">SEO Settings</h1>
        <AdminGuard>
          <div className="mb-4">
            <Link href="/admin/cms" className="text-sm underline">Back to CMS</Link>
          </div>
          <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 text-sm">
            <p className="mb-2">Global SEO controls will be added here (site title, description, default OG).</p>
            <p className="opacity-80">Per-product overrides editable from each product page.</p>
          </div>
        </AdminGuard>
      </div>
    </main>
  );
}

