"use client";

import { woodByKey } from "./woods";

type Props = {
  selectedKey: string | null;
  boardData: {
    strips: (string | null)[][];
    order: { stripNo: number; reflected: boolean }[];
  };
  setBoardData: (
    updater:
      | {
          strips: (string | null)[][];
          order: { stripNo: number; reflected: boolean }[];
        }
      | ((prev: {
          strips: (string | null)[][];
          order: { stripNo: number; reflected: boolean }[];
        }) => {
          strips: (string | null)[][];
          order: { stripNo: number; reflected: boolean }[];
        })
  ) => void;
  strip3Enabled: boolean;
  onToggleStrip3: () => void;
};

export default function Strips({
  selectedKey,
  boardData,
  setBoardData,
  strip3Enabled,
  onToggleStrip3,
}: Props) {
  const handleClear = (row: number) => {
    const cols = boardData.strips[row]?.length ?? 12;
    const next = {
      strips: boardData.strips.map((r, ri) =>
        ri === row ? Array<string | null>(cols).fill(null) : r.slice()
      ),
      order: boardData.order.map((o) => ({ ...o })),
    };
    console.log("Board Data (cleared strip):", next);
    setBoardData(next);
  };
  const handlePaint = (row: number, col: number) => {
    if (!selectedKey) return;
    const color = woodByKey[selectedKey]?.color ?? null;
    const next = {
      strips: boardData.strips.map((r, ri) =>
        ri === row ? r.slice() : r.slice()
      ),
      order: boardData.order.map((o) => ({ ...o })),
    };
    next.strips[row][col] = color;
    // Log the JSON object after update
    console.log("Board Data:", next);
    setBoardData(next);
  };

  const StripRow = ({ row }: { row: number }) => (
    <div className="relative w-full flex items-center gap-2">
      {/* Row number (click to toggle strip 3) */}
      <button
        type="button"
        onClick={row === 2 ? onToggleStrip3 : undefined}
        disabled={row !== 2}
        aria-pressed={row === 2 ? strip3Enabled : undefined}
        title={row === 2 ? (strip3Enabled ? "Disable strip 3" : "Enable strip 3") : undefined}
        className={`inline-flex items-center justify-center h-8 sm:h-8 w-8 rounded-sm border border-black/15 dark:border-white/15 text-xs font-medium ${
          row === 2 && !strip3Enabled ? "opacity-60" : ""
        }`}
      >
        {row + 1}
      </button>

      {/* Cells scroller */}
      <div className="flex-1 w-px overflow-x-auto">
        <div className={`h-full flex items-center min-w-max gap-1`}>
          {boardData.strips[row].map((cellColor, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handlePaint(row, i)}
              className={`h-8 ${
                boardData.strips[row].length >= 14 ? "w-5" : "w-6"
              } rounded-sm border border-black/15 dark:border-white/15 focus:outline-none focus:ring-2 focus:ring-black/30 dark:focus:ring-white/30 ${
                cellColor ? "bg-transparent" : "bg-white/60 dark:bg-black/20"
              }`}
              style={cellColor ? { backgroundColor: cellColor } : undefined}
              aria-label={`Row ${row + 1} cell ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Clear (trash) */}
      <button
        type="button"
        aria-label="Clear strip"
        title="Clear strip"
        onClick={() => handleClear(row)}
        className="inline-flex items-center justify-center h-8 w-8 rounded-sm border border-black/15 dark:border-white/15 bg-white/70 dark:bg-black/30 hover:bg-black/5 dark:hover:bg-white/10"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M3 6h18" />
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
        </svg>
      </button>
    </div>
  );

  return (
    <div className="relative rounded-lg h-full w-full p-3">
      <div className="grid grid-rows-3 gap-2">
        <StripRow row={0} />
        <StripRow row={1} />
        <StripRow row={2} />
      </div>
    </div>
  );
}
