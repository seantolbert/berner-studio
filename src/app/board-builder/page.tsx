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
import { useSupabaseUser } from "@/app/hooks/useSupabaseUser";
import { LS_SELECTED_TEMPLATE_KEY } from "../templates";
import { calculateBoardPrice } from "@features/board-builder/lib/pricing";
import { setRuntimePricing } from "./pricing";
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
  const { user } = useSupabaseUser();
  const allowedAdmins = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin = !!(user?.email && allowedAdmins.includes(user.email.toLowerCase()));
  const loadedRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [woodsVersion, setWoodsVersion] = useState(0);
  const [pricingVersion, setPricingVersion] = useState(0);

  // Recalculate pricing when dynamic wood pricing updates
  useEffect(() => {
    const onUpdate = () => setWoodsVersion((v) => v + 1);
    window.addEventListener("builder:woods-updated", onUpdate);
    return () => window.removeEventListener("builder:woods-updated", onUpdate);
  }, []);

  // Load builder pricing settings from admin API and update runtime pricing
  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/builder/pricing", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load pricing");
        const p = data?.item;
        if (aborted || !p) return;
        setRuntimePricing({
          currency: p.currency,
          cellPrice: p.cell_price,
          basePrices: { small: p.base_small, regular: p.base_regular, large: p.base_large },
          extras: { juiceGroove: p.extra_juice_groove, thirdStrip: p.extra_third_strip },
        });
        setPricingVersion((v) => v + 1);
      } catch (e) {
        // non-fatal: fallback to defaults
        console.warn("Failed to load builder pricing; using defaults");
      }
    })();
    return () => { aborted = true; };
  }, []);

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
  }, [size, boardData.strips, strip3Enabled, woodsVersion, pricingVersion]);

  const handleSave = async () => {
    if (!isAdmin) {
      alert("Only admins can save classic templates.");
      return;
    }
    const name = prompt("Template name", "Classic Template");
    if (!name) return;
    setSaving(true);
    try {
      const { saveDefaultTemplate } = await import("@/lib/supabase/usage");
      await saveDefaultTemplate({
        name,
        size,
        strip3Enabled,
        strips: boardData.strips,
        order: boardData.order,
      });
      alert("Template saved to Default Templates.");
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Failed to save template");
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
            pricing={{
              total: pricing.total,
              cellCount: pricing.cellCount,
              base: pricing.base,
              variable: pricing.variable,
              extrasThirdStrip: pricing.extrasThirdStrip,
            }}
            onConfirmComplete={proceedToExtras}
          />
        </div>

        {/* Desktop-only price + continue panel aligned with strip builder */}
        <div className="hidden md:flex md:col-start-2 md:row-start-2 p-3">
          <div className="w-full rounded-md border border-black/10 dark:border-white/10 p-4 flex items-start justify-between gap-6">
            <div className="w-full max-w-sm">
              <div className="text-sm font-semibold mb-2">Receipt</div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="opacity-70">Base</span>
                  <span className="tabular-nums font-medium">{formatCurrency(pricing.base)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="opacity-70">Sticks</span>
                  <span className="tabular-nums font-medium">{formatCurrency(pricing.variable)}</span>
                </div>
                {pricing.extrasThirdStrip > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="opacity-70">3rd strip</span>
                    <span className="tabular-nums font-medium">+{formatCurrency(pricing.extrasThirdStrip)}</span>
                  </div>
                )}
                <div className="h-px bg-black/10 dark:bg-white/10 my-2" />
                <div className="flex items-center justify-between text-base font-semibold">
                  <span>Total</span>
                  <span className="tabular-nums">{formatCurrency(pricing.total)}</span>
                </div>
                <div className="text-xs opacity-60">{pricing.cellCount} cells</div>
              </div>
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
          {...(isAdmin ? { onSave: handleSave } : {})}
          canSave={isAdmin && isBoardComplete}
          saving={saving}
        />
        {/* Modal root mounted at page level */}
        <ModalRoot />
      </main>
    </ModalProvider>
  );
}
