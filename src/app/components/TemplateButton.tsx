"use client";

import React, { useMemo } from "react";
import type { BoardTemplate } from "../templates";
import { styleForToken } from "../board-builder/components/woods";

type Props = {
  template: BoardTemplate;
  onClick?: () => void;
  className?: string;
};

export default function TemplateButton({
  template,
  onClick,
  className,
}: Props) {
  const { cells, cols } = useMemo(() => {
    const cols = template.strips?.[0]?.length || 12;
    const order = template.order || [];
    const rows = order.length;
    const cells: React.CSSProperties[] = [];

    for (let r = 0; r < rows; r++) {
      const o = order[r];
      const maxStripIndex = Math.min(
        (template.strip3Enabled ? 3 : 2) - 1,
        template.strips.length - 1
      );
      const stripIndex = Math.min(
        Math.max(0, (o?.stripNo ?? 1) - 1),
        maxStripIndex
      );
      const stripRow = template.strips[stripIndex] || [];
      const rowKeys = (
        o?.reflected ? stripRow.slice().reverse() : stripRow
      ).slice(0, cols);
      for (let c = 0; c < cols; c++) {
        const key = rowKeys[c] ?? null;
        const style = styleForToken(key, 5) || { backgroundColor: "#ddd" };
        cells.push(style as React.CSSProperties);
      }
    }
    return { cells, cols };
  }, [template]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={
        className ??
        "flex items-center justify-center rounded-md bg-white/70 dark:bg-black/30 p-3 hover:bg-black/5 dark:hover:bg-white/10"
      }
    >
      <div className="flex flex-col items-center gap-3">
        {/* Mini preview */}
        <div
          className="shrink-0 border border-black/10 dark:border-white/10"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, 5px)`,
            gap: 0,
            width: cols * 5,
          }}
          aria-hidden
        >
          {cells.map((cellStyle, i) => (
            <div key={i} style={{ width: 5, height: 5, ...cellStyle }} />
          ))}
        </div>

        {/* Title and meta */}
        <div className="w-full text-center">
          <div className="text-sm font-medium truncate" title={template.name}>{template.name}</div>
          <div className="text-xs opacity-70">
            {template.size} • {template.strip3Enabled ? "3 strips" : "2 strips"}
          </div>
        </div>
      </div>
    </button>
  );
}
