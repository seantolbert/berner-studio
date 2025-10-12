"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { setDynamicWoods } from "@/features/board-builder/lib/woods";
import { DEFAULT_EDGE_OPTION } from "@/app/board-builder/components/ExtrasFormControls";
import { PRICING_SSO, calculateBoardPrice } from "@features/board-builder/lib/pricing";
import { estimateBoardETA } from "@/lib/leadtime";
import { listEnabledBuilderWoods } from "@/lib/supabase/usage";
import type { ProductCore, ProductTemplateDetail } from "@/types/product";
import type { BoardLayout, BoardSize } from "@/types/board";

type BoardCustomizationArgs = {
  product: ProductCore | null;
  template: ProductTemplateDetail | null;
};

type ExtrasDetailEntry = { label: string; amountCents: number };

export function useBoardCustomization({ product, template }: BoardCustomizationArgs) {
  const [assignedTemplate, setAssignedTemplate] = useState<ProductTemplateDetail | null>(
    template ?? null
  );
  const [boardSize, setBoardSize] = useState<"small" | "regular">("regular");
  const [edgeProfile, setEdgeProfile] = useState<"square" | "chamfer" | "roundover">("square");
  const [borderRadius, setBorderRadius] = useState(0);
  const [chamferSize, setChamferSize] = useState(8);
  const [edgeOption, setEdgeOption] = useState<string>(DEFAULT_EDGE_OPTION);
  const [grooveEnabled, setGrooveEnabled] = useState(false);
  const [stripSampleOption, setStripSampleOption] = useState<"none" | "glide" | "lift">("none");
  const [brassFeet, setBrassFeet] = useState(false);
  const [pricingVersion, setPricingVersion] = useState(0);

  useEffect(() => {
    setAssignedTemplate(template ?? null);
  }, [template]);

  useEffect(() => {
    if (assignedTemplate) {
      setBoardSize(assignedTemplate.size === "small" ? "small" : "regular");
    } else {
      setBoardSize("regular");
    }
  }, [assignedTemplate]);

  useEffect(() => {
    if (!product) return;
    setGrooveEnabled(false);
    setEdgeProfile("square");
    setBorderRadius(0);
    setChamferSize(8);
    setEdgeOption(DEFAULT_EDGE_OPTION);
    setStripSampleOption("none");
    setBrassFeet(false);
  }, [product]);

  useEffect(() => {
    let active = true;
    if (!assignedTemplate) return;

    listEnabledBuilderWoods()
      .then((woods) => {
        if (!active) return;
        setDynamicWoods(woods.map((wood) => ({ key: wood.key, color: wood.color })));
        setPricingVersion((prev) => prev + 1);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [assignedTemplate]);

  const handleEnabled = useCallback(
    (opt: "none" | "glide" | "lift") => {
      const eo = (edgeOption || "").toLowerCase();
      if (eo === "double_chamfer") return opt === "none";
      if (eo === "diamond" || eo === "flat_top") return opt !== "glide";
      return true;
    },
    [edgeOption]
  );

  useEffect(() => {
    if (!handleEnabled(stripSampleOption)) {
      setStripSampleOption("none");
    }
  }, [handleEnabled, stripSampleOption]);

  const isBoardProduct = product?.category === "boards";
  const boardLayout: BoardLayout = assignedTemplate?.layout ?? { strips: [], order: [] };
  const canCustomizeBoard = Boolean(isBoardProduct && template && assignedTemplate);

  const extrasCents = useMemo(() => {
    if (!isBoardProduct) return 0;
    let extras = 0;
    if (grooveEnabled) extras += Math.round((PRICING_SSO.extras.juiceGroove || 0) * 100);
    if (brassFeet) extras += Math.round((PRICING_SSO.extras.brassFeet || 0) * 100);
    return extras;
  }, [isBoardProduct, grooveEnabled, brassFeet]);

  const extrasDetailEntries = useMemo<ExtrasDetailEntry[]>(() => {
    if (!isBoardProduct) return [];
    const details: ExtrasDetailEntry[] = [];
    if (grooveEnabled)
      details.push({
        label: "Juice groove",
        amountCents: Math.round((PRICING_SSO.extras.juiceGroove || 0) * 100),
      });
    if (brassFeet)
      details.push({
        label: "Brass feet",
        amountCents: Math.round((PRICING_SSO.extras.brassFeet || 0) * 100),
      });
    return details;
  }, [isBoardProduct, grooveEnabled, brassFeet]);

  const boardPricing = useMemo(() => {
    void pricingVersion;
    if (!isBoardProduct || !assignedTemplate) return null;
    const sizeKey: BoardSize = boardSize === "regular" ? "regular" : "small";
    const { base, variable, cellCount, extrasThirdStrip = 0 } = calculateBoardPrice({
      size: sizeKey,
      strips: assignedTemplate.layout.strips,
      strip3Enabled: assignedTemplate.strip3Enabled,
    });
    const baseCents = Math.round(base * 100);
    const variableCents = Math.round(variable * 100);
    const extrasThirdStripCents = Math.round(extrasThirdStrip * 100);
    const totalCents = baseCents + variableCents + extrasThirdStripCents + extrasCents;
    return {
      base,
      variable,
      cellCount,
      extrasThirdStrip,
      baseCents,
      variableCents,
      extrasThirdStripCents,
      extrasCents,
      totalCents,
    };
  }, [assignedTemplate, boardSize, extrasCents, isBoardProduct, pricingVersion]);

  const boardEtaLabel = useMemo(() => {
    if (!isBoardProduct) return "";
    return estimateBoardETA({
      size: boardSize,
      strip3Enabled: assignedTemplate?.strip3Enabled ?? false,
      extras: { edgeProfile, chamferSize, grooveEnabled },
      ...(assignedTemplate
        ? { boardData: { strips: assignedTemplate.layout.strips } }
        : {}),
    }).label;
  }, [assignedTemplate, boardSize, chamferSize, edgeProfile, grooveEnabled, isBoardProduct]);

  const topRowColors: (string | null)[] = useMemo(() => {
    if (!assignedTemplate) return [];
    const cols = assignedTemplate.layout.strips[0]?.length ?? 12;
    const rows = boardSize === "small" ? 11 : 15;
    const effectiveOrder = (
      assignedTemplate.layout.order && assignedTemplate.layout.order.length
        ? assignedTemplate.layout.order
        : Array.from({ length: rows }, (_, i) => ({
            stripNo: i % 2 === 0 ? 1 : 2,
            reflected: false,
          }))
    ) as { stripNo: number; reflected: boolean }[];
    const rowObj = effectiveOrder[0] || { stripNo: 1, reflected: false };
    const stripIndex = Math.max(0, Math.min(2, (rowObj.stripNo ?? 1) - 1));
    const rowColors =
      assignedTemplate.layout.strips[stripIndex] ?? Array<string | null>(cols).fill(null);
    return rowObj.reflected ? rowColors.slice().reverse() : rowColors;
  }, [assignedTemplate, boardSize]);

  const cornerColors2x2: (string | null)[][] = useMemo(() => {
    if (!assignedTemplate) return [[], []];
    const cols = assignedTemplate.layout.strips[0]?.length ?? 12;
    const rows = boardSize === "small" ? 11 : 15;
    const effectiveOrder = (
      assignedTemplate.layout.order && assignedTemplate.layout.order.length
        ? assignedTemplate.layout.order
        : Array.from({ length: rows }, (_, i) => ({
            stripNo: i % 2 === 0 ? 1 : 2,
            reflected: false,
          }))
    ) as { stripNo: number; reflected: boolean }[];
    const out: (string | null)[][] = [];
    for (let r = 0; r < 2; r++) {
      const rowObj = effectiveOrder[r] || { stripNo: 1, reflected: false };
      const stripIndex = Math.max(0, Math.min(2, (rowObj.stripNo ?? 1) - 1));
      let rowColors =
        assignedTemplate.layout.strips[stripIndex] ??
        Array<string | null>(cols).fill(null);
      if (rowObj.reflected) rowColors = rowColors.slice().reverse();
      out.push([rowColors[0] ?? null, rowColors[1] ?? null]);
    }
    return out;
  }, [assignedTemplate, boardSize]);

  const resetBoardOptions = useCallback(() => {
    setGrooveEnabled(false);
    setEdgeProfile("square");
    setBorderRadius(0);
    setChamferSize(8);
    setEdgeOption(DEFAULT_EDGE_OPTION);
    setStripSampleOption("none");
    setBrassFeet(false);
  }, []);

  return {
    assignedTemplate,
    boardSize,
    setBoardSize,
    edgeProfile,
    setEdgeProfile,
    borderRadius,
    setBorderRadius,
    chamferSize,
    setChamferSize,
    edgeOption,
    setEdgeOption,
    grooveEnabled,
    setGrooveEnabled,
    stripSampleOption,
    setStripSampleOption,
    brassFeet,
    setBrassFeet,
    boardLayout,
    canCustomizeBoard,
    extrasCents,
    extrasDetailEntries,
    boardPricing,
    boardEtaLabel,
    handleEnabled,
    topRowColors,
    cornerColors2x2,
    resetBoardOptions,
  };
}
