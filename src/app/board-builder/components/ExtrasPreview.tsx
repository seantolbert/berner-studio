"use client";

import { useMemo } from "react";
import PreviewRow from "./preview/PreviewRow";

type Props = {
  boardData: {
    strips: (string | null)[][];
    order: { stripNo: number; reflected: boolean }[];
  };
  size: "small" | "regular" | "large";
  borderRadius?: number; // px
  grooveEnabled?: boolean;
  edgeProfile?: "square" | "chamfer" | "roundover";
  chamferSize?: number; // px size for 45° corner cut
};

// Minimal, non-interactive preview for the Extras page
// - No row numbers, no controls, no borders/backgrounds
// - No gaps between cells
export default function ExtrasPreview({
  boardData,
  size,
  borderRadius = 0,
  grooveEnabled = false,
  edgeProfile = "square",
  chamferSize = 8,
}: Props) {
  const cols = boardData.strips[0]?.length ?? 12;
  const cellPx = 12; // square size in pixels

  const effectiveOrder = useMemo(() => {
    if (boardData.order && boardData.order.length) return boardData.order;
    const rows = size === "small" ? 10 : size === "regular" ? 14 : 16;
    return Array.from({ length: rows }, (_, i) => ({
      stripNo: i % 2 === 0 ? 1 : 2,
      reflected: false,
    }));
  }, [boardData.order, size]);

  const rowsCount = effectiveOrder.length;
  const boardWidth = cols * cellPx;
  const boardHeight = rowsCount * cellPx; // compact rows (no gap)

  const grooveInset = useMemo(() => {
    return size === "small" ? 6 : size === "regular" ? 8 : 10;
  }, [size]);

  const grooveRadius = Math.max(0, borderRadius - grooveInset);

  // No edge shading on Extras preview per request

  return (
    <div className="inline-block">
      {/* Board canvas with border radius and edge profile shading */}
      <div
        className="relative"
        style={{
          width: `${boardWidth}px`,
          height: `${boardHeight}px`,
          borderRadius,
          overflow: "hidden",
          // Chamfer corners using clip-path polygon
          clipPath:
            edgeProfile === "chamfer"
              ? `polygon(${chamferSize}px 0, calc(100% - ${chamferSize}px) 0, 100% ${chamferSize}px, 100% calc(100% - ${chamferSize}px), calc(100% - ${chamferSize}px) 100%, ${chamferSize}px 100%, 0 calc(100% - ${chamferSize}px), 0 ${chamferSize}px)`
              : undefined,
        }}
      >
        {/* Rows */}
        <div className="absolute inset-0 flex flex-col gap-0 items-start justify-start">
          {effectiveOrder.map((rowObj, i) => {
            const stripIndex = Math.max(0, Math.min(2, (rowObj?.stripNo ?? 1) - 1));
            const rowColors: (string | null)[] = boardData.strips[stripIndex] ?? [];
            const displayColors: (string | null)[] = rowObj?.reflected ? rowColors.slice().reverse() : rowColors;
            const colCount = rowColors.length || cols;
            return (
              <div key={i} className="relative w-full flex items-start justify-start">
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

        {/* Juice groove overlay */}
        {grooveEnabled && (
          <div
            className="absolute pointer-events-none z-30"
            style={{
              top: `${grooveInset}px`,
              left: `${grooveInset}px`,
              right: `${grooveInset}px`,
              bottom: `${grooveInset}px`,
              border: "3px solid black",
              borderRadius: grooveRadius,
            }}
          />
        )}
      </div>
    </div>
  );
}
