"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ExtrasPreview from "../board-builder/components/ExtrasPreview";
import { formatCurrencyCents } from "@/lib/money";

type Size = "small" | "regular" | "large";
type CartItem = {
  id: string;
  name: string;
  unitPrice: number; // cents
  quantity: number;
  breakdown?: { baseCents: number; variableCents: number; extrasCents: number };
  config?: {
    size: Size;
    strip3Enabled: boolean;
    boardData: { strips: (string | null)[][]; order: { stripNo: number; reflected: boolean }[] };
    extras: { edgeProfile: "square" | "roundover" | "chamfer"; borderRadius: number; chamferSize: number; grooveEnabled: boolean };
  };
};

function formatUsd(cents: number) {
  return formatCurrencyCents(cents);
}

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("bs_cart");
      const parsed = raw ? (JSON.parse(raw) as CartItem[]) : [];
      setItems(Array.isArray(parsed) ? parsed : []);
    } catch {
      setItems([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem("bs_cart", JSON.stringify(items));
      // Notify other components (e.g., mini-cart) of updates
      try { window.dispatchEvent(new CustomEvent("cart:update")); } catch {}
    } catch {}
  }, [items, loaded]);

  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0),
    [items]
  );

  const updateQty = (id: string, q: number) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, quantity: Math.max(1, q) } : it)));
  };
  const removeItem = (id: string) => setItems((prev) => prev.filter((it) => it.id !== id));

  return (
    <main className="min-h-screen w-full p-6">
      <div className="max-w-5xl mx-auto grid gap-6">
        <h1 className="text-2xl font-semibold">Cart</h1>

        {items.length === 0 ? (
          <div className="rounded-lg border border-black/10 dark:border-white/10 p-8 text-center">
            <div className="text-sm opacity-80 mb-3">Your cart is empty.</div>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="inline-flex h-10 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Continue shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-3">
              {items.map((it) => (
                <div key={it.id} className="flex gap-3 rounded-lg border border-black/10 dark:border-white/10 p-3 items-center">
                  <div className="h-16 w-16 rounded-md bg-black/5 dark:bg-white/10 overflow-hidden flex items-center justify-center" aria-hidden>
                    {it.config ? (
                      <div style={{ transform: "scale(0.35)", transformOrigin: "top left" }}>
                        <ExtrasPreview
                          boardData={it.config.boardData}
                          size={it.config.size}
                          borderRadius={it.config.extras.edgeProfile === "chamfer" ? 0 : it.config.extras.borderRadius}
                          edgeProfile={it.config.extras.edgeProfile}
                          chamferSize={it.config.extras.chamferSize}
                          grooveEnabled={it.config.extras.grooveEnabled}
                        />
                      </div>
                    ) : null}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Custom cutting board</div>
                    <div className="text-xs opacity-70">{formatUsd(it.unitPrice)}</div>
                    {it.breakdown && (
                      <div className="mt-1 text-[11px] opacity-70">
                        <div>Base: {formatUsd(it.breakdown.baseCents)}</div>
                        <div>Cells: {formatUsd(it.breakdown.variableCents)}</div>
                        {it.breakdown.extrasCents > 0 && (
                          <div>Extras: {formatUsd(it.breakdown.extrasCents)}</div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQty(it.id, it.quantity - 1)}
                      className="h-8 w-8 rounded-md border border-black/10 dark:border-white/10"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <div className="w-8 text-center text-sm">{it.quantity}</div>
                    <button
                      type="button"
                      onClick={() => updateQty(it.id, it.quantity + 1)}
                      className="h-8 w-8 rounded-md border border-black/10 dark:border-white/10"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(it.id)}
                    className="h-8 px-3 rounded-md border border-black/10 dark:border-white/10 text-xs"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 h-fit sticky top-4">
              <div className="text-lg font-semibold mb-3">Summary</div>
              <div className="flex justify-between text-sm mb-1">
                <span>Subtotal</span>
                <span>{formatUsd(subtotal)}</span>
              </div>
              <div className="text-xs opacity-70 mb-3">Taxes and shipping calculated at checkout.</div>
              <button
                type="button"
                onClick={() => router.push("/checkout")}
                className="w-full inline-flex h-10 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
