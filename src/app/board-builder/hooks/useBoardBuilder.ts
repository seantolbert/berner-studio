"use client";

import { useState } from "react";
import { WOODS, getAvailableWoodKeys } from "../components/woods";
import type { Size } from "../components/preview/useRowDnD";
import type { BoardTemplate } from "../../templates";
import type { BoardLayout, BoardRowOrder } from "@/types/board";

export function useBoardBuilder() {
  const [isOpen, setIsOpen] = useState(false);
  const [strip3Enabled, setStrip3Enabled] = useState(false);
  const [size, setSize] = useState<Size>("regular");

  const [boardData, setBoardData] = useState<BoardLayout>(() => ({
    strips: Array.from({ length: 3 }, () => Array<string | null>(13).fill(null)),
    order: Array.from({ length: 15 }, (_, i) => ({ stripNo: i % 2 === 0 ? 1 : 2, reflected: false })),
  }));

  const clone = (layout: BoardLayout): BoardLayout => ({
    strips: layout.strips.map((r) => r.slice()),
    order: layout.order.map((o) => ({ ...o })),
  });

  const [history, setHistory] = useState<BoardLayout[]>([]);
  const [future, setFuture] = useState<BoardLayout[]>([]);

  type BoardUpdater = BoardLayout | ((_state: BoardLayout) => BoardLayout);

  const setBoardDataWithHistory = (updater: BoardUpdater) => {
    setBoardData((prev) => {
      const prevClone = clone(prev);
      const nextState = typeof updater === "function" ? updater(prev) : updater;
      setHistory((historySnapshot) => [...historySnapshot, prevClone]);
      setFuture([]);
      return nextState;
    });
  };

  const canUndo = history.length > 0;
  const canRedo = future.length > 0;

  const handleUndo = () => {
    if (!canUndo) return;
    setBoardData((current) => {
      const prev = history[history.length - 1];
      if (!prev) return current;
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
      if (!nextItem) return current;
      setFuture((f) => f.slice(0, -1));
      setHistory((h) => [...h, clone(current)]);
      const nextState = clone(nextItem);
      console.log("Redo applied. Board Data:", nextState);
      return nextState;
    });
  };

  const handleRandomize = () => {
    const dynKeys = getAvailableWoodKeys();
    const woodKeys = dynKeys.length > 0 ? dynKeys : WOODS.map((w) => w.key);
    const next = clone(boardData);
    next.strips = next.strips.map((row, ri): (string | null)[] => {
      const active = ri !== 2 || strip3Enabled;
      if (!active) return row.slice();
      const newRow: (string | null)[] = row.map(
        () => woodKeys[Math.floor(Math.random() * woodKeys.length)] as string | null
      );
      return newRow;
    });
    const allowedStrips = strip3Enabled ? [1, 2, 3] : [1, 2];
    const rowCount = next.order?.length ?? (size === "small" ? 11 : size === "regular" ? 15 : 16);
    next.order = Array.from({ length: rowCount }, () => {
      const idx = Math.floor(Math.random() * allowedStrips.length);
      const picked = allowedStrips[idx] ?? 1;
      return {
        stripNo: picked,
        reflected: Math.random() < 0.5,
      } as typeof next.order[number];
    });
    console.log("Randomize applied. Board Data:", next);
    setBoardDataWithHistory(next);
  };

  const resetToBlank = (s: Size = "regular") => {
    // Apply size
    setSize(s);
    // No third strip by default
    setStrip3Enabled(false);
    // Determine columns based on size
    const cols = s === "large" ? 14 : 13;
    const strips = Array.from({ length: 3 }, () => Array<string | null>(cols).fill(null));
    // Default order: alternating 1,2 with appropriate count
    const rowsCount = s === "small" ? 11 : s === "regular" ? 15 : 16;
    const order: BoardRowOrder[] = Array.from({ length: rowsCount }, (_, i) => ({ stripNo: i % 2 === 0 ? 1 : 2, reflected: false }));

    setBoardData({ strips, order });
    setHistory([]);
    setFuture([]);
    console.log("Reset to blank configuration.", { size: s, strips, order });
  };

  const loadTemplate = (tpl: BoardTemplate) => {
    // Use wood keys directly; ensure 3 rows exist
    const mappedStrips: (string | null)[][] = tpl.strips.map((row) => row.slice());
    while (mappedStrips.length < 3) mappedStrips.push(Array<string | null>(mappedStrips[0]?.length || 13).fill(null));

    setSize(tpl.size);
    setStrip3Enabled(tpl.strip3Enabled);
    setBoardData({ strips: mappedStrips, order: tpl.order.map((o) => ({ ...o })) });
    // Reset history/future so undo doesn't jump back to blank
    setHistory([]);
    setFuture([]);
    console.log("Template loaded.", { tpl, mappedStrips });
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
    else applyCols(13);
    const rowsCount = s === "small" ? 11 : s === "regular" ? 15 : 16;
    const newOrder: BoardRowOrder[] = Array.from({ length: rowsCount }, (_, i) => ({ stripNo: i % 2 === 0 ? 1 : 2, reflected: false }));
    setBoardDataWithHistory((prev) => ({ ...clone(prev), order: newOrder }));
  };

  const handleReorder = (nextOrder: BoardRowOrder[]) => {
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
        const curr = next.order[rowIndex] ?? { stripNo: 1, reflected: false };
        next.order[rowIndex] = {
          stripNo: curr.stripNo,
          reflected: !curr.reflected,
        };
      }
      console.log("Row reflect toggled.", { rowIndex, reflected: next.order[rowIndex]?.reflected, next });
      return next;
    });
  };

  const handleChangeRowStrip = (rowIndex: number, stripNo: number) => {
    setBoardDataWithHistory((prev) => {
      const next = clone(prev);
      if (rowIndex < 0 || rowIndex >= next.order.length) return next;
      const maxStrip = strip3Enabled ? 3 : 2;
      const desired = Math.min(Math.max(1, stripNo), maxStrip);
      const curr = next.order[rowIndex] ?? { stripNo: 1, reflected: false };
      next.order[rowIndex] = {
        stripNo: desired,
        reflected: curr.reflected,
      };
      console.log("Row strip changed.", { rowIndex, stripNo: desired, next });
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
    handleChangeRowStrip,
    loadTemplate,
    resetToBlank,
    canUndo,
    canRedo,
    handleUndo,
    handleRedo,
  } as const;
}
