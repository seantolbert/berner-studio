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

  useEffect(() => {
    // On success, clear cart from localStorage.
    try {
      // Read last PaymentIntent info for display
      const last = localStorage.getItem("bs_last_pi");
      if (last) {
        try {
          JSON.parse(last);
        } catch {}
        try {
          localStorage.removeItem("bs_last_pi");
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
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("cart:update"));
      }
    } catch {}
  }, []);

  const title = authorizedOnly ? "Payment authorized" : "Payment successful";
  const subtitle = authorizedOnly
    ? "Your card has been authorized. We\'ll capture the funds when your order begins production."
    : "Thank you! Your payment was processed successfully.";

  return (
    <main className="min-h-screen w-full p-6">
      <div className="max-w-xl mx-auto rounded-lg border border-black/10 dark:border-white/10 p-6 text-center">
        <h1 className="text-2xl font-semibold mb-2">{title}</h1>
        <p className="text-sm opacity-80 mb-4">{subtitle}</p>
        {typeof total === "number" && (
          <div className="text-sm opacity-70 mb-4">Total: {formatUsd(total)}</div>
        )}
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="inline-flex h-10 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Continue shopping
          </button>
        </div>
      </div>
    </main>
  );
}
