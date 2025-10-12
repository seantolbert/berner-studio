"use client";

import { useEffect } from "react";

type ProductErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ProductError({ error, reset }: ProductErrorProps) {
  useEffect(() => {
    console.error("Product page error", error);
  }, [error]);

  return (
    <main className="min-h-screen w-full px-6 py-16 flex flex-col items-center justify-center gap-4 text-center">
      <div className="text-lg font-medium">Something went wrong loading this product.</div>
      <div className="text-sm opacity-70">
        Please try again. If the problem persists, contact support and mention code {error.digest ?? "N/A"}.
      </div>
      <button
        type="button"
        onClick={reset}
        className="rounded-md border border-black/20 px-4 py-2 text-sm font-medium transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
      >
        Try again
      </button>
    </main>
  );
}
