"use client";

import { formatCurrencyCents } from "@/lib/money";
import type { CartItem } from "@/types/cart";
import type { ShippingOption } from "../types";

type OrderSummarySectionProps = {
  items: CartItem[];
  subtotal: number;
  shippingTotal: number;
  tax: number;
  selectedShipping: ShippingOption | null;
  promoDiscount: number;
  appliedPromo: string | null;
  promoDescription: string;
  promoCode: string;
  onPromoCodeChange: (value: string) => void;
  onApplyPromo: (event: React.FormEvent<HTMLFormElement>) => void;
  onRemovePromo: () => void;
  promoError: string | null;
  etaLabel?: string | undefined;
  orderTotal: number;
};

export default function OrderSummarySection({
  items,
  subtotal,
  shippingTotal,
  tax,
  selectedShipping,
  promoDiscount,
  appliedPromo,
  promoDescription,
  promoCode,
  onPromoCodeChange,
  onApplyPromo,
  onRemovePromo,
  promoError,
  etaLabel,
  orderTotal,
}: OrderSummarySectionProps) {
  return (
    <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 h-fit space-y-4">
      <div>
        <div className="text-lg font-semibold">Order summary</div>
        <p className="text-sm opacity-70">Review items before paying.</p>
      </div>

      <div className="space-y-3 text-sm">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between gap-3">
            <div>
              <div className="font-medium">{item.name}</div>
              <div className="text-xs opacity-70">Qty {item.quantity}</div>
            </div>
            <div className="text-right">{formatCurrencyCents(item.unitPrice * item.quantity)}</div>
          </div>
        ))}
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatCurrencyCents(subtotal)}</span>
        </div>
        <div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>{formatCurrencyCents(shippingTotal)}</span>
          </div>
          {selectedShipping && (
            <div className="text-xs opacity-70 flex justify-between">
              <span>{selectedShipping.label}</span>
              <span>{selectedShipping.description}</span>
            </div>
          )}
        </div>
        <div className="flex justify-between">
          <span>Tax</span>
          <span>{formatCurrencyCents(tax)}</span>
        </div>
        {promoDiscount > 0 && (
          <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
            <span>Promo ({appliedPromo})</span>
            <span>-{formatCurrencyCents(promoDiscount)}</span>
          </div>
        )}
      </div>

      <form className="space-y-2" onSubmit={onApplyPromo}>
        <label className="text-sm font-medium block">Promo code</label>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-md border border-black/15 dark:border-white/15 bg-transparent h-10 px-3 text-sm"
            type="text"
            value={promoCode}
            onChange={(event) => onPromoCodeChange(event.target.value)}
            placeholder="WELCOME10"
            disabled={Boolean(appliedPromo)}
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center h-10 px-4 rounded-md border border-black/15 dark:border-white/15 text-sm"
            disabled={Boolean(appliedPromo)}
          >
            Apply
          </button>
        </div>
        {promoError && <div className="text-xs text-red-600 dark:text-red-400">{promoError}</div>}
        {appliedPromo && (
          <div className="flex items-center justify-between text-xs rounded-md border border-emerald-400/40 text-emerald-600 dark:text-emerald-300 bg-emerald-500/5 px-3 py-2">
            <span>
              {appliedPromo} - {promoDescription}
            </span>
            <button type="button" onClick={onRemovePromo} className="underline">
              Remove
            </button>
          </div>
        )}
      </form>

      {etaLabel && <div className="text-xs opacity-70">{etaLabel}</div>}

      <div className="flex justify-between text-base font-medium pt-3 border-t border-black/10 dark:border-white/10">
        <span>Total</span>
        <span>{formatCurrencyCents(orderTotal)}</span>
      </div>
    </div>
  );
}
