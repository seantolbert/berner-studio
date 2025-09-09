import { adminSupabase } from "@/lib/supabase/serverAdmin";
import { formatCurrencyCents } from "@/lib/money";
import AdminGuard from "@/app/admin/AdminGuard";

function formatUsd(cents: number, currency = "usd") { return formatCurrencyCents(cents, currency); }

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  if (!adminSupabase) {
    return (
      <main className="min-h-screen w-full p-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-semibold mb-3">Orders</h1>
          <div className="rounded-lg border border-black/10 dark:border-white/10 p-4">
            Supabase admin client not configured. Set SUPABASE_SERVICE_ROLE_KEY in your environment.
          </div>
        </div>
      </main>
    );
  }

  const { data } = await adminSupabase
    .from("orders")
    .select("id, created_at, status, amount_cents, currency, capture_method, email, stripe_payment_intent_id")
    .order("created_at", { ascending: false })
    .limit(25);

  type OrderRow = {
    id: string;
    created_at: string;
    status: string;
    amount_cents: number;
    currency: string;
    capture_method: string;
    email: string | null;
    stripe_payment_intent_id: string | null;
  };

  const orders: OrderRow[] = (data as OrderRow[]) || [];

  return (
    <main className="min-h-screen w-full p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-semibold">Orders</h1>
          <div className="flex items-center gap-3 text-sm">
            <a href="/admin" className="underline">Admin Dashboard</a>
          </div>
        </div>
        <AdminGuard>
          <div className="rounded-lg border border-black/10 dark:border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-black/5 dark:bg-white/10">
                <tr>
                  <th className="text-left px-3 py-2">Created</th>
                  <th className="text-left px-3 py-2">Status</th>
                  <th className="text-left px-3 py-2">Amount</th>
                  <th className="text-left px-3 py-2">Capture</th>
                  <th className="text-left px-3 py-2">Email</th>
                  <th className="text-left px-3 py-2">Order ID</th>
                  <th className="text-left px-3 py-2">PI</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const pi = o.stripe_payment_intent_id as string | null;
                  const piShort = pi ? `${pi.slice(0, 10)}…` : "";
                  const created = new Date(o.created_at).toLocaleString();
                  return (
                    <tr key={o.id} className="border-t border-black/10 dark:border-white/10">
                      <td className="px-3 py-2 whitespace-nowrap">{created}</td>
                      <td className="px-3 py-2 capitalize">{o.status}</td>
                      <td className="px-3 py-2">{formatUsd(o.amount_cents, o.currency)}</td>
                      <td className="px-3 py-2">{o.capture_method}</td>
                      <td className="px-3 py-2">{o.email || "—"}</td>
                      <td className="px-3 py-2 font-mono text-xs">{o.id}</td>
                      <td className="px-3 py-2">
                        {pi ? (
                          <a className="underline" target="_blank" rel="noreferrer" href={`https://dashboard.stripe.com/test/payments/${pi}`}>{piShort}</a>
                        ) : (
                          <span className="opacity-60">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center opacity-70">No orders yet</td>
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
