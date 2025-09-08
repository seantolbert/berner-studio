"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import useLocalCart from "@/app/hooks/useLocalCart";
import { formatCurrencyCents } from "@/lib/money";

export default function MiniCartDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter();
  const { items, subtotal, updateQty, removeItem, loaded } = useLocalCart();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        <Dialog.Content className="fixed right-0 top-0 h-full w-[92%] sm:w-[420px] bg-background shadow-2xl border-l border-black/10 dark:border-white/10 flex flex-col">
          <div className="p-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">Cart</Dialog.Title>
            <Dialog.Close asChild>
              <button aria-label="Close" className="h-8 w-8 rounded-md border border-black/10 dark:border-white/10">×</button>
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-auto p-3 space-y-2">
            {!loaded ? (
              <div className="text-sm opacity-70">Loading...</div>
            ) : items.length === 0 ? (
              <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 text-center text-sm opacity-80">
                Your cart is empty.
              </div>
            ) : (
              items.map((it) => (
                <div key={it.id} className="flex items-center gap-3 rounded-lg border border-black/10 dark:border-white/10 p-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" title={it.name || "Item"}>{it.name || "Item"}</div>
                    <div className="text-xs opacity-70">{formatCurrencyCents(it.unitPrice)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQty(it.id, it.quantity - 1)}
                      className="h-7 w-7 rounded-md border border-black/10 dark:border-white/10"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={it.quantity}
                      onChange={(e) => updateQty(it.id, parseInt(e.target.value || "1", 10))}
                      className="w-12 h-7 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-center text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => updateQty(it.id, it.quantity + 1)}
                      className="h-7 w-7 rounded-md border border-black/10 dark:border-white/10"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(it.id)}
                    className="h-7 px-2 rounded-md border border-black/10 dark:border-white/10 text-xs"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
          <div className="p-4 border-t border-black/10 dark:border-white/10">
            <div className="flex justify-between text-sm mb-2">
              <span>Subtotal</span>
              <span>{formatCurrencyCents(subtotal)}</span>
            </div>
            <div className="text-xs opacity-70 mb-3">Taxes and shipping calculated at checkout.</div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  router.push("/cart");
                }}
                className="flex-1 h-10 px-4 rounded-md border border-black/10 dark:border-white/10"
              >
                View cart
              </button>
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  router.push("/checkout");
                }}
                className="flex-1 h-10 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Checkout
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
