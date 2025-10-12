"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { formatCurrencyCents } from "@/lib/money";

function formatUsd(cents: number) {
  return formatCurrencyCents(cents);
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<main className="min-h-screen w-full p-6">Loading…</main>}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}

function CheckoutSuccessContent() {
  const params = useSearchParams();
  const router = useRouter();
  const authorizedOnly = params.get("authorized") === "1";
  const [total, setTotal] = useState<number | null>(null);
  const [piInfo, setPiInfo] = useState<{ id: string; status?: string; amount?: number; currency?: string } | null>(null);
  const [order, setOrder] = useState<{ id: string; status: string } | null>(null);

  useEffect(() => {
    // On success, clear cart from localStorage.
    try {
      // Read last PaymentIntent info for display
      const last = localStorage.getItem("bs_last_pi");
      if (last) {
        try {
          const parsed = JSON.parse(last);
          if (parsed && typeof parsed.id === "string") setPiInfo(parsed);
        } catch {}
      }
      const raw = localStorage.getItem("bs_cart");
      if (raw) {
        const items = JSON.parse(raw) as { unitPrice: number; quantity: number }[];
        const t = Array.isArray(items)
          ? items.reduce((s, it) => s + (Number(it.unitPrice) || 0) * Math.max(1, Number(it.quantity) || 1), 0)
          : 0;
        setTotal(t);
      }
    } catch {}
    try {
      localStorage.removeItem("bs_cart");
    } catch {}
  }, []);

  // Fetch the corresponding Order (server-side) using the PI id
  useEffect(() => {
    let aborted = false;
    (async () => {
      if (!piInfo?.id) return;
      try {
        const res = await fetch("/api/orders/by-pi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ piId: piInfo.id }),
        });
        const data = await res.json();
        if (!res.ok) return;
        if (!aborted && data?.order?.id) {
          setOrder({ id: data.order.id, status: data.order.status });
        }
      } catch {
        // ignore; non-critical for UX
      }
    })();
    return () => { aborted = true; };
  }, [piInfo?.id]);

  const title = authorizedOnly ? "Payment authorized" : "Payment successful";
  const subtitle = authorizedOnly
    ? "Your card has been authorized. We'll capture the funds when your order begins production."
    : "Thank you! Your payment was processed successfully.";

  return (
    <main className="min-h-screen w-full p-6">
      <div className="max-w-xl mx-auto rounded-lg border border-black/10 dark:border-white/10 p-6 text-center">
        <h1 className="text-2xl font-semibold mb-2">{title}</h1>
        <p className="text-sm opacity-80 mb-4">{subtitle}</p>
        {typeof total === "number" && (
          <div className="text-sm opacity-70 mb-4">Total: {formatUsd(total)}</div>
        )}
        {piInfo?.id && (
          <div className="text-xs opacity-70 mb-4">
            PaymentIntent ID: <code className="px-1 py-0.5 rounded bg-black/5 dark:bg-white/10">{piInfo.id}</code>
          </div>
        )}
        {order?.id && (
          <div className="text-xs opacity-70 mb-4">
            Order ID: <code className="px-1 py-0.5 rounded bg-black/5 dark:bg-white/10">{order.id}</code>
            {" "}(<span className="capitalize">{order.status}</span>)
          </div>
        )}
        {authorizedOnly && piInfo?.id && (
          <div className="text-xs opacity-70 mb-4">
            To capture later (test): POST <code>/api/capture/{piInfo.id}</code> with optional JSON <code>{'{'}&quot;amount_to_capture&quot;: cents{'}'}</code>.
          </div>
        )}
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="inline-flex h-10 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Continue shopping
          </button>
          <button
            type="button"
            onClick={() => router.push("/cart")}
            className="inline-flex h-10 px-4 rounded-md border border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10"
          >
            View cart
          </button>
        </div>
      </div>
    </main>
  );
}
