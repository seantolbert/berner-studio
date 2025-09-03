import DrawerToggleTab from "./DrawerToggleTab";
import PreviewControls from "./preview/PreviewControls";
import PreviewRow from "./preview/PreviewRow";
import useRowDnD from "./preview/useRowDnD";

type Props = {
  isDrawerOpen: boolean;
  onToggleDrawer: () => void;
  boardData: {
    strips: (string | null)[][];
    order: { stripNo: number; reflected: boolean }[];
  };
  size: import("./preview/useRowDnD").Size;
  onReorder?: (nextOrder: import("./preview/useRowDnD").RowOrder[]) => void;
  onReverseRow?: (rowIndex: number) => void;
};

export default function BoardPreview({
  isDrawerOpen,
  onToggleDrawer,
  boardData,
  size,
  onReorder,
  onReverseRow,
}: Props) {
  const cols = boardData.strips[0]?.length ?? 12;
  const cellPx = 16; // fixed square size in pixels
  const {
    selectedRow,
    deselectingRows,
    dragIndex,
    dragOverIndex,
    rowRefs,
    effectiveOrder,
    onRowClick,
    onRowDragStart,
    onRowDragOver,
    onRowDrop,
    onRowDragEnd,
    onRowTouchStart,
    onRowTouchMove,
    onRowTouchEnd,
    onRowTouchCancel,
    onRowTransitionEnd,
  } = useRowDnD({ order: boardData.order, size, onReorder });

  return (
    <section className="row-span-1 p-4 flex items-center justify-center border-b border-black/10 dark:border-white/10">
      <div className="relative w-full h-full rounded-lg bg-black/[.03] dark:bg-white/[.06]">
        {/* Drawer toggle lives within preview only */}
        <DrawerToggleTab
          isOpen={isDrawerOpen}
          onToggle={onToggleDrawer}
          className="absolute right-0 top-1/2 -translate-y-1/2"
        />
        {/* Top-left controls */}
        <PreviewControls />

        {/* Preview grid */}
        <div className="absolute inset-0 p-4 pt-12 pr-6">
          <div
            className={`h-full w-full overflow-auto flex flex-col items-center justify-center gap-1 ${
              dragIndex !== null
                ? "touch-none select-none overscroll-contain"
                : ""
            }`}
          >
            {effectiveOrder.map((rowObj, i) => {
              const stripIndex = Math.max(
                0,
                Math.min(2, (rowObj?.stripNo ?? 1) - 1)
              );
              const rowColors = boardData.strips[stripIndex] ?? [];
              const displayColors = rowObj?.reflected
                ? rowColors.slice().reverse()
                : rowColors;
              const colCount = rowColors.length || cols;
              const handleClick: React.MouseEventHandler<
                HTMLButtonElement
              > = () => onRowClick(i);
              const handleDragStart: React.DragEventHandler<
                HTMLButtonElement
              > = (e) => onRowDragStart(i, e);
              const handleDragOver: React.DragEventHandler<
                HTMLButtonElement
              > = (e) => onRowDragOver(i, e);
              const handleDrop: React.DragEventHandler<HTMLButtonElement> = (
                e
              ) => onRowDrop(i, e);
              const handleDragEnd: React.DragEventHandler<
                HTMLButtonElement
              > = () => onRowDragEnd();
              const handleTouchStart: React.TouchEventHandler<
                HTMLButtonElement
              > = () => onRowTouchStart(i);
              const handleTouchMove: React.TouchEventHandler<
                HTMLButtonElement
              > = (e) => onRowTouchMove(e);
              const handleTouchEnd: React.TouchEventHandler<
                HTMLButtonElement
              > = () => onRowTouchEnd(i);
              const handleTouchCancel: React.TouchEventHandler<
                HTMLButtonElement
              > = () => onRowTouchCancel();
              const handleTransitionEnd = (
                idx: number,
                e: React.TransitionEvent<HTMLButtonElement>
              ) => onRowTransitionEnd(idx, e);
              return (
                <div
                  key={i}
                  className="relative w-full flex items-center justify-center"
                >
                  {(() => {
                    const active = selectedRow === i;
                    const reflected = !!rowObj?.reflected;
                    const bgText = reflected ? 'bg-white text-black' : 'bg-white/80 dark:bg-black/40';
                    return (
                      <button
                        type="button"
                        aria-label="Reverse row"
                        title="Reverse row"
                        onClick={() => {
                          if (onReverseRow) onReverseRow(i);
                        }}
                        className={`absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full border border-black/15 dark:border-white/15 ${bgText} backdrop-blur flex items-center justify-center shadow-sm transition-all duration-300 ease-in-out ${
                          active
                            ? "opacity-100 translate-x-0 z-20"
                            : "opacity-0 translate-x-6 pointer-events-none z-10"
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
                    );
                  })()}
                  <div className="relative inline-block">
                    <PreviewRow
                      ref={(el) => (rowRefs.current[i] = el)}
                      index={i}
                      stripNo={rowObj?.stripNo as number}
                      colors={displayColors as any}
                      reflected={!!rowObj?.reflected}
                      colCount={colCount}
                      cellPx={cellPx}
                      selected={selectedRow === i}
                      deselecting={deselectingRows.has(i)}
                      dragging={dragIndex === i}
                      dragOver={dragOverIndex === i}
                      onClick={() => handleClick()}
                      onDragStart={(_, e) => handleDragStart(e)}
                      onDragOver={(_, e) => handleDragOver(e)}
                      onDrop={(_, e) => handleDrop(e)}
                      onDragEnd={() => handleDragEnd()}
                      onTouchStart={() => handleTouchStart()}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={() => handleTouchEnd()}
                      onTouchCancel={handleTouchCancel}
                      onTransitionEnd={handleTransitionEnd}
                    />
                    <span className="pointer-events-none absolute left-full ml-1 top-1/2 -translate-y-1/2 z-20 text-sm sm:text-base font-semibold text-foreground/90">
                      {rowObj?.stripNo}
                    </span>
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
