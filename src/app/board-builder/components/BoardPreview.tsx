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
  onReverseRow?: (rowIndex: number) => void;
  strip3Enabled?: boolean;
  onChangeRowStrip?: (rowIndex: number, stripNo: number) => void;
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
  const cols = boardData.strips[0]?.length ?? 12;
  const cellPx = 12; // fixed square size in pixels
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [deselectingRows, setDeselectingRows] = useState<Set<number>>(
    new Set()
  );
  const effectiveOrder = useMemo(() => {
    if (boardData.order && boardData.order.length) return boardData.order;
    const rows = size === "small" ? 10 : size === "regular" ? 14 : 16;
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
              const handleClick: React.MouseEventHandler<
                HTMLButtonElement
              > = () => onRowClick(i);
              const handleTransitionEnd = (
                idx: number,
                e: React.TransitionEvent<HTMLButtonElement>
              ) => onRowTransitionEnd(idx, e);
              return (
                <div key={i} className="relative w-full flex items-center justify-center">
                  {(() => {
                    if (!interactive) return null;
                    const active = selectedRow === i;
                    const reflected = !!rowObj?.reflected;
                    const bgText = reflected
                      ? "bg-white text-black"
                      : "bg-white/80 dark:bg-black/40";
                    const isLatterHalf =
                      i >= Math.ceil((effectiveOrder?.length || 0) / 2);
                    return (
                      <div
                        className={`absolute left-2 top-1/2 -translate-y-1/2 transition-all duration-300 ease-in-out ${
                          active
                            ? "opacity-100 translate-x-0 z-20"
                            : "opacity-0 translate-x-6 pointer-events-none z-10"
                        }`}
                      >
                        {/* Reverse button */}
                        <button
                          type="button"
                          aria-label="Reverse row"
                          title="Reverse row"
                          onClick={() => {
                            if (onReverseRow) onReverseRow(i);
                          }}
                          className={`h-8 w-8 rounded-full border border-black/15 dark:border-white/15 ${bgText} backdrop-blur flex items-center justify-center shadow-sm`}
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

                        {/* Strip changer menu */}
                        {active && (
                          <div
                            className={`${
                              isLatterHalf
                                ? "bottom-full mb-1"
                                : "top-full mt-1"
                            } absolute left-0 w-12 rounded-md border border-black/15 dark:border-white/15 bg-white/90 dark:bg-black/50 backdrop-blur shadow p-1.5`}
                          >
                            <div className="flex flex-col gap-3">
                              <div>
                                <div className="text-[8px] text-center font-semibold uppercase text-foreground/80">
                                  Change
                                </div>
                                <div className="text-[8px] text-center font-semibold uppercase text-foreground/80">
                                  strip
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => onChangeRowStrip?.(i, 1)}
                                className="h-6 rounded border border-black/15 dark:border-white/15 text-[14px] hover:bg-black/5 dark:hover:bg-white/10"
                              >
                                1
                              </button>
                              <button
                                type="button"
                                onClick={() => onChangeRowStrip?.(i, 2)}
                                className="h-6 rounded border border-black/15 dark:border-white/15 text-[14px] hover:bg-black/5 dark:hover:bg-white/10"
                              >
                                2
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!strip3Enabled) return;
                                  onChangeRowStrip?.(i, 3);
                                }}
                                disabled={!strip3Enabled}
                                aria-disabled={!strip3Enabled}
                                className={`relative h-6 rounded border border-black/15 dark:border-white/15 text-[14px] ${
                                  strip3Enabled
                                    ? "hover:bg-black/5 dark:hover:bg-white/10"
                                    : "opacity-50 cursor-not-allowed"
                                }`}
                              >
                                3
                                {!strip3Enabled && (
                                  <svg
                                    aria-hidden="true"
                                    className="pointer-events-none absolute inset-0"
                                    viewBox="0 0 24 24"
                                  >
                                    <line
                                      x1="4"
                                      y1="20"
                                      x2="20"
                                      y2="4"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                    />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
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
                      onClick={interactive ? () => handleClick() : undefined}
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
      </div>
    </section>
  );
}
