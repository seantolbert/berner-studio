"use client";

import { useEffect, useMemo, useState } from "react";
// Preview moved into PreviewPane for clarity
import PreviewPane from "@features/board-builder/ui/PreviewPane";
import { calculateBoardPrice, PRICING_SSO } from "@features/board-builder/lib/pricing";
import { formatCurrency } from "@/lib/money";
import { estimateBoardETA } from "@/lib/leadtime";
import CostSummary from "@features/board-builder/ui/CostSummary";
import { ModalProvider, ModalRoot } from "@features/board-builder/ui/modal/ModalProvider";
import AddToCartButton from "@features/board-builder/ui/AddToCartButton";
import ExtrasFormControls from "@features/board-builder/ui/ExtrasFormControls";

type Size = "small" | "regular" | "large";

export default function ExtrasPage() {
  const [size, setSize] = useState<Size>("regular");
  const [strip3Enabled, setStrip3Enabled] = useState(false);
  const [edgeProfile, setEdgeProfile] = useState<"square" | "chamfer" | "roundover">("square");
  const [borderRadius, setBorderRadius] = useState<number>(0);
  const [chamferSize, setChamferSize] = useState<number>(8);
  const [edgeOption, setEdgeOption] = useState<string>("square");
  const [grooveEnabled, setGrooveEnabled] = useState<boolean>(false);
  const [boardData, setBoardData] = useState<{
    strips: (string | null)[][];
    order: { stripNo: number; reflected: boolean }[];
  }>({ strips: [[], [], []], order: [] });

  useEffect(() => {
    try {
      const raw = localStorage.getItem("bs_current_config");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.size) setSize(parsed.size);
      if (typeof parsed?.strip3Enabled === "boolean")
        setStrip3Enabled(parsed.strip3Enabled);
      if (parsed?.boardData?.strips && parsed?.boardData?.order) {
        setBoardData({
          strips: parsed.boardData.strips,
          order: parsed.boardData.order,
        });
      }
      // no-op
    } catch {
      // no-op
    }
  }, []);

  // PreviewPane wraps ExtrasPreview with effective radius logic

  // Derive top row colors from the same SSOT as the preview
  const topRowColors: (string | null)[] = useMemo(() => {
    const cols = boardData.strips[0]?.length ?? 13;
    const rows = size === "small" ? 11 : size === "regular" ? 15 : 16;
    const effectiveOrder = (boardData.order && boardData.order.length
      ? boardData.order
      : Array.from({ length: rows }, (_, i) => ({ stripNo: i % 2 === 0 ? 1 : 2, reflected: false }))
    ) as { stripNo: number; reflected: boolean }[];
    const rowObj = effectiveOrder[0] || { stripNo: 1, reflected: false };
    const stripIndex = Math.max(0, Math.min(2, (rowObj.stripNo ?? 1) - 1));
    const rowColors = boardData.strips[stripIndex] ?? Array<string | null>(cols).fill(null);
    return rowObj.reflected ? rowColors.slice().reverse() : rowColors;
  }, [boardData, size]);

  // Top-left 2x2 corner colors from the same SSOT as preview
  const cornerColors2x2: (string | null)[][] = useMemo(() => {
    const cols = boardData.strips[0]?.length ?? 13;
    const rows = size === "small" ? 11 : size === "regular" ? 15 : 16;
    const effectiveOrder = (boardData.order && boardData.order.length
      ? boardData.order
      : Array.from({ length: rows }, (_, i) => ({ stripNo: i % 2 === 0 ? 1 : 2, reflected: false }))
    ) as { stripNo: number; reflected: boolean }[];
    const out: (string | null)[][] = [];
    for (let r = 0; r < 2; r++) {
      const rowObj = effectiveOrder[r] || { stripNo: 1, reflected: false };
      const stripIndex = Math.max(0, Math.min(2, (rowObj.stripNo ?? 1) - 1));
      let rowColors = boardData.strips[stripIndex] ?? Array<string | null>(cols).fill(null);
      if (rowObj.reflected) rowColors = rowColors.slice().reverse();
      out.push([rowColors[0] ?? null, rowColors[1] ?? null]);
    }
    return out;
  }, [boardData, size]);

  // Edge options moved into ExtrasFormControls

  // Pricing: carry cost from previous page and add extras
  const basePricing = useMemo(() => {
    return calculateBoardPrice({ size, strips: boardData.strips, strip3Enabled });
  }, [size, boardData.strips, strip3Enabled]);

  const extrasTotal = useMemo(() => {
    let t = 0;
    if (grooveEnabled) t += PRICING_SSO.extras.juiceGroove;
    return t;
  }, [grooveEnabled]);

  const grandTotal = basePricing.total + extrasTotal;

  const eta = useMemo(() => estimateBoardETA({
    size,
    strip3Enabled,
    boardData,
    extras: { grooveEnabled, edgeProfile, chamferSize },
  }), [size, strip3Enabled, boardData, grooveEnabled, edgeProfile, chamferSize]);

  // Preview constants are owned by PreviewPane/ExtrasFormControls now

  // Persist current extras selections for later flows (desktop and mobile)
  useEffect(() => {
    try {
      const extras = { edgeProfile, borderRadius, chamferSize, grooveEnabled };
      localStorage.setItem("bs_extras", JSON.stringify(extras));
    } catch {}
  }, [edgeProfile, borderRadius, chamferSize, grooveEnabled]);

  return (
    <ModalProvider>
    <main className="w-full">
      {/* Top: left 50% preview, right 50% cost calculator */}
      <div className="w-full p-4">
        <div className="grid [grid-template-columns:1fr_220px] md:[grid-template-columns:1fr_1fr] gap-4 items-start">
          <div className="w-full">
            <PreviewPane
              size={size}
              boardData={boardData}
              edgeProfile={edgeProfile}
              borderRadius={borderRadius}
              chamferSize={chamferSize}
              grooveEnabled={grooveEnabled}
            />
            {/* Desktop: stack extras form below preview on the left column */}
            <div className="hidden md:block mt-4">
              <h1 className="text-xl font-semibold mb-2">Extras</h1>
              <p className="text-sm opacity-70 mb-4">Choose add-ons, engraving, and finishing options.</p>
              <ExtrasFormControls
                grooveEnabled={grooveEnabled}
                setGrooveEnabled={setGrooveEnabled}
                edgeProfile={edgeProfile}
                setEdgeProfile={setEdgeProfile}
                borderRadius={borderRadius}
                setBorderRadius={setBorderRadius}
                chamferSize={chamferSize}
                setChamferSize={setChamferSize}
                edgeOption={edgeOption}
                setEdgeOption={setEdgeOption}
                topRowColors={topRowColors}
                cornerColors2x2={cornerColors2x2}
              />
            </div>
          </div>
          <div className="w-full">
            {/* Mobile: replace pricing card with juice groove toggle + description */}
            <div className="md:hidden rounded-lg border border-black/10 dark:border-white/10 p-4">
              <div className="flex items-center justify-between">
                <div className="text-base font-semibold">Juice groove</div>
                <button
                  type="button"
                  aria-pressed={grooveEnabled}
                  onClick={() => setGrooveEnabled((v) => !v)}
                  className={`h-6 w-11 rounded-full border border-black/15 dark:border-white/15 relative transition-colors ${
                    grooveEnabled ? "bg-emerald-600" : "bg-white/60 dark:bg-black/30"
                  }`}
                  aria-label="Toggle juice groove"
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      grooveEnabled ? "translate-x-5" : "translate-x-0.5"
                    }`}
                    aria-hidden="true"
                  />
                </button>
              </div>
              <p className="mt-2 text-sm opacity-80">
                A shallow channel around the edge that catches juices to help keep your countertop clean.
              </p>
              <div className="mt-2 text-sm font-medium">
                Additional charge: +{formatCurrency(PRICING_SSO.extras.juiceGroove || 0)}
              </div>
            </div>

            {/* Desktop: show pricing card */}
            <div className="hidden md:block rounded-lg border border-black/10 dark:border-white/10 p-4">
              <div className="text-lg font-semibold mb-3">Cost</div>
              <CostSummary
                base={basePricing.base}
                variable={basePricing.variable}
                cellCount={basePricing.cellCount}
                juiceGrooveEnabled={grooveEnabled}
                total={grandTotal}
                etaLabel={eta.label}
              />
              <div className="pt-3 flex justify-end">
                <AddToCartButton
                  item={{
                    name: "Custom cutting board",
                    unitPriceCents: Math.round(grandTotal * 100),
                    breakdown: {
                      baseCents: Math.round(basePricing.base * 100),
                      variableCents: Math.round(basePricing.variable * 100),
                      extrasCents: Math.round(extrasTotal * 100),
                    },
                    config: {
                      size,
                      strip3Enabled,
                      boardData,
                      extras: { edgeProfile, borderRadius, chamferSize, grooveEnabled },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        </div>

      {/* Mobile-only: Extras form full width below */}
      <div className="w-full p-4 md:hidden">
        <h1 className="text-xl font-semibold mb-2">Extras</h1>
        <p className="text-sm opacity-70 mb-4">
          Choose add-ons, engraving, and finishing options.
        </p>
        <ExtrasFormControls
          grooveEnabled={grooveEnabled}
          setGrooveEnabled={setGrooveEnabled}
          edgeProfile={edgeProfile}
          setEdgeProfile={setEdgeProfile}
          borderRadius={borderRadius}
          setBorderRadius={setBorderRadius}
          chamferSize={chamferSize}
          setChamferSize={setChamferSize}
          edgeOption={edgeOption}
          setEdgeOption={setEdgeOption}
          topRowColors={topRowColors}
          cornerColors2x2={cornerColors2x2}
        />
      </div>
      <ModalRoot />
    </main>
    </ModalProvider>
  );
}

// AddToCartButton extracted to ../components/AddToCartButton
