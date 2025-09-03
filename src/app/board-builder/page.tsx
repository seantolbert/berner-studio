"use client";

import { useEffect, useState } from "react";
import BoardPreview from "./components/BoardPreview";
import StripBuilder from "./components/StripBuilder";
import Drawer from "./components/Drawer";

export default function BoardBuilderPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [boardData, setBoardData] = useState<{ strips: (string | null)[][] }>(
    () => ({ strips: Array.from({ length: 3 }, () => Array<string | null>(12).fill(null)) })
  );

  // Optional: close on Escape for accessibility
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <main className="relative grid grid-rows-[1fr_1fr] h-[100svh] w-full overflow-hidden">
      <BoardPreview isDrawerOpen={isOpen} onToggleDrawer={() => setIsOpen(v => !v)} boardData={boardData} />
      <StripBuilder boardData={boardData} setBoardData={setBoardData} />
      <Drawer isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </main>
  );
}
