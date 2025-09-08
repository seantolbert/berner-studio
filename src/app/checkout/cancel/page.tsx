"use client";

import { useRouter } from "next/navigation";

export default function CheckoutCancelPage() {
  const router = useRouter();
  return (
    <main className="min-h-screen w-full p-6">
      <div className="max-w-xl mx-auto rounded-lg border border-black/10 dark:border-white/10 p-6 text-center">
        <h1 className="text-2xl font-semibold mb-2">Payment canceled</h1>
        <p className="text-sm opacity-80 mb-4">
          Your payment was canceled or did not complete. You can try again or return to your cart.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/checkout")}
            className="inline-flex h-10 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => router.push("/cart")}
            className="inline-flex h-10 px-4 rounded-md border border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10"
          >
            Back to cart
          </button>
        </div>
      </div>
    </main>
  );
}

