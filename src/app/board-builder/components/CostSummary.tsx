"use client";

import { formatCurrency } from "@/lib/money";
import { PRICING_SSO } from "@/app/board-builder/pricing";

export default function CostSummary({
  base,
  variable,
  cellCount,
  juiceGrooveEnabled,
  brassFeetEnabled = false,
  total,
  etaLabel,
  hideCellsRow = false,
}: {
  base: number;
  variable: number;
  cellCount: number;
  juiceGrooveEnabled: boolean;
  brassFeetEnabled?: boolean;
  total: number;
  etaLabel?: string;
  hideCellsRow?: boolean;
}) {
  return (
    <div className="space-y-1 text-sm">
      <div className="flex justify-between">
        <span>Base</span>
        <span>{formatCurrency(base)}</span>
      </div>
      {!hideCellsRow ? (
        <div className="flex justify-between">
          <span>
            Cells ({cellCount} × {formatCurrency(PRICING_SSO.cellPrice)})
          </span>
          <span>{formatCurrency(variable)}</span>
        </div>
      ) : null}
      {juiceGrooveEnabled && (
        <div className="flex justify-between">
          <span>Juice groove</span>
          <span>+{formatCurrency(PRICING_SSO.extras.juiceGroove)}</span>
        </div>
      )}
      {brassFeetEnabled && (
        <div className="flex justify-between">
          <span>Brass feet</span>
          <span>+{formatCurrency(PRICING_SSO.extras.brassFeet ?? 0)}</span>
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
