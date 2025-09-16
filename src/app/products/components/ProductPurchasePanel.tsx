"use client";

type ProductPurchasePanelProps = {
  onAddToCart: () => void;
  onGoToCart: () => void;
  disableAdd: boolean;
  added: boolean;
};

export function ProductPurchasePanel({
  onAddToCart,
  onGoToCart,
  disableAdd,
  added,
}: ProductPurchasePanelProps) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <button
        type="button"
        onClick={onAddToCart}
        className="inline-flex h-10 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
        disabled={disableAdd}
      >
        Add to cart
      </button>
      <button
        type="button"
        onClick={onGoToCart}
        className="inline-flex h-10 px-4 rounded-md border border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10"
      >
        Go to cart
      </button>
      {added && <div className="text-xs opacity-70">Added to cart.</div>}
    </div>
  );
}
