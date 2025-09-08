"use client";

import { formatCurrency } from "@/lib/money";
import { PRICING_SSO } from "@/app/board-builder/pricing";

export default function CostSummary({
  base,
  variable,
  cellCount,
  juiceGrooveEnabled,
  total,
  etaLabel,
}: {
  base: number;
  variable: number;
  cellCount: number;
  juiceGrooveEnabled: boolean;
  total: number;
  etaLabel?: string;
}) {
  return (
    <div className="space-y-1 text-sm">
      <div className="flex justify-between">
        <span>Base</span>
        <span>{formatCurrency(base)}</span>
      </div>
      <div className="flex justify-between">
        <span>
          Cells ({cellCount} × {formatCurrency(PRICING_SSO.cellPrice)})
        </span>
        <span>{formatCurrency(variable)}</span>
      </div>
      {juiceGrooveEnabled && (
        <div className="flex justify-between">
          <span>Juice groove</span>
          <span>+{formatCurrency(PRICING_SSO.extras.juiceGroove)}</span>
        </div>
      )}
      <div className="border-t border-black/10 dark:border-white/10 my-2" />
      <div className="flex justify-between text-base font-medium">
        <span>Total</span>
        <span>{formatCurrency(total)}</span>
      </div>
      {etaLabel ? <div className="text-xs opacity-70">{etaLabel}</div> : null}
    </div>
  );
}

