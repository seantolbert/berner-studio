import Link from "next/link";
import { adminSupabase } from "@/lib/supabase/serverAdmin";
import { formatCurrencyCents } from "@/lib/money";
import AdminGuard from "@/app/admin/AdminGuard";

export const dynamic = "force-dynamic";

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "published"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-100"
      : status === "draft"
      ? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
      : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-100";
  return <span className={`text-[11px] px-2 py-0.5 rounded ${cls}`}>{status}</span>;
}

type PageSearchParams = Record<string, string | string[] | undefined>;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams>;
}) {
  const params = searchParams ? await searchParams : {};
  const rawQ = params?.q;
  const rawStatus = params?.status;
  const q = Array.isArray(rawQ) ? rawQ[0] ?? "" : rawQ ?? "";
  const status = Array.isArray(rawStatus) ? rawStatus[0] ?? "" : rawStatus ?? "";

  let query = adminSupabase
    ?.from("products")
    .select("id, slug, name, price_cents, category, status, updated_at")
    .order("updated_at", { ascending: false })
    .limit(50);

  if (!adminSupabase) {
    return (
      <main className="min-h-screen w-full p-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-semibold mb-3">Products</h1>
          <div className="rounded-lg border border-black/10 dark:border-white/10 p-4">
            Admin client not configured. Set SUPABASE_SERVICE_ROLE_KEY.
          </div>
        </div>
      </main>
    );
  }

  if (q) query = query!.or(`name.ilike.%${q}%,slug.ilike.%${q}%`);
  if (status) query = query!.eq("status", status);

  type Product = {
    id: string;
    slug: string;
    name: string;
    price_cents: number;
    category: string;
    status: string;
    updated_at: string;
  };

  const { data: items, error } = await query!;

  return (
    <main className="min-h-screen w-full p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-semibold">Products</h1>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/admin" className="underline">Admin Dashboard</Link>
            <Link href="/admin/cms" className="underline">CMS Home</Link>
          </div>
        </div>
        <AdminGuard>
          <div className="mb-4 flex items-center justify-between">
            <Link href="/admin/cms" className="text-sm underline">
              Back to CMS
            </Link>
            <Link
              href="/admin/cms/products/new"
              className="inline-flex h-9 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
            >
              New Product
            </Link>
          </div>
          <form className="mb-3 flex items-center gap-2" method="get">
            <input
              name="q"
              defaultValue={q}
              placeholder="Search name or slug"
              className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm flex-1"
            />
            <select
              name="status"
              defaultValue={status}
              className="h-9 px-2 rounded-md border border-black/10 dark:border-white/10 text-sm"
            >
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
            <button className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 text-sm" type="submit">
              Filter
            </button>
          </form>
          <div className="rounded-lg border border-black/10 dark:border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-black/5 dark:bg-white/10">
                <tr>
                  <th className="text-left px-3 py-2">Name</th>
                  <th className="text-left px-3 py-2">Slug</th>
                  <th className="text-left px-3 py-2">Category</th>
                  <th className="text-left px-3 py-2">Price</th>
                  <th className="text-left px-3 py-2">Status</th>
                  <th className="text-left px-3 py-2">Updated</th>
                  <th className="text-left px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {error ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-red-600 dark:text-red-400">
                      {error.message}
                    </td>
                  </tr>
                ) : items && items.length > 0 ? (
                  (items as Product[]).map((p) => (
                    <tr key={p.id} className="border-t border-black/10 dark:border-white/10">
                      <td className="px-3 py-2">{p.name}</td>
                      <td className="px-3 py-2 font-mono text-xs">{p.slug}</td>
                      <td className="px-3 py-2">{p.category}</td>
                      <td className="px-3 py-2">{formatCurrencyCents(p.price_cents)}</td>
                      <td className="px-3 py-2"><StatusBadge status={p.status} /></td>
                      <td className="px-3 py-2 whitespace-nowrap">{new Date(p.updated_at).toLocaleString()}</td>
                      <td className="px-3 py-2">
                        <Link href={`/admin/cms/products/${p.id}`} className="text-sm underline">
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center opacity-70">
                      No products found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </AdminGuard>
      </div>
    </main>
  );
}
