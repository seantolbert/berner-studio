"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateBoardPrice, PRICING_SSO } from "@features/board-builder/lib/pricing";
import { estimateBoardETA } from "@/lib/leadtime";
import CostSummary from "@features/board-builder/ui/CostSummary";
import { ModalProvider, ModalRoot } from "@features/board-builder/ui/modal/ModalProvider";
import AddToCartButton from "@features/board-builder/ui/AddToCartButton";
import { ProductGallery } from "@/app/products/components/ProductGallery";
import { BoardExtrasControls } from "@/app/products/components/BoardExtrasControls";
import { BoardPreviewPanel } from "@/app/products/components/BoardPreviewPanel";
import { createBoardPreviewDataUrl } from "@/lib/boardPreviewImage";
import type { BoardExtras, BoardLayout, BoardRowOrder, BoardSize } from "@/types/board";
import type { ProductImage } from "@/types/product";

export default function ExtrasPage() {
  const [size, setSize] = useState<BoardSize>("regular");
  const [strip3Enabled, setStrip3Enabled] = useState(false);
  const [edgeProfile, setEdgeProfile] = useState<BoardExtras["edgeProfile"]>("square");
  const [borderRadius, setBorderRadius] = useState<BoardExtras["borderRadius"]>(0);
  const [chamferSize, setChamferSize] = useState<BoardExtras["chamferSize"]>(8);
  const [edgeOption, setEdgeOption] = useState<string>("square");
  const [grooveEnabled, setGrooveEnabled] = useState<BoardExtras["grooveEnabled"]>(false);
  const [boardData, setBoardData] = useState<BoardLayout>({ strips: [[], [], []], order: [] });
  const [stripSampleOption, setStripSampleOption] = useState<"none" | "glide" | "lift">("none");
  const [brassFeet, setBrassFeet] = useState(false);
  const [extrasImages, setExtrasImages] = useState<Array<{ id: string; url: string; alt: string | null; is_primary: boolean; position: number }>>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);

  const handleEnabled = (opt: "none" | "glide" | "lift") => {
    const eo = (edgeOption || "").toLowerCase();
    if (eo === "double_chamfer") return opt === "none";
    if (eo === "diamond" || eo === "flat_top") return opt !== "glide";
    return true;
  };

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const res = await fetch("/api/builder/extras-images", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load extras images");
        if (!aborted) setExtrasImages(data.items || []);
      } catch {
        if (!aborted) setExtrasImages([]);
      }
    })();
    return () => {
      aborted = true;
    };
  }, []);

  useEffect(() => {
    if (extrasImages.length === 0) {
      if (activeImageId !== null) setActiveImageId(null);
      return;
    }
    if (!activeImageId || !extrasImages.some((img) => img.id === activeImageId)) {
      const preferred = extrasImages.find((img) => img.is_primary) ?? extrasImages[0];
      if (preferred?.id) setActiveImageId(preferred.id);
    }
  }, [extrasImages, activeImageId]);

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
    } catch {}
  }, []);

  const topRowColors = useMemo(() => {
    const cols = boardData.strips[0]?.length ?? 13;
    const rows = size === "small" ? 11 : size === "regular" ? 15 : 16;
    const fallbackOrder: BoardRowOrder[] = Array.from({ length: rows }, (_, i) => ({
      stripNo: i % 2 === 0 ? 1 : 2,
      reflected: false,
    }));
    const effectiveOrder = boardData.order.length ? boardData.order : fallbackOrder;
    const rowObj = effectiveOrder[0] || { stripNo: 1, reflected: false };
    const stripIndex = Math.max(0, Math.min(2, (rowObj.stripNo ?? 1) - 1));
    const rowColors = boardData.strips[stripIndex] ?? Array<string | null>(cols).fill(null);
    return rowObj.reflected ? rowColors.slice().reverse() : rowColors;
  }, [boardData, size]);

  const cornerColors2x2 = useMemo(() => {
    const cols = boardData.strips[0]?.length ?? 13;
    const rows = size === "small" ? 11 : size === "regular" ? 15 : 16;
    const fallbackOrder: BoardRowOrder[] = Array.from({ length: rows }, (_, i) => ({
      stripNo: i % 2 === 0 ? 1 : 2,
      reflected: false,
    }));
    const effectiveOrder = boardData.order.length ? boardData.order : fallbackOrder;
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

  const basePricing = useMemo(() => calculateBoardPrice({ size, strips: boardData.strips, strip3Enabled }), [size, boardData.strips, strip3Enabled]);
  const extrasTotal = useMemo(() => {
    let total = 0;
    if (grooveEnabled) total += PRICING_SSO.extras.juiceGroove || 0;
    if (brassFeet) total += PRICING_SSO.extras.brassFeet || 0;
    return total;
  }, [grooveEnabled, brassFeet]);

  const extrasDetail = useMemo(() => {
    const details: Array<{ label: string; amount: number }> = [];
    if (grooveEnabled) details.push({ label: "Juice groove", amount: PRICING_SSO.extras.juiceGroove || 0 });
    if (brassFeet) details.push({ label: "Brass feet", amount: PRICING_SSO.extras.brassFeet || 0 });
    return details;
  }, [grooveEnabled, brassFeet]);
  const grandTotal = basePricing.total + extrasTotal;
  const eta = useMemo(
    () => estimateBoardETA({ size, strip3Enabled, boardData, extras: { grooveEnabled, edgeProfile, chamferSize } }),
    [size, strip3Enabled, boardData, grooveEnabled, edgeProfile, chamferSize]
  );

  useEffect(() => {
    try {
      const extras: BoardExtras = { edgeProfile, borderRadius, chamferSize, grooveEnabled };
      localStorage.setItem("bs_extras", JSON.stringify(extras));
    } catch {}
  }, [edgeProfile, borderRadius, chamferSize, grooveEnabled]);

  useEffect(() => {
    if (!handleEnabled(stripSampleOption)) {
      setStripSampleOption("none");
    }
  }, [edgeOption]);

  const galleryImages: ProductImage[] = useMemo(() => extrasImages.map((img) => ({ id: img.id, url: img.url, alt: img.alt ?? null, color: null })), [extrasImages]);
  const fallbackGallery: ProductImage[] = useMemo(
    () => [
      { id: "placeholder", url: "/og.svg", alt: "Custom board preview", color: null },
    ],
    []
  );
  const hasUploadedImages = galleryImages.length > 0;
  const displayGallery = hasUploadedImages ? galleryImages : fallbackGallery;
  const fallbackImage = hasUploadedImages ? null : "/og.svg";
  const activeImage = useMemo(() => {
    if (activeImageId) {
      const found = displayGallery.find((img) => img.id === activeImageId);
      if (found) return found;
    }
    return displayGallery[0] ?? null;
  }, [displayGallery, activeImageId]);

  return (
    <ModalProvider>
      <main className="w-full overflow-x-hidden">
        <div className="w-full p-4">
          <div className="max-w-5xl mx-auto grid gap-6 md:grid-cols-2 items-start">
            <ProductGallery
              primary={activeImage}
              fallbackImage={fallbackImage}
              productName="Custom board"
              gallery={displayGallery}
              onSelectImage={(image) => setActiveImageId(image.id)}
            />

            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-semibold">Customize your board</h1>
                <div className="text-xs opacity-70 mt-1">{eta.label}</div>
              </div>

              <BoardPreviewPanel
                layout={boardData}
                boardSize={size}
                edgeProfile={edgeProfile}
                borderRadius={borderRadius}
                chamferSize={chamferSize}
                grooveEnabled={grooveEnabled}
                stripSampleOption={stripSampleOption}
                brassFeet={brassFeet}
                edgeOption={edgeOption}
              />

              <BoardExtrasControls
                boardSize={size}
                onBoardSizeChange={setSize}
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
                stripSampleOption={stripSampleOption}
                setStripSampleOption={setStripSampleOption}
                handleEnabled={handleEnabled}
                brassFeet={brassFeet}
                setBrassFeet={setBrassFeet}
                showSizeControl={false}
              />

              <div className="rounded-lg border border-black/10 dark:border-white/10 p-4">
                <div className="text-lg font-semibold mb-3">Cost Summary</div>
                <CostSummary
                  base={basePricing.base}
                  variable={basePricing.variable}
                  cellCount={basePricing.cellCount}
                  juiceGrooveEnabled={grooveEnabled}
                  brassFeetEnabled={brassFeet}
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
                        extrasDetail: extrasDetail.map((detail) => ({
                          label: detail.label,
                          amountCents: Math.round(detail.amount * 100),
                        })),
                      },
                      config: {
                        size,
                        strip3Enabled,
                        boardData,
                        extras: { edgeProfile, borderRadius, chamferSize, grooveEnabled },
                      },
                      image: createBoardPreviewDataUrl({
                        layout: boardData,
                        size,
                        extras: { edgeProfile, borderRadius, chamferSize, grooveEnabled },
                      }),
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full p-4 md:hidden">
          <BoardExtrasControls
            boardSize={size}
            onBoardSizeChange={setSize}
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
            stripSampleOption={stripSampleOption}
            setStripSampleOption={setStripSampleOption}
            handleEnabled={handleEnabled}
            brassFeet={brassFeet}
            setBrassFeet={setBrassFeet}
            showSizeControl={false}
          />
        </div>
        <ModalRoot />
      </main>
    </ModalProvider>
  );
}
