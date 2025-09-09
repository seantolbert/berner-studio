import { ForwardedRef, forwardRef } from "react";
import { styleForToken } from "../woods";

type Props = {
  index: number;
  stripNo: number;
  colors: (string | null)[];
  colCount: number;
  cellPx: number;
  selected: boolean;
  deselecting?: boolean;
  reflected?: boolean;
  compact?: boolean;
  onClick?: (index: number) => void;
  onTransitionEnd?: (
    index: number,
    e: React.TransitionEvent<HTMLButtonElement>
  ) => void;
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
    compact = false,
    onClick,
    onTransitionEnd,
  }: Props,
  ref: ForwardedRef<HTMLButtonElement>
) {
  // Currently not altering styling; kept for future
  void reflected;
  void deselecting;
  // Tighter selection padding to avoid large vertical jumps
  const paddingClass = selected ? "py-3" : "py-0";
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick ? () => onClick(index) : undefined}
      onTransitionEnd={
        onTransitionEnd ? (e) => onTransitionEnd(index, e) : undefined
      }
      className={`relative grid ${compact ? "gap-0" : "gap-[2px]"} outline-none focus:ring-2 focus:ring-black/30 dark:focus:ring-white/30 transition-all duration-300 ease-in-out overflow-hidden ${paddingClass}`}
      style={{ gridTemplateColumns: `repeat(${colCount}, ${cellPx}px)` }}
      aria-label={`Row ${index + 1}: strip ${stripNo}`}
      title={`Row ${index + 1}`}
    >
      {(colors.length ? colors : (Array.from({ length: colCount }) as (string | null)[])).map(
        (c: string | null, ci: number) => (
          <div
            key={ci}
            className={compact ? undefined : "border border-black/10 dark:border-white/10"}
            style={{
              width: `${cellPx}px`,
              height: `${cellPx}px`,
              ...(typeof c === "string" ? styleForToken(c, cellPx) : { backgroundColor: "transparent" }),
            }}
          />
        )
      )}
    </button>
  );
});

export default PreviewRow;
