"use client";

import { useMemo } from "react";
import PreviewRow from "@/app/board-builder/components/preview/PreviewRow";

type Props = {
  strips: (string | null)[][];
  order: { stripNo: number; reflected: boolean }[];
  size: "small" | "regular" | "large";
  strip3Enabled?: boolean;
  className?: string;
};

export default function BoardTemplatePreview({ strips, order, size, strip3Enabled = false, className = "" }: Props) {
  const cols = strips[0]?.length ?? 12;
  const cellPx = 12;
  const effectiveOrder = useMemo(() => {
    if (order && order.length) return order;
    const rows = size === "small" ? 10 : size === "regular" ? 14 : 17;
    return Array.from({ length: rows }, (_, i) => ({ stripNo: i % 2 === 0 ? 1 : (strip3Enabled ? 3 : 2), reflected: false }));
  }, [order, size, strip3Enabled]);

  return (
    <div className={`w-full flex items-center justify-center ${className}`}>
      <div className="relative inline-block p-3">
        <div className="flex flex-col items-center justify-center gap-0">
          {effectiveOrder.map((rowObj, i) => {
            const stripIndex = Math.max(0, Math.min(2, (rowObj?.stripNo ?? 1) - 1));
            const rowColors: (string | null)[] = strips[stripIndex] ?? [];
            const displayColors = rowObj?.reflected ? rowColors.slice().reverse() : rowColors;
            const colCount = rowColors.length || cols;
            return (
              <div key={i} className="relative w-full flex items-center justify-center">
                <div className="relative inline-block">
                  <PreviewRow
                    index={i}
                    stripNo={rowObj?.stripNo as number}
                    colors={displayColors}
                    reflected={!!rowObj?.reflected}
                    colCount={colCount}
                    cellPx={cellPx}
                    selected={false}
                    deselecting={false}
                    compact
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
