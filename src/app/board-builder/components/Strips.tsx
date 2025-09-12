"use client";

import { styleForToken } from "./woods";
import { PRICING_SSO } from "../pricing";
import { formatCurrency } from "@/lib/money";
import { useModal } from "./modal/ModalProvider";

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
  const { open, close } = useModal();

  const clearRow = (row: number) => {
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

  const confirmClear = (row: number) => {
    const rowLabel = `row ${row + 1}`;
    open(
      <div className="flex flex-col gap-4">
        <p className="text-sm">Are you sure you want to clear {rowLabel}?</p>
        <div className="flex items-center gap-2 justify-end">
          {/* Secondary action: remove 3rd strip when clearing row 3 */}
          {row === 2 && strip3Enabled && (
            <button
              type="button"
              onClick={() => {
                close();
                onToggleStrip3();
              }}
              className="inline-flex h-9 px-3 rounded-md border border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 text-sm"
            >
              Remove 3rd strip
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              clearRow(row);
              close();
            }}
            className="inline-flex items-center justify-center h-9 px-4 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 active:scale-[.99]"
          >
            Clear
          </button>
        </div>
      </div>,
      { title: "Confirm Clear", size: "sm", dismissible: true }
    );
  };
  const handlePaint = (row: number, col: number) => {
    if (!selectedKey) return;
    const key = selectedKey;
    // No-op if the cell is already this wood key
    const currentRow = boardData.strips[row] ?? [];
    if (currentRow[col] === key) return;
    const next = {
      strips: boardData.strips.map((r, ri) =>
        ri === row ? r.slice() : r.slice()
      ),
      order: boardData.order.map((o) => ({ ...o })),
    };
    const nextRow = next.strips[row] ?? [];
    if (!next.strips[row]) next.strips[row] = nextRow as (string | null)[];
    nextRow[col] = key;
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
        title={
          row === 2
            ? strip3Enabled
              ? "Disable strip 3"
              : "Enable strip 3"
            : undefined
        }
        className={`inline-flex items-center justify-center h-8 sm:h-8 w-8 rounded-full border border-black/15 dark:border-white/15 text-xs font-medium ${
          row === 2 && !strip3Enabled ? "opacity-60" : ""
        }`}
      >
        {row + 1}
      </button>

      {/* Cells scroller */}
      <div className="flex-1 w-px overflow-x-auto">
        <div
          className={`h-full flex items-center justify-center md:justify-start min-w-max gap-x-1.25`}
        >
          {(boardData.strips[row] ?? []).map((cellColor, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handlePaint(row, i)}
              className={`h-10 ${
                (boardData.strips[row]?.length ?? 0) >= 14 ? "w-4" : "w-5"
              } rounded-sm border border-black/15 dark:border-white/15 focus:outline-none focus:ring-2 focus:ring-black/30 dark:focus:ring-white/30 ${
                cellColor ? "bg-transparent" : "bg-white/60 dark:bg-black/20"
              }`}
              style={
                cellColor
                  ? styleForToken(
                      cellColor,
                      (boardData.strips[row]?.length ?? 0) >= 14 ? 16 : 20
                    )
                  : undefined
              }
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
        onClick={() => confirmClear(row)}
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
    <div className="relative rounded-lg h-full w-full pb-3">
      <div className="grid grid-rows-3 gap-5">
        <StripRow row={0} />
        <StripRow row={1} />
        {strip3Enabled ? (
          <StripRow row={2} />
        ) : (
          <button
            type="button"
            onClick={onToggleStrip3}
            aria-label="Add a third strip"
            className="w-full h-8 inline-flex items-center justify-center rounded-sm border border-black/15 dark:border-white/15 bg-white/60 dark:bg-black/20 hover:bg-black/5 dark:hover:bg-white/10 text-xs font-medium"
          >
            {`Add a 3rd strip +${formatCurrency(PRICING_SSO.extras.thirdStrip || 0)}`}
          </button>
        )}
      </div>
    </div>
  );
}
