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
  onClick?: (_index: number) => void;
  onTransitionEnd?: (
    _index: number,
    _event: React.TransitionEvent<HTMLButtonElement>
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
  const gridClass = `relative grid ${compact ? "gap-0" : "gap-[2px]"} transition-all duration-300 ease-in-out overflow-hidden ${paddingClass}`;
  const style = { gridTemplateColumns: `repeat(${colCount}, ${cellPx}px)` } as React.CSSProperties;
  const cells = (colors.length ? colors : (Array.from({ length: colCount }) as (string | null)[])).map((c: string | null, ci: number) => (
    <div
      key={ci}
      className={compact ? undefined : "border border-black/10 dark:border-white/10"}
      style={{
        width: `${cellPx}px`,
        height: `${cellPx}px`,
        ...(typeof c === "string" ? styleForToken(c, cellPx) : { backgroundColor: "transparent" }),
      }}
    />
  ));
  // Render non-interactive grid when no click handler is provided (used on product/extras previews)
  if (!onClick) {
    return (
      <div className={gridClass} style={style} aria-hidden>
        {cells}
      </div>
    );
  }
  // Interactive rows (builder)
  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onClick(index)}
      onTransitionEnd={onTransitionEnd ? (e) => onTransitionEnd(index, e) : undefined}
      className={`${gridClass} outline-none focus:ring-2 focus:ring-black/30 dark:focus:ring-white/30`}
      style={style}
      aria-label={`Row ${index + 1}: strip ${stripNo}`}
      title={`Row ${index + 1}`}
    >
      {cells}
    </button>
  );
});

export default PreviewRow;
