"use client";

import { woodByKey } from "./woods";

type Props = {
  selectedKey: string | null;
  boardData: { strips: (string | null)[][] };
  setBoardData: (
    updater:
      | { strips: (string | null)[][] }
      | ((prev: { strips: (string | null)[][] }) => {
          strips: (string | null)[][];
        })
  ) => void;
};

export default function Strips({
  selectedKey,
  boardData,
  setBoardData,
}: Props) {
  const handleClear = (row: number) => {
    const cols = boardData.strips[row]?.length ?? 12;
    const next = {
      strips: boardData.strips.map((r, ri) => (ri === row ? Array<string | null>(cols).fill(null) : r.slice())),
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
    };
    next.strips[row][col] = color;
    // Log the JSON object after update
    console.log("Board Data:", next);
    setBoardData(next);
  };

  const StripRow = ({ label, row }: { label: string; row: number }) => (
    <div className="relative h-full w-full">
      <div className="absolute top-2 left-3 right-3 flex items-center justify-between">
        <h4 className="text-sm font-medium">{label}</h4>
        <button
          type="button"
          aria-label="Clear strip"
          title="Clear strip"
          onClick={() => handleClear(row)}
          className="inline-flex items-center justify-center h-7 w-7 rounded-full border border-black/15 dark:border-white/15 bg-white/70 dark:bg-black/30 hover:bg-black/5 dark:hover:bg-white/10"
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
      <div className="w-full flex items-center justify-center pt-8 overflow-x-auto">
        <div className="h-full flex items-end gap-2 min-w-max">
          {boardData.strips[row].map((cellColor, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handlePaint(row, i)}
              className={`h-10 w-6 rounded-sm border border-black/15 dark:border-white/15 focus:outline-none focus:ring-2 focus:ring-black/30 dark:focus:ring-white/30 ${
                cellColor ? "bg-transparent" : "bg-white/60 dark:bg-black/20"
              }`}
              style={cellColor ? { backgroundColor: cellColor } : undefined}
              aria-label={`Cell ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative rounded-lg bg-black/[.03] dark:bg-white/[.06] h-full w-full p-3">
      <div className="grid grid-rows-3">
        <StripRow label="Strip 1" row={0} />
        <StripRow label="Strip 2" row={1} />
        <StripRow label="Strip 3" row={2} />
      </div>
    </div>
  );
}
