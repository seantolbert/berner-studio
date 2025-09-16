"use client";

import { formatCurrencyCents } from "@/lib/money";

export type CostSummaryProps = {
  baseCents: number;
  variableCents: number;
  cellCount: number;
  juiceGrooveEnabled?: boolean;
  brassFeetEnabled?: boolean;
  extrasDetail?: Array<{ label: string; amountCents: number }>;
  totalCents: number;
  etaLabel?: string;
};

export function ProductCostSummary({
  baseCents,
  variableCents,
  cellCount,
  juiceGrooveEnabled = false,
  brassFeetEnabled = false,
  extrasDetail,
  totalCents,
  etaLabel,
}: CostSummaryProps) {
  return (
    <div className="rounded-lg border border-black/10 dark:border-white/10 p-4">
      <div className="text-lg font-semibold mb-3">Cost Summary</div>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span>Base</span>
          <span>{formatCurrencyCents(baseCents)}</span>
        </div>
        <div className="flex justify-between">
          <span>
            Cells ({cellCount} × {formatCurrencyCents(Math.round(variableCents / Math.max(cellCount, 1)))} )
          </span>
          <span>{formatCurrencyCents(variableCents)}</span>
        </div>
        {juiceGrooveEnabled && (
          <div className="flex justify-between">
            <span>Juice groove</span>
            <span>+{formatCurrencyCents(extrasDetail?.find((e) => e.label === "Juice groove")?.amountCents ?? 0)}</span>
          </div>
        )}
        {brassFeetEnabled && (
          <div className="flex justify-between">
            <span>Brass feet</span>
            <span>+{formatCurrencyCents(extrasDetail?.find((e) => e.label === "Brass feet")?.amountCents ?? 0)}</span>
          </div>
        )}
        {extrasDetail?.filter((detail) => detail.label !== "Juice groove" && detail.label !== "Brass feet").map((detail) => (
          <div key={detail.label} className="flex justify-between">
            <span>{detail.label}</span>
            <span>+{formatCurrencyCents(detail.amountCents)}</span>
          </div>
        ))}
        <div className="border-t border-black/10 dark:border-white/10 my-2" />
        <div className="flex justify-between text-base font-medium">
          <span>Total</span>
          <span>{formatCurrencyCents(totalCents)}</span>
        </div>
        {etaLabel ? <div className="text-xs opacity-70">{etaLabel}</div> : null}
      </div>
    </div>
  );
}
