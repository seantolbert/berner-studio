import { styleForToken } from "@/app/board-builder/components/woods";
import type { BoardExtras, BoardLayout, BoardSize } from "@/types/board";

type Options = {
  layout: BoardLayout;
  size: BoardSize;
  extras?: Partial<BoardExtras>;
};

function tokenToFill(token: string | null, cellPx: number): string {
  if (!token) return "#d4d0c7";
  const style = styleForToken(token, cellPx);
  const color = typeof style?.backgroundColor === "string" ? style.backgroundColor : null;
  if (color && color !== "transparent") return color;
  if (token.startsWith("#") || token.startsWith("rgb")) return token;
  return "#d4d0c7";
}

export function createBoardPreviewDataUrl({ layout, size, extras }: Options): string {
  const cellPx = 16;
  const cols = layout.strips[0]?.length ?? 0;
  const effectiveOrder = layout.order && layout.order.length
    ? layout.order
    : Array.from({ length: size === "small" ? 11 : size === "regular" ? 15 : 16 }, (_, index) => ({
        stripNo: index % 2 === 0 ? 1 : 2,
        reflected: false,
      }));

  const rows = effectiveOrder.length;
  const width = cols * cellPx;
  const height = rows * cellPx;
  const borderRadius = extras?.borderRadius ?? 0;
  const groove = extras?.grooveEnabled ? (size === "small" ? 6 : size === "regular" ? 8 : 10) : null;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
  svg += `<rect width="${width}" height="${height}" rx="${borderRadius}" ry="${borderRadius}" fill="#fdf5eb"/>`;

  effectiveOrder.forEach((row, rowIndex) => {
    const stripIndex = Math.max(0, Math.min(layout.strips.length - 1, (row?.stripNo ?? 1) - 1));
    const rowColors = layout.strips[stripIndex] ?? [];
    const displayColors = row?.reflected ? [...rowColors].reverse() : rowColors;
    for (let col = 0; col < cols; col += 1) {
      const color = tokenToFill(displayColors[col] ?? rowColors[col] ?? null, cellPx);
      svg += `<rect x="${col * cellPx}" y="${rowIndex * cellPx}" width="${cellPx}" height="${cellPx}" fill="${color}" />`;
    }
  });

  if (groove != null) {
    const inset = groove;
    const grooveRadius = Math.max(0, borderRadius - inset);
    const brass = extras?.grooveEnabled ? "0.4" : "0.25";
    svg += `<rect x="${inset}" y="${inset}" width="${width - inset * 2}" height="${height - inset * 2}" rx="${grooveRadius}" ry="${grooveRadius}" fill="none" stroke="rgba(0,0,0,${brass})" stroke-width="2"/>`;
  }

  svg += `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
