"use client";

import { useEffect, useMemo, useState } from "react";
import { WOODS } from "../components/woods";
import type { RowOrder, Size } from "../components/preview/useRowDnD";

export function useBoardBuilder() {
  const [isOpen, setIsOpen] = useState(false);
  const [strip3Enabled, setStrip3Enabled] = useState(false);
  const [size, setSize] = useState<Size>("regular");

  const [boardData, setBoardData] = useState<{
    strips: (string | null)[][];
    order: RowOrder[];
  }>(() => ({
    strips: Array.from({ length: 3 }, () => Array<string | null>(12).fill(null)),
    order: Array.from({ length: 14 }, (_, i) => ({ stripNo: i % 2 === 0 ? 1 : 2, reflected: false })),
  }));

  const clone = (d: { strips: (string | null)[][]; order: RowOrder[] }) => ({
    strips: d.strips.map((r) => r.slice()),
    order: d.order.map((o) => ({ ...o })),
  });

  const [history, setHistory] = useState<typeof boardData[]>([]);
  const [future, setFuture] = useState<typeof boardData[]>([]);

  const setBoardDataWithHistory = (
    updater:
      | typeof boardData
      | ((prev: typeof boardData) => typeof boardData)
  ) => {
    setBoardData((prev) => {
      const prevClone = clone(prev);
      const next = typeof updater === "function" ? (updater as any)(prev) : updater;
      setHistory((h) => [...h, prevClone]);
      setFuture([]);
      return next;
    });
  };

  const canUndo = history.length > 0;
  const canRedo = future.length > 0;

  const handleUndo = () => {
    if (!canUndo) return;
    setBoardData((current) => {
      const prev = history[history.length - 1];
      setHistory((h) => h.slice(0, -1));
      setFuture((f) => [...f, clone(current)]);
      const nextState = clone(prev);
      console.log("Undo applied. Board Data:", nextState);
      return nextState;
    });
  };

  const handleRedo = () => {
    if (!canRedo) return;
    setBoardData((current) => {
      const nextItem = future[future.length - 1];
      setFuture((f) => f.slice(0, -1));
      setHistory((h) => [...h, clone(current)]);
      const nextState = clone(nextItem);
      console.log("Redo applied. Board Data:", nextState);
      return nextState;
    });
  };

  const handleRandomize = () => {
    const colors = WOODS.map((w) => w.color);
    const next = clone(boardData);
    next.strips = next.strips.map((row, ri) => {
      const active = ri !== 2 || strip3Enabled;
      if (!active) return row.slice();
      return row.map(() => colors[Math.floor(Math.random() * colors.length)]);
    });
    const allowedStrips = strip3Enabled ? [1, 2, 3] : [1, 2];
    const rowCount = next.order?.length ?? (size === "small" ? 10 : size === "regular" ? 14 : 16);
    next.order = Array.from({ length: rowCount }, () => ({
      stripNo: allowedStrips[Math.floor(Math.random() * allowedStrips.length)],
      reflected: Math.random() < 0.5,
    }));
    console.log("Randomize applied. Board Data:", next);
    setBoardDataWithHistory(next);
  };

  const applyCols = (cols: number) => {
    setBoardDataWithHistory((prev) => {
      const next = clone(prev);
      next.strips = next.strips.map((row) => {
        if (row.length === cols) return row.slice();
        if (row.length < cols) {
          return [...row, ...Array<string | null>(cols - row.length).fill(null)];
        }
        return row.slice(0, cols);
      });
      console.log(`Size changed to ${cols} cols. Board Data:`, next);
      return next;
    });
  };

  const handleSelectSize = (s: Size) => {
    setSize(s);
    if (s === "large") applyCols(14);
    else applyCols(12);
    const countPerStrip = s === "small" ? 5 : s === "regular" ? 7 : 8;
    const newOrder: RowOrder[] = Array.from({ length: countPerStrip * 2 }, (_, i) => ({ stripNo: i % 2 === 0 ? 1 : 2, reflected: false }));
    setBoardDataWithHistory((prev) => ({ ...clone(prev), order: newOrder }));
  };

  const handleReorder = (nextOrder: RowOrder[]) => {
    setBoardDataWithHistory((prev) => {
      const next = clone(prev);
      next.order = nextOrder.map((o) => ({ ...o }));
      console.log("Row order reordered.", next);
      return next;
    });
  };

  const handleReverseRow = (rowIndex: number) => {
    setBoardDataWithHistory((prev) => {
      const next = clone(prev);
      if (rowIndex >= 0 && rowIndex < next.order.length) {
        next.order[rowIndex] = {
          ...next.order[rowIndex],
          reflected: !next.order[rowIndex].reflected,
        };
      }
      console.log("Row reflect toggled.", { rowIndex, reflected: next.order[rowIndex]?.reflected, next });
      return next;
    });
  };

  const toggleStrip3 = () => setStrip3Enabled((v) => !v);

  return {
    isOpen,
    setIsOpen,
    boardData,
    setBoardDataWithHistory,
    strip3Enabled,
    toggleStrip3,
    size,
    handleSelectSize,
    handleRandomize,
    handleReorder,
    handleReverseRow,
    canUndo,
    canRedo,
    handleUndo,
    handleRedo,
  } as const;
}
