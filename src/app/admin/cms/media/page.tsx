// Media management placeholder
import Link from "next/link";
import AdminGuard from "@/app/admin/AdminGuard";

export const dynamic = "force-dynamic";

export default function AdminMediaPage() {
  return (
    <main className="min-h-screen w-full p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-semibold">Media</h1>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/admin" className="underline">Admin Dashboard</Link>
            <Link href="/admin/cms" className="underline">CMS Home</Link>
          </div>
        </div>
        <AdminGuard>
          <div className="mb-4">
            <Link href="/admin/cms" className="text-sm underline">Back to CMS</Link>
          </div>
          <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 text-sm">
            <p className="mb-2">Storage bucket: <code>media</code> (public read)</p>
            <p className="opacity-80">Next up: upload, list, and delete images with per-product organization.</p>
          </div>
        </AdminGuard>
      </div>
    </main>
  );
}
