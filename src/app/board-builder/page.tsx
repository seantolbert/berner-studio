"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import BoardPreview from "@features/board-builder/ui/BoardPreview";
import StripBuilder from "@features/board-builder/ui/StripBuilder";
import Drawer from "@features/board-builder/ui/Drawer";
import DrawerToggleTab from "@features/board-builder/ui/DrawerToggleTab";
import { useViewportHeight } from "@features/board-builder/hooks/useViewportHeight";
import { useBoardBuilder } from "@features/board-builder/hooks/useBoardBuilder";
import { ModalProvider, ModalRoot } from "@features/board-builder/ui/modal/ModalProvider";
import { useRouter } from "next/navigation";
import { LS_SELECTED_TEMPLATE_KEY } from "../templates";
import { saveBoard } from "@/lib/supabase/usage";
import { supabase } from "@/lib/supabase/client";
import { calculateBoardPrice } from "@features/board-builder/lib/pricing";
import { formatCurrency } from "@/lib/money";

export default function BoardBuilderPage() {
  const vh = useViewportHeight();
  const [headerH, setHeaderH] = useState<number>(48);
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
    handleReorder: _handleReorder,
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
    return requiredRows.every((r) => (boardData.strips[r] ?? []).every((c) => c !== null));
  }, [boardData.strips, strip3Enabled]);

  const pricing = useMemo(() => {
    return calculateBoardPrice({
      size,
      strips: boardData.strips,
      strip3Enabled,
    });
  }, [size, boardData.strips, strip3Enabled]);

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

  const proceedToExtras = () => {
    try {
      const payload = {
        size,
        strip3Enabled,
        boardData: {
          strips: boardData.strips,
          order: boardData.order,
        },
      };
      localStorage.setItem("bs_current_config", JSON.stringify(payload));
    } catch {}
    router.push("/board-builder/extras");
  };

  // noop placeholder removed: handleChangeRowOrder

  // Optional: close on Escape for accessibility
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Measure header height to keep page non-scrollable
  useEffect(() => {
    const measure = () => {
      const el = document.querySelector("header");
      const h = el instanceof HTMLElement ? el.offsetHeight : 0;
      setHeaderH(h);
    };
    measure();
    window.addEventListener("resize", measure, { passive: true } as any);
    return () => window.removeEventListener("resize", measure as any);
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
        className="relative grid grid-rows-[50%_40%] md:grid-rows-[60%_1fr] md:grid-cols-[1fr_420px] h-[100svh] w-full overflow-hidden pb-10 px-4 md:px-0 md:max-w-6xl md:mx-auto"
        style={vh ? { height: `${Math.max(0, vh - headerH)}px` } : undefined}
      >
        <DrawerToggleTab
          isOpen={isOpen}
          onToggle={() => setIsOpen((v) => !v)}
          className="fixed right-2 top-1/3 -translate-y-1/2 md:hidden"
        />
        <div className="md:col-start-1 md:row-start-1">
          <BoardPreview
            isDrawerOpen={isOpen}
            onToggleDrawer={() => setIsOpen((v) => !v)}
            boardData={boardData}
            size={size}
            onReverseRow={handleReverseRow}
            strip3Enabled={strip3Enabled}
            onChangeRowStrip={handleChangeRowStrip}
          />
        </div>
        <div className="md:col-start-1 md:row-start-2">
          <StripBuilder
            boardData={boardData}
            setBoardData={setBoardDataWithHistory}
            strip3Enabled={strip3Enabled}
            onToggleStrip3={toggleStrip3}
            pricing={{ total: pricing.total, cellCount: pricing.cellCount }}
            onConfirmComplete={proceedToExtras}
          />
        </div>

        {/* Desktop-only price + continue panel aligned with strip builder */}
        <div className="hidden md:flex md:col-start-2 md:row-start-2 p-3">
          <div className="w-full rounded-md border border-black/10 dark:border-white/10 p-3 flex items-center justify-between gap-3">
            <div className="flex items-baseline gap-2">
              <span className="text-sm opacity-70">Total</span>
              <span className="text-lg font-semibold tabular-nums">{formatCurrency(pricing.total)}</span>
              <span className="text-xs opacity-60">{pricing.cellCount} cells</span>
            </div>
            <button
              type="button"
              disabled={!isBoardComplete}
              onClick={proceedToExtras}
              className={`h-10 px-4 rounded-md font-medium transition-colors ${
                isBoardComplete
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-red-500/30 text-white/70 cursor-not-allowed"
              }`}
            >
              Continue
            </button>
          </div>
        </div>
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
