import { MutableRefObject, useMemo, useRef, useState } from "react";

export type Size = "small" | "regular" | "large";
export type RowOrder = { stripNo: number; reflected: boolean };

export type RowDnDParams = {
  order: RowOrder[];
  size: Size;
  onReorder?: (nextOrder: RowOrder[]) => void;
};

export default function useRowDnD({ order, size, onReorder }: RowDnDParams) {
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [deselectingRows, setDeselectingRows] = useState<Set<number>>(new Set());
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const ignoreClickUntil = useRef<number>(0);
  const rowRefs: MutableRefObject<Array<HTMLButtonElement | null>> = useRef([]);

  const effectiveOrder = useMemo<RowOrder[]>(() => {
    if (order && order.length) return order;
    const rows = size === "small" ? 10 : size === "regular" ? 14 : 16;
    return Array.from({ length: rows }, (_, i) => ({ stripNo: i % 2 === 0 ? 1 : 2, reflected: false }));
  }, [order, size]);

  const toggleSelect = (index: number) => {
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

  const onRowClick = (index: number) => {
    if (Date.now() < (ignoreClickUntil.current || 0)) return;
    toggleSelect(index);
  };

  const onRowDragStart = (index: number, e: React.DragEvent<HTMLButtonElement>) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };
  const onRowDragOver = (_index: number, e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const onRowDrop = (index: number, e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    if (!onReorder) return;
    const current = effectiveOrder.slice();
    const [moved] = current.splice(dragIndex, 1);
    current.splice(index, 0, moved);
    onReorder(current);
    if (selectedRow !== null) {
      rowRefs.current[selectedRow]?.blur?.();
      if (deselectingRows.size) {
        const next = new Set(deselectingRows);
        next.delete(selectedRow);
        setDeselectingRows(next);
      }
    }
    setDragIndex(null);
    setDragOverIndex(null);
    setSelectedRow(index);
  };
  const onRowDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const calcIndexFromPoint = (clientY: number) => {
    const refs = rowRefs.current;
    let target = refs.length - 1;
    for (let idx = 0; idx < refs.length; idx++) {
      const el = refs[idx];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      if (clientY < mid) {
        target = idx;
        break;
      }
    }
    return target;
  };

  const onRowTouchStart = (index: number) => {
    setDragIndex(index);
  };
  const onRowTouchMove = (e: React.TouchEvent<HTMLButtonElement>) => {
    if (dragIndex === null) return;
    const t = e.touches[0];
    const idx = calcIndexFromPoint(t.clientY);
    setDragOverIndex(idx);
  };
  const onRowTouchEnd = (index: number) => {
    if (dragIndex === null || dragOverIndex === null || dragOverIndex === dragIndex) {
      toggleSelect(index);
      setDragIndex(null);
      setDragOverIndex(null);
      ignoreClickUntil.current = Date.now() + 400;
      return;
    }
    if (!onReorder) return;
    const current = effectiveOrder.slice();
    const [moved] = current.splice(dragIndex, 1);
    current.splice(dragOverIndex, 0, moved);
    onReorder(current);
    if (selectedRow !== null) {
      rowRefs.current[selectedRow]?.blur?.();
      if (deselectingRows.size) {
        const next = new Set(deselectingRows);
        next.delete(selectedRow);
        setDeselectingRows(next);
      }
    }
    setDragIndex(null);
    setDragOverIndex(null);
    setSelectedRow(dragOverIndex);
    ignoreClickUntil.current = Date.now() + 400;
  };
  const onRowTouchCancel = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const onRowTransitionEnd = (index: number, e: React.TransitionEvent<HTMLButtonElement>) => {
    if (!deselectingRows.has(index)) return;
    if (e.propertyName.includes("padding")) {
      const next = new Set(deselectingRows);
      next.delete(index);
      setDeselectingRows(next);
    }
  };

  return {
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
  };
}
