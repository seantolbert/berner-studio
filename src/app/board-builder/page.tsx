"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import BoardPreview from "./components/BoardPreview";
import StripBuilder from "./components/StripBuilder";
import Drawer from "./components/Drawer";
import DrawerToggleTab from "./components/DrawerToggleTab";
import { useViewportHeight } from "./hooks/useViewportHeight";
import { useBoardBuilder } from "./hooks/useBoardBuilder";
import { ModalProvider, ModalRoot } from "./components/modal/ModalProvider";
import { useRouter } from "next/navigation";
import { LS_SELECTED_TEMPLATE_KEY } from "../templates";
import { saveBoard } from "@/lib/supabase/usage";
import { supabase } from "@/lib/supabase/client";

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
    loadTemplate,
    resetToBlank,
  } = useBoardBuilder();
  const router = useRouter();
  const loadedRef = useRef(false);
  const [saving, setSaving] = useState(false);

  const isBoardComplete = useMemo(() => {
    const requiredRows = strip3Enabled ? [0, 1, 2] : [0, 1];
    return requiredRows.every((r) => boardData.strips[r].every((c) => c !== null));
  }, [boardData.strips, strip3Enabled]);

  const handleSave = async () => {
    if (!isBoardComplete || saving) return;
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) {
        alert("Please sign in to save your board.");
        return;
      }
      await saveBoard({
        userId: user.id,
        size,
        strip3Enabled,
        data: {
          strips: boardData.strips,
          order: boardData.order,
        },
      });
      alert("Board saved!");
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Failed to save board");
    } finally {
      setSaving(false);
    }
  };

  const handleChangeRowOrder = (_rowIndex: number, _stripNo: number) => {};

  // Optional: close on Escape for accessibility
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Load template from localStorage or redirect back to selection
  useEffect(() => {
    if (loadedRef.current) return;
    try {
      const raw = localStorage.getItem(LS_SELECTED_TEMPLATE_KEY);
      if (!raw) {
        router.replace("/");
        return;
      }
      if (raw === "__blank__") {
        resetToBlank("regular");
        loadedRef.current = true;
        return;
      }
      const tpl = JSON.parse(raw);
      // Basic shape check
      if (!tpl || !tpl.strips || !tpl.order) {
        router.replace("/");
        return;
      }
      loadTemplate(tpl);
      loadedRef.current = true;
    } catch (e) {
      router.replace("/");
    }
  }, [router, loadTemplate, resetToBlank]);

  return (
    <ModalProvider>
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
          onSave={handleSave}
          canSave={isBoardComplete}
          saving={saving}
        />
        {/* Modal root mounted at page level */}
        <ModalRoot />
      </main>
    </ModalProvider>
  );
}
