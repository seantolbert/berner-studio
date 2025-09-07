"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ExtrasPreview from "../components/ExtrasPreview";
import PreviewRow from "../components/preview/PreviewRow";
import { styleForToken } from "../components/woods";
import { calculateBoardPrice, PRICING_SSO } from "../pricing";
import { ModalProvider, ModalRoot, useModal } from "../components/modal/ModalProvider";

type Size = "small" | "regular" | "large";

export default function ExtrasPage() {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
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
      setLoaded(true);
    } catch {
      setLoaded(true);
    }
  }, []);

  const preview = useMemo(
    () => (
      <ExtrasPreview
        boardData={boardData}
        size={size}
        borderRadius={edgeProfile === "chamfer" ? 0 : borderRadius}
        grooveEnabled={grooveEnabled}
        edgeProfile={edgeProfile}
        chamferSize={chamferSize}
      />
    ),
    [boardData, size, borderRadius, grooveEnabled, edgeProfile, chamferSize]
  );

  // Derive top row colors from the same SSOT as the preview
  const topRowColors: (string | null)[] = useMemo(() => {
    const cols = boardData.strips[0]?.length ?? 12;
    const rows = size === "small" ? 10 : size === "regular" ? 14 : 16;
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
    const cols = boardData.strips[0]?.length ?? 12;
    const rows = size === "small" ? 10 : size === "regular" ? 14 : 16;
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

  const EDGE_OPTIONS = [
    { key: "edged", label: "Edged", kind: "edged" as const },
    { key: "rounded4", label: "Rounded", kind: "rounded" as const, radius: 4 },
    { key: "rounded8", label: "Heavy Rounded", kind: "rounded" as const, radius: 8 },
    { key: "double_chamfer", label: "Double Chamfer", kind: "chamfer" as const, chamfer: 8 },
    // Diamond: lighter TL chamfer, steeper BL chamfer
    { key: "diamond", label: "Diamond", kind: "chamfer" as const, chamferTLX: 3, chamferTLY: 2, chamferBLX: 6, chamferBLY: 12 },
    // Flat Top: no top-left chamfer, heavier bottom-left chamfer (same as Diamond's BL)
    { key: "flat_top", label: "Flat Top", kind: "chamfer" as const, chamferTLX: 0, chamferTLY: 0, chamferBLX: 6, chamferBLY: 12 },
    // placeholders for 2 more to keep 2x3 grid if needed later
    // { key: "placeholder1", label: "", kind: "edged" as const },
    // { key: "placeholder2", label: "", kind: "edged" as const },
  ];

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

  const PREVIEW_CELL_PX = 20;
  const VISIBLE_CELLS = 4;

  return (
    <ModalProvider>
    <main className="w-full">
      {/* Top: left 50% preview, right 50% cost calculator */}
      <div className="w-full p-4">
        <div className="grid grid-cols-2 gap-4 items-start">
          <div className="w-full">{preview}</div>
          <div className="w-full">
            <div className="rounded-lg border border-black/10 dark:border-white/10 p-4">
              <div className="text-lg font-semibold mb-3">Cost</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span>Base</span><span>${basePricing.base.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Cells ({basePricing.cellCount} × ${PRICING_SSO.cellPrice.toFixed(2)})</span><span>${basePricing.variable.toFixed(2)}</span></div>
                {grooveEnabled && (
                  <div className="flex justify-between"><span>Juice groove</span><span>+${PRICING_SSO.extras.juiceGroove.toFixed(2)}</span></div>
                )}
                <div className="border-t border-black/10 dark:border-white/10 my-2" />
                <div className="flex justify-between text-base font-medium"><span>Total</span><span>${grandTotal.toFixed(2)}</span></div>
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
      </div>

      {/* Extras form below */}
      <div className="w-full p-4">
        <h1 className="text-xl font-semibold mb-2">Extras</h1>
        <p className="text-sm opacity-70 mb-4">
          Choose add-ons, engraving, and finishing options.
        </p>
        <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 grid gap-4">
          {/* Move Juice groove toggle to top */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Juice groove</div>
              <div className="text-xs opacity-70">Previewed as a black inset line</div>
            </div>
            <button
              type="button"
              onClick={() => setGrooveEnabled((v) => !v)}
              className={`h-9 px-3 rounded-md border ${
                grooveEnabled
                  ? "border-emerald-500 text-emerald-700 dark:text-emerald-400"
                  : "border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10"
              }`}
            >
              {grooveEnabled ? "Enabled" : "Disabled"}
            </button>
          </div>

          <div>
            <div className="text-sm font-medium mb-2">Corner</div>
            <div className="grid grid-cols-4 gap-3">
              {[
                { key: "edged", label: "Edged", onSelect: () => { setEdgeProfile("square"); setBorderRadius(0); } },
                { key: "r4", label: "Rounded 4px", onSelect: () => { setEdgeProfile("roundover"); setBorderRadius(4); } },
                { key: "r8", label: "Rounded 8px", onSelect: () => { setEdgeProfile("roundover"); setBorderRadius(8); } },
                { key: "ch4", label: "Chamfer", onSelect: () => { setEdgeProfile("chamfer"); setBorderRadius(0); setChamferSize(4); } },
              ].map((opt) => {
                const selected =
                  (opt.key === "edged" && edgeProfile === "square" && borderRadius === 0) ||
                  (opt.key === "r4" && edgeProfile === "roundover" && borderRadius === 4) ||
                  (opt.key === "r8" && edgeProfile === "roundover" && borderRadius === 8) ||
                  (opt.key === "ch4" && edgeProfile === "chamfer");
                const cellPx = 22;
                const cornerStyle: React.CSSProperties = {
                  width: `${cellPx * 2}px`,
                  height: `${cellPx * 2}px`,
                  overflow: "hidden",
                  borderTopLeftRadius: opt.key.startsWith("r") ? (opt.key === "r4" ? 4 : 8) : 0,
                  clipPath:
                    opt.key === "ch4"
                      ? `polygon(4px 0, 100% 0, 100% 100%, 0 100%, 0 4px)`
                      : undefined,
                };
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={opt.onSelect}
                    className={`rounded-lg border p-2 flex flex-col items-center gap-2 ${
                      selected
                        ? "border-emerald-500 ring-2 ring-emerald-200"
                        : "border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10"
                    }`}
                  >
                    <div style={cornerStyle} className="grid grid-cols-2 grid-rows-2">
                      {cornerColors2x2.flat().map((tok, idx) => (
                        <div
                          key={idx}
                          style={{
                            width: `${cellPx}px`,
                            height: `${cellPx}px`,
                            ...(styleForToken(tok, cellPx) || { backgroundColor: "transparent" }),
                          }}
                        />
                      ))}
                    </div>
                    <div className="text-xs opacity-80 text-center">{opt.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium mb-2">Edge profile</div>
            <div className="grid grid-cols-3 gap-3">
              {EDGE_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  aria-pressed={edgeOption === opt.key}
                  onClick={() => setEdgeOption(opt.key)}
                  className={`relative h-28 rounded-lg border transition-colors ${
                    edgeOption === opt.key
                      ? "border-emerald-500 ring-2 ring-emerald-200"
                      : "border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10"
                  } overflow-hidden flex flex-col items-center justify-center gap-2`}
                >
                  {/* Zoomed strip centered; only first 4 cells visible */}
                  <div className="pointer-events-none" style={{ width: `${VISIBLE_CELLS * PREVIEW_CELL_PX}px`, overflow: "hidden" }}>
                    <div
                      style={{
                        borderTopLeftRadius: opt.kind === "rounded" ? (opt.radius ?? 0) : 0,
                        borderBottomLeftRadius: opt.kind === "rounded" ? (opt.radius ?? 0) : 0,
                        clipPath:
                          opt.kind === "chamfer"
                            ? (() => {
                                const tX = (opt as any).chamferTLX ?? (opt as any).chamferTL ?? (opt as any).chamfer ?? 8;
                                const tY = (opt as any).chamferTLY ?? (opt as any).chamferTL ?? (opt as any).chamfer ?? 8;
                                const bX = (opt as any).chamferBLX ?? (opt as any).chamferBL ?? (opt as any).chamfer ?? 8;
                                const bY = (opt as any).chamferBLY ?? (opt as any).chamferBL ?? (opt as any).chamfer ?? 8;
                                return `polygon(${tX}px 0, 100% 0, 100% 100%, ${bX}px 100%, 0 calc(100% - ${bY}px), 0 ${tY}px)`;
                              })()
                            : undefined,
                        overflow: "hidden",
                      }}
                    >
                      <PreviewRow
                        index={0}
                        stripNo={1}
                        colors={topRowColors}
                        colCount={topRowColors.length || 12}
                        cellPx={PREVIEW_CELL_PX}
                        selected={false}
                        deselecting={false}
                        compact
                        onClick={undefined}
                      />
                    </div>
                  </div>
                  {/* Label underneath */}
                  <div className="text-xs opacity-80 text-center px-2">{opt.label}</div>
                </button>
              ))}
            </div>
          </div>

          
        </div>

        {/* Persist current extras selections for later flows */}
        {(() => {
          try {
            const extras = { edgeProfile, borderRadius, chamferSize, grooveEnabled };
            localStorage.setItem("bs_extras", JSON.stringify(extras));
          } catch {}
          return null;
        })()}
      </div>
      <ModalRoot />
    </main>
    </ModalProvider>
  );
}

type CartSnapshot = {
  name: string;
  unitPriceCents: number;
  breakdown: { baseCents: number; variableCents: number; extrasCents: number };
  config: {
    size: Size;
    strip3Enabled: boolean;
    boardData: { strips: (string | null)[][]; order: { stripNo: number; reflected: boolean }[] };
    extras: { edgeProfile: "square" | "roundover" | "chamfer"; borderRadius: number; chamferSize: number; grooveEnabled: boolean };
  };
};

function AddToCartButton({ item }: { item: CartSnapshot }) {
  const { open, close } = useModal();
  const router = useRouter();

  const handleAdd = () => {
    try {
      const raw = localStorage.getItem("bs_cart");
      const arr = raw ? (JSON.parse(raw) as any[]) : [];
      const id = `cart-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const line = { id, name: item.name, unitPrice: item.unitPriceCents, quantity: 1, breakdown: item.breakdown, config: item.config };
      const next = Array.isArray(arr) ? [...arr, line] : [line];
      localStorage.setItem("bs_cart", JSON.stringify(next));
    } catch {}
    open(
      <div className="space-y-3">
        <div className="text-base font-medium">Added to cart</div>
        <div className="text-sm opacity-70">Your custom board has been added.</div>
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              close();
              router.push("/");
            }}
            className="inline-flex h-9 px-3 rounded-md border border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10"
          >
            Continue shopping
          </button>
          <button
            type="button"
            onClick={() => {
              close();
              router.push("/cart");
            }}
            className="inline-flex h-9 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Go to cart
          </button>
        </div>
      </div>,
      { title: "", size: "sm", dismissible: true }
    );
  };

  return (
    <button
      type="button"
      onClick={handleAdd}
      className="inline-flex h-10 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white"
    >
      Add to Cart
    </button>
  );
}
