"use client";

import { useMemo } from "react";
import type { CSSProperties } from "react";
import { styleForToken } from "@/features/board-builder/lib/woods";

type Props = {
  strips: (string | null)[][];
  order: { stripNo: number; reflected: boolean }[];
  size: "small" | "regular" | "large";
  strip3Enabled?: boolean;
  cellPx?: number;
  className?: string;
  edgeProfile?: "square" | "roundover" | "chamfer";
  borderRadius?: number;
  chamferSize?: number;
  edgeOption?: string;
  handleStyle?: "none" | "glide" | "lift";
  showBrassFeet?: boolean;
};

export default function BoardTopRowPreview({
  strips,
  order,
  size,
  strip3Enabled = false,
  cellPx = 12,
  className = "",
  edgeProfile = "square",
  borderRadius = 0,
  chamferSize = 8,
  edgeOption,
  handleStyle = "none",
  showBrassFeet = false,
}: Props) {
  const { colors, colCount } = useMemo(() => {
    const cols = strips[0]?.length ?? 12;
    const rows = size === "small" ? 10 : size === "regular" ? 14 : 16;
    const effectiveOrder = (order && order.length
      ? order
      : Array.from({ length: rows }, (_, i) => ({ stripNo: i % 2 === 0 ? 1 : (strip3Enabled ? 3 : 2), reflected: false }))
    ) as { stripNo: number; reflected: boolean }[];
    const top = effectiveOrder[0] || { stripNo: 1, reflected: false };
    const stripIndex = Math.max(0, Math.min(2, (top.stripNo ?? 1) - 1));
    const row = strips[stripIndex] ?? Array<string | null>(cols).fill(null);
    const display = top.reflected ? row.slice().reverse() : row;
    return { colors: display, colCount: row.length || cols };
  }, [strips, order, size, strip3Enabled]);

  const gridStyle: CSSProperties = { gridTemplateColumns: `repeat(${colCount}, ${cellPx}px)` };
  const wPx = colCount * cellPx;
  const hPx = cellPx * 2;
  // Edge styling for top row (applies to both left/right ends)
  const shapeStyle: CSSProperties = (() => {
    // Prefer explicit edgeOption presets when provided
    const option = (edgeOption || "").toLowerCase();
    if (option) {
      if (option === "edged") return { overflow: "hidden" } as CSSProperties;
      if (option === "rounded4" || option === "rounded8") {
        const r = option === "rounded4" ? 4 : 8;
        return {
          borderTopLeftRadius: r,
          borderBottomLeftRadius: r,
          borderTopRightRadius: r,
          borderBottomRightRadius: r,
          overflow: "hidden",
        } as CSSProperties;
      }
      if (option === "double_chamfer") {
        const c = Math.max(1, Math.round(chamferSize || 8));
        return {
          overflow: "hidden",
          clipPath: `polygon(${c}px 0, calc(100% - ${c}px) 0, 100% ${c}px, 100% calc(100% - ${c}px), calc(100% - ${c}px) 100%, ${c}px 100%, 0 calc(100% - ${c}px), 0 ${c}px)`,
        } as CSSProperties;
      }
      if (option === "diamond") {
        const tX = 3, tY = 2, bX = 6, bY = 12;
        return {
          overflow: "hidden",
          clipPath: `polygon(${tX}px 0, calc(100% - ${tX}px) 0, 100% ${tY}px, 100% calc(100% - ${bY}px), calc(100% - ${bX}px) 100%, ${bX}px 100%, 0 calc(100% - ${bY}px), 0 ${tY}px)`,
        } as CSSProperties;
      }
      if (option === "flat_top") {
        const tX = 0, tY = 0, bX = 6, bY = 12;
        return {
          overflow: "hidden",
          clipPath: `polygon(${tX}px 0, calc(100% - ${tX}px) 0, 100% ${tY}px, 100% calc(100% - ${bY}px), calc(100% - ${bX}px) 100%, ${bX}px 100%, 0 calc(100% - ${bY}px), 0 ${tY}px)`,
        } as CSSProperties;
      }
    }
    if (edgeProfile === "roundover" && borderRadius > 0) {
      // Round both left and right vertical edges (top+bottom corners)
      return {
        borderTopLeftRadius: borderRadius,
        borderBottomLeftRadius: borderRadius,
        borderTopRightRadius: borderRadius,
        borderBottomRightRadius: borderRadius,
        overflow: "hidden",
      } as CSSProperties;
    }
    if (edgeProfile === "chamfer" && chamferSize > 0) {
      // Chamfer all four corners so the side profile is visible on both ends
      const c = Math.max(1, Math.round(chamferSize));
      return {
        overflow: "hidden",
        clipPath: `polygon(${c}px 0, calc(100% - ${c}px) 0, 100% ${c}px, 100% calc(100% - ${c}px), calc(100% - ${c}px) 100%, ${c}px 100%, 0 calc(100% - ${c}px), 0 ${c}px)`,
      } as CSSProperties;
    }
    return { overflow: "hidden" } as CSSProperties;
  })();

  return (
    <div className={`relative inline-block ${className}`} style={{ width: `${wPx}px`, height: `${hPx}px` }}>
      {/* Inner board area with edge shaping; allows brass feet to render outside */}
      <div className="absolute inset-0" style={{ ...shapeStyle }}>
        <div className="relative z-0 grid gap-0" style={gridStyle} aria-hidden>
          {colors.map((c, i) => (
            <div
              key={i}
              className="border border-black/10 dark:border-white/10"
              style={{
                width: `${cellPx}px`,
                height: `${cellPx * 2}px`,
                ...(typeof c === "string" ? styleForToken(c, cellPx) : { backgroundColor: "transparent" }),
              }}
            />
          ))}
        </div>
        {handleStyle === "glide" && (
          <div
            className="absolute z-10 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none bg-black/40 mix-blend-multiply"
            style={{ width: `${wPx * 0.6}px`, height: `${cellPx * 0.9}px` }}
          />
        )}
        {handleStyle === "lift" && (
          <div
            className="absolute z-10 left-1/2 pointer-events-none bg-black/40 mix-blend-multiply"
            style={{
              width: `${wPx * 0.6}px`,
              height: `${cellPx * 0.9}px`,
              bottom: 0,
              transform: `translateX(-50%)`,
              borderTopLeftRadius: 6,
              borderTopRightRadius: 6,
            }}
          />
        )}
      </div>
      {showBrassFeet && (
        <>
          <div
            className="absolute z-20 pointer-events-none"
            style={{
              left: 8,
              bottom: -6,
              width: Math.max(12, Math.round(cellPx * 1.2)),
              height: 6,
              background: '#d4af37',
              borderRadius: 2,
              boxShadow: '0 1px 2px rgba(0,0,0,0.25)'
            }}
          />
          <div
            className="absolute z-20 pointer-events-none"
            style={{
              right: 8,
              bottom: -6,
              width: Math.max(12, Math.round(cellPx * 1.2)),
              height: 6,
              background: '#d4af37',
              borderRadius: 2,
              boxShadow: '0 1px 2px rgba(0,0,0,0.25)'
            }}
          />
        </>
      )}
      {/* Thickness dimension removed per request */}
    </div>
  );
}
