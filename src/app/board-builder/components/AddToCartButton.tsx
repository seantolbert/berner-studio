"use client";

import { useRouter } from "next/navigation";
import { useModal } from "../components/modal/ModalProvider";

export type Size = "small" | "regular" | "large";

export type CartSnapshot = {
  name: string;
  unitPriceCents: number;
  breakdown: { baseCents: number; variableCents: number; extrasCents: number };
  config: {
    size: Size;
    strip3Enabled: boolean;
    boardData: { strips: (string | null)[][]; order: { stripNo: number; reflected: boolean }[] };
    extras: { edgeProfile: "square" | "roundover" | "chamfer"; borderRadius: number; chamferSize: number; grooveEnabled: boolean };
  };
};

export default function AddToCartButton({ item }: { item: CartSnapshot }) {
  const { open, close } = useModal();
  const router = useRouter();

  const handleAdd = () => {
    try {
      const raw = localStorage.getItem("bs_cart");
      const arr = raw ? (JSON.parse(raw) as any[]) : [];
      const id = `cart-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const line = { id, name: item.name, unitPrice: item.unitPriceCents, quantity: 1, breakdown: item.breakdown, config: item.config };
      const next = Array.isArray(arr) ? [...arr, line] : [line];
      localStorage.setItem("bs_cart", JSON.stringify(next));
    } catch {}
    open(
      <div className="space-y-3">
        <div className="text-base font-medium">Added to cart</div>
        <div className="text-sm opacity-70">Your custom board has been added.</div>
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              close();
              router.push("/");
            }}
            className="inline-flex h-9 px-3 rounded-md border border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10"
          >
            Continue shopping
          </button>
          <button
            type="button"
            onClick={() => {
              close();
              router.push("/cart");
            }}
            className="inline-flex h-9 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Go to cart
          </button>
        </div>
      </div>,
      { title: "", size: "sm", dismissible: true }
    );
  };

  return (
    <button
      type="button"
      onClick={handleAdd}
      className="inline-flex h-10 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white"
    >
      Add to Cart
    </button>
  );
}

