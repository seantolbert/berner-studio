"use client";

import { useEffect } from "react";
import BoardPreview from "./components/BoardPreview";
import StripBuilder from "./components/StripBuilder";
import Drawer from "./components/Drawer";
import DrawerToggleTab from "./components/DrawerToggleTab";
import { useViewportHeight } from "./hooks/useViewportHeight";
import { useBoardBuilder } from "./hooks/useBoardBuilder";

export default function BoardBuilderPage() {
  const vh = useViewportHeight();
  const {
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
    canUndo,
    canRedo,
    handleUndo,
    handleRedo,
  } = useBoardBuilder();

  const handleChangeRowOrder = (_rowIndex: number, _stripNo: number) => {};

  // Optional: close on Escape for accessibility
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <main
      className="relative grid grid-rows-[50%_40%] h-[100svh] w-full"
      style={vh ? { height: `${vh}px` } : undefined}
    >
      <DrawerToggleTab
        isOpen={isOpen}
        onToggle={() => setIsOpen((v) => !v)}
        className="fixed right-2 top-1/3 -translate-y-1/2"
      />
      <BoardPreview
        isDrawerOpen={isOpen}
        onToggleDrawer={() => setIsOpen((v) => !v)}
        boardData={boardData}
        size={size}
        onReverseRow={handleReverseRow}
        strip3Enabled={strip3Enabled}
        onChangeRowStrip={handleChangeRowStrip}
      />
      <StripBuilder
        boardData={boardData}
        setBoardData={setBoardDataWithHistory}
        strip3Enabled={strip3Enabled}
        onToggleStrip3={toggleStrip3}
      />
      <Drawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onRandomize={handleRandomize}
        size={size}
        onSelectSize={handleSelectSize}
      />
    </main>
  );
}
