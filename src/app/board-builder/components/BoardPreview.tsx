import { useMemo, useState } from "react";
import PreviewRow from "./preview/PreviewRow";

type Props = {
  isDrawerOpen: boolean;
  onToggleDrawer: () => void;
  boardData: {
    strips: (string | null)[][];
    order: { stripNo: number; reflected: boolean }[];
  };
  size: "small" | "regular" | "large";
  onReverseRow?: (_rowIndex: number) => void;
  strip3Enabled?: boolean;
  onChangeRowStrip?: (_rowIndex: number, _stripNo: number) => void;
  interactive?: boolean;
  minimal?: boolean; // for extras page: no bg, no labels, no gaps
};

export default function BoardPreview({
  isDrawerOpen: _isDrawerOpen,
  onToggleDrawer: _onToggleDrawer,
  boardData,
  size,
  onReverseRow,
  strip3Enabled = false,
  onChangeRowStrip,
  interactive = true,
  minimal = false,
}: Props) {
  // Reference optional props to satisfy no-unused-vars without altering behavior
  void _isDrawerOpen; // kept for potential future UI linkage
  void _onToggleDrawer;
  const cols = boardData.strips[0]?.length ?? 13;
  const cellPx = 12; // fixed square size in pixels
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [deselectingRows, setDeselectingRows] = useState<Set<number>>(
    new Set()
  );
  const effectiveOrder = useMemo(() => {
    if (boardData.order && boardData.order.length) return boardData.order;
    const rows = size === "small" ? 11 : size === "regular" ? 15 : 16;
    return Array.from({ length: rows }, (_, i) => ({
      stripNo: i % 2 === 0 ? 1 : 2,
      reflected: false,
    }));
  }, [boardData.order, size]);
  const onRowClick = (index: number) => {
    if (!interactive) return;
    setSelectedRow((prev) => {
      if (prev === index) {
        const next = new Set(deselectingRows);
        next.add(index);
        setDeselectingRows(next);
        return null;
      }
      return index;
    });
  };
  const onRowTransitionEnd = (
    index: number,
    e: React.TransitionEvent<HTMLButtonElement>
  ) => {
    if (!deselectingRows.has(index)) return;
    if (e.propertyName.includes("padding")) {
      const next = new Set(deselectingRows);
      next.delete(index);
      setDeselectingRows(next);
    }
  };

  return (
    <section
      className={`row-span-1 h-full w-full flex items-center justify-center ${
        minimal ? "" : "border-b border-black/10 dark:border-white/10"
      }`}
    >
      <div
        className={`relative w-full h-full ${
          minimal ? "" : "rounded-lg bg-black/[.03] dark:bg-white/[.06]"
        }`}
      >
        {/* Preview grid */}
        <div className="absolute inset-0 p-2 pt-6 pr-3 sm:p-4 sm:pt-12 sm:pr-6">
          <div
            className={`h-full w-full overflow-hidden flex flex-col items-center justify-center ${
              minimal ? "gap-0" : "gap-[3px]"
            }`}
          >
            {effectiveOrder.map((rowObj, i) => {
              const stripIndex = Math.max(
                0,
                Math.min(2, (rowObj?.stripNo ?? 1) - 1)
              );
              const rowColors: (string | null)[] = boardData.strips[stripIndex] ?? [];
              const displayColors = rowObj?.reflected
                ? rowColors.slice().reverse()
                : rowColors;
              const colCount = rowColors.length || cols;
              const handleClick = () => onRowClick(i);
              const handleTransitionEnd = (
                idx: number,
                e: React.TransitionEvent<HTMLButtonElement>
              ) => onRowTransitionEnd(idx, e);
              return (
                <div key={i} className="relative w-full flex items-center justify-center">
                  <div className="relative inline-block">
                    <PreviewRow
                      index={i}
                      stripNo={rowObj?.stripNo as number}
                      colors={displayColors as (string | null)[]}
                      reflected={!!rowObj?.reflected}
                      colCount={colCount}
                      cellPx={cellPx}
                      selected={selectedRow === i}
                      deselecting={deselectingRows.has(i)}
                      compact={minimal}
                      {...(interactive ? { onClick: handleClick } : {})}
                      onTransitionEnd={handleTransitionEnd}
                    />
                    {!minimal && (
                      <span className="pointer-events-none absolute left-full ml-1 top-1/2 -translate-y-1/2 z-20 text-sm sm:text-base font-semibold text-foreground/90">
                        {rowObj?.stripNo}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {interactive && !minimal && (
          <div
            className={`absolute left-2 top-1/2 -translate-y-1/2 z-30 transform transition-all duration-300 ease-in-out ${
              selectedRow != null
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-6 pointer-events-none"
            }`}
          >
            <div className="w-12 rounded-md border border-black/15 dark:border-white/15 bg-white/90 dark:bg-black/50 backdrop-blur shadow p-1.5">
              <div className="flex flex-col items-stretch gap-2">
                <button
                  type="button"
                  aria-label="Reverse row"
                  title={selectedRow != null ? "Reverse row" : "Select a row to reverse"}
                  onClick={() => {
                    if (selectedRow != null && typeof onReverseRow === "function") onReverseRow(selectedRow);
                  }}
                  disabled={selectedRow == null}
                  className={`inline-flex items-center justify-center h-7 w-7 rounded-md border border-black/15 dark:border-white/15 shadow ${
                    selectedRow != null ? "bg-white/80 dark:bg-black/40 hover:bg-black/5 dark:hover:bg-white/10" : "opacity-50 cursor-not-allowed bg-white/60 dark:bg-black/20"
                  }`}
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
                    <path d="M3 12h18" />
                    <path d="M7 8l-4 4 4 4" />
                    <path d="M17 16l4-4-4-4" />
                  </svg>
                </button>

                <div className="mt-1">
                  <div className="text-[8px] text-center font-semibold uppercase text-foreground/80">Change</div>
                  <div className="text-[8px] text-center font-semibold uppercase text-foreground/80">strip</div>
                </div>
                {[1,2,3].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => {
                      if (selectedRow == null) return;
                      if (n === 3 && !strip3Enabled) return;
                      onChangeRowStrip?.(selectedRow, n);
                    }}
                    disabled={selectedRow == null || (n === 3 && !strip3Enabled)}
                    aria-disabled={selectedRow == null || (n === 3 && !strip3Enabled)}
                    className={`relative h-6 rounded border border-black/15 dark:border-white/15 text-[14px] ${
                      selectedRow != null && (n !== 3 || strip3Enabled)
                        ? "hover:bg-black/5 dark:hover:bg-white/10"
                        : "opacity-50 cursor-not-allowed"
                    }`}
                  >
                    {n}
                    {n === 3 && !strip3Enabled && (
                      <svg aria-hidden="true" className="pointer-events-none absolute inset-0" viewBox="0 0 24 24">
                        <line x1="4" y1="20" x2="20" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
