import { ForwardedRef, forwardRef } from "react";

type Props = {
  index: number;
  stripNo: number;
  colors: (string | null)[];
  colCount: number;
  cellPx: number;
  selected: boolean;
  deselecting?: boolean;
  reflected?: boolean;
  dragging: boolean;
  dragOver: boolean;
  onClick: (index: number) => void;
  onDragStart: (index: number, e: React.DragEvent<HTMLButtonElement>) => void;
  onDragOver: (index: number, e: React.DragEvent<HTMLButtonElement>) => void;
  onDrop: (index: number, e: React.DragEvent<HTMLButtonElement>) => void;
  onDragEnd: (index: number) => void;
  onTouchStart: (index: number) => void;
  onTouchMove: (e: React.TouchEvent<HTMLButtonElement>) => void;
  onTouchEnd: (index: number) => void;
  onTouchCancel: () => void;
  onTransitionEnd?: (index: number, e: React.TransitionEvent<HTMLButtonElement>) => void;
};

const PreviewRow = forwardRef(function PreviewRow(
  {
    index,
    stripNo,
    colors,
    colCount,
    cellPx,
    selected,
    deselecting = false,
    reflected = false,
    dragging,
    dragOver,
    onClick,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchCancel,
    onTransitionEnd,
  }: Props,
  ref: ForwardedRef<HTMLButtonElement>
) {
  const ringActive = selected || deselecting;
  // Tighter selection padding to avoid large vertical jumps
  const paddingClass = selected ? "py-2" : "py-0";
  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onClick(index)}
      draggable
      onDragStart={(e) => onDragStart(index, e)}
      onDragOver={(e) => onDragOver(index, e)}
      onDrop={(e) => onDrop(index, e)}
      onDragEnd={() => onDragEnd(index)}
      onTouchStart={() => onTouchStart(index)}
      onTouchMove={onTouchMove}
      onTouchEnd={() => onTouchEnd(index)}
      onTouchCancel={onTouchCancel}
      aria-grabbed={dragging}
      onTransitionEnd={onTransitionEnd ? (e) => onTransitionEnd(index, e) : undefined}
      className={`relative grid gap-[2px] outline-none focus:ring-2 focus:ring-black/30 dark:focus:ring-white/30 transition-all duration-300 ease-in-out overflow-hidden ${
        ringActive ? "ring-2 ring-black/40 dark:ring-white/40" : ""
      } ${paddingClass} ${dragging ? "opacity-70" : ""} ${dragOver ? "ring-2 ring-blue-400/70" : ""}`}
      style={{ gridTemplateColumns: `repeat(${colCount}, ${cellPx}px)` }}
      aria-label={`Row ${index + 1}: strip ${stripNo}`}
      title={`Row ${index + 1}`}
    >
      {(colors.length ? colors : Array.from({ length: colCount })).map((c: any, ci: number) => (
        <div
          key={ci}
          className="border border-black/10 dark:border-white/10"
          style={{
            width: `${cellPx}px`,
            height: `${cellPx}px`,
            backgroundColor: typeof c === "string" ? c : "transparent",
          }}
        />
      ))}
    </button>
  );
});

export default PreviewRow;
