"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

import { setDynamicWoods } from "@/app/board-builder/components/woods";
import ExtrasPreview from "@/app/board-builder/components/ExtrasPreview";
import BoardTopRowPreview from "@/app/products/components/BoardTopRowPreview";
import ExtrasFormControls from "@/app/board-builder/components/ExtrasFormControls";
import { estimateProductETA, estimateBoardETA } from "@/lib/leadtime";
import { formatCurrencyCents } from "@/lib/money";
import { DEFAULT_CURRENCY } from "@/lib/env";
import { PRICING_SSO } from "@features/board-builder/lib/pricing";
import { styleForToken } from "@/app/board-builder/components/woods";

type DBProduct = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  category: string;
  status: string;
  primary_image_url: string | null;
  short_desc: string | null;
  long_desc: string | null;
  product_template_id?: string | null;
};
type Variant = {
  id: string;
  color: string;
  size: string;
  sku: string | null;
  price_cents_override: number | null;
  status: "draft" | "published";
};
type ProdImage = {
  id: string;
  url: string;
  alt: string | null;
  color: string | null;
};

export default function ProductPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<DBProduct | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [images, setImages] = useState<ProdImage[]>([]);
  const [assignedTemplate, setAssignedTemplate] = useState<null | {
    id: string;
    name: string;
    size: "small" | "regular" | "large";
    strip3_enabled: boolean;
    strips: (string | null)[][];
    order: { stripNo: number; reflected: boolean }[];
  }>(null);
  // Customization (Extras) state for boards
  const [edgeProfile, setEdgeProfile] = useState<
    "square" | "chamfer" | "roundover"
  >("square");
  const [borderRadius, setBorderRadius] = useState<number>(0);
  const [chamferSize, setChamferSize] = useState<number>(8);
  const [edgeOption, setEdgeOption] = useState<string>("square");
  const [grooveEnabled, setGrooveEnabled] = useState<boolean>(false);
  const [stripSampleOption, setStripSampleOption] = useState<
    "none" | "glide" | "lift"
  >("none");
  const [brassFeet, setBrassFeet] = useState<boolean>(false);
  // Board preview size selector for product page (small | regular)
  const [boardSize, setBoardSize] = useState<"small" | "regular">("regular");

  // Enforce handle style availability based on edge option
  const handleEnabled = (opt: "none" | "glide" | "lift") => {
    const eo = (edgeOption || "").toLowerCase();
    if (eo === "double_chamfer") {
      return opt === "none"; // only none
    }
    if (eo === "diamond" || eo === "flat_top") {
      return opt !== "glide"; // none + lift
    }
    // edged, rounded4, rounded8 (and any other) -> all enabled
    return true;
  };

  // Coerce selection if newly disabled by edge option change
  useEffect(() => {
    if (!handleEnabled(stripSampleOption)) {
      setStripSampleOption("none");
    }
  }, [edgeOption]);

  // Initialize board size from template when it loads
  useEffect(() => {
    if (assignedTemplate) {
      setBoardSize(assignedTemplate.size === "small" ? "small" : "regular");
    }
  }, [assignedTemplate?.size]);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const slug = params?.slug as string;
        const { data: prod } = await supabase
          .from("products")
          .select(
            "id,slug,name,price_cents,category,status,primary_image_url,short_desc,long_desc,deleted_at,product_template_id"
          )
          .eq("slug", slug)
          .eq("status", "published")
          .is("deleted_at", null)
          .maybeSingle();
        if (!prod) {
          if (!aborted) setProduct(null);
          return;
        }
        if (aborted) return;
        setProduct({
          id: prod.id,
          slug: prod.slug,
          name: prod.name,
          price_cents: prod.price_cents,
          category: prod.category,
          status: prod.status,
          primary_image_url: prod.primary_image_url,
          short_desc: prod.short_desc,
          long_desc: prod.long_desc,
          product_template_id: (prod as any).product_template_id ?? null,
        });
        // Load assigned product template for boards
        if ((prod as any).product_template_id) {
          const { data: tpl } = await supabase
            .from("product_templates")
            .select('id,name,size,strip3_enabled,strips, "order"')
            .eq("id", (prod as any).product_template_id)
            .maybeSingle();
          if (!aborted && tpl) {
            setAssignedTemplate({
              id: tpl.id,
              name: tpl.name,
              size:
                tpl.size === "small" || tpl.size === "large"
                  ? tpl.size
                  : "regular",
              strip3_enabled: !!tpl.strip3_enabled,
              strips: (tpl as any).strips || [],
              order: (tpl as any).order || [],
            });
          }
        } else {
          setAssignedTemplate(null);
        }
        const { data: imgs } = await supabase
          .from("product_images")
          .select("id,url,alt,color")
          .eq("product_id", prod.id)
          .order("position", { ascending: true })
          .order("created_at", { ascending: true });
        if (!aborted) setImages((imgs || []) as any);
        const { data: vars } = await supabase
          .from("product_variants")
          .select("id,color,size,sku,price_cents_override,status")
          .eq("product_id", prod.id)
          .eq("status", "published")
          .order("color", { ascending: true })
          .order("size", { ascending: true });
        if (!aborted) setVariants((vars || []) as any);
        if (!aborted && prod.category === "apparel") {
          const list = (vars ?? []) as Variant[];
          if (list.length) {
            const c = list[0]!.color;
            const s = list.find((v) => v.color === c)?.size || null;
            setSelectedColor(c);
            setSelectedSize(s);
          }
        }
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => {
      aborted = false;
    };
  }, [params?.slug]);

  // Load dynamic woods to render template preview colors accurately
  useEffect(() => {
    let cancelled = false;
    if (!assignedTemplate) return; // only when needed
    (async () => {
      try {
        const { data } = await supabase
          .from("builder_woods")
          .select("key,color,enabled")
          .eq("enabled", true)
          .order("name", { ascending: true });
        if (!cancelled) {
          setDynamicWoods(
            (data || []).map((w: any) => ({ key: w.key, color: w.color || "" }))
          );
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [assignedTemplate]);

  // If a builder configuration exists locally, use it as SSOT for the preview
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('bs_current_config') : null;
      if (!raw) return;
      const cfg = JSON.parse(raw);
      if (!cfg || !cfg.boardData || !cfg.boardData.strips || !cfg.boardData.order) return;
      setAssignedTemplate({
        id: 'local',
        name: 'Custom',
        size: cfg.size === 'small' ? 'small' : 'regular',
        strip3_enabled: !!cfg.strip3Enabled,
        strips: cfg.boardData.strips,
        order: cfg.boardData.order,
      });
    } catch {}
  }, []);

  const colorOptions = useMemo(
    () => Array.from(new Set(variants.map((v) => v.color))),
    [variants]
  );
  const sizeOptions = useMemo(
    () =>
      selectedColor
        ? variants.filter((v) => v.color === selectedColor).map((v) => v.size)
        : [],
    [variants, selectedColor]
  );
  const selectedVariant = useMemo(() => {
    if (!selectedColor || !selectedSize) return null;
    return (
      variants.find(
        (v) => v.color === selectedColor && v.size === selectedSize
      ) || null
    );
  }, [variants, selectedColor, selectedSize]);

  const gallery = useMemo(() => {
    const byColor = selectedColor
      ? images.filter(
          (im) => (im.color || "").toLowerCase() === selectedColor.toLowerCase()
        )
      : [];
    return byColor.length ? byColor : images;
  }, [images, selectedColor]);

  const basePrice =
    selectedVariant?.price_cents_override != null
      ? selectedVariant!.price_cents_override!
      : product?.price_cents || 0;
  const extrasCents = useMemo(() => {
    if (!product) return 0;
    if (product.category !== "boards") return 0;
    let extras = 0;
    if (grooveEnabled)
      extras += Math.round((PRICING_SSO.extras.juiceGroove || 0) * 100);
    // Edge profile/corner radius currently not priced
    return extras;
  }, [product, grooveEnabled]);
  const displayPrice = basePrice + extrasCents;

  const etaLabel = useMemo(() => {
    if (!product) return "";
    if (product.category === "boards") {
      return estimateBoardETA({
        size: boardSize,
        strip3Enabled: false,
        extras: { edgeProfile, chamferSize, grooveEnabled },
      }).label;
    }
    return estimateProductETA().label;
  }, [product, edgeProfile, chamferSize, grooveEnabled, boardSize]);

  // Derived preview helpers for ExtrasFormControls
  const topRowColors: (string | null)[] = useMemo(() => {
    if (!assignedTemplate) return [];
    const cols = assignedTemplate.strips[0]?.length ?? 12;
    const rows = boardSize === "small" ? 11 : 15;
    const effectiveOrder = (
      assignedTemplate.order && assignedTemplate.order.length
        ? assignedTemplate.order
        : Array.from({ length: rows }, (_, i) => ({
            stripNo: i % 2 === 0 ? 1 : 2,
            reflected: false,
          }))
    ) as { stripNo: number; reflected: boolean }[];
    const rowObj = effectiveOrder[0] || { stripNo: 1, reflected: false };
    const stripIndex = Math.max(0, Math.min(2, (rowObj.stripNo ?? 1) - 1));
    const rowColors =
      assignedTemplate.strips[stripIndex] ??
      Array<string | null>(cols).fill(null);
    return rowObj.reflected ? rowColors.slice().reverse() : rowColors;
  }, [assignedTemplate, boardSize]);

  const cornerColors2x2: (string | null)[][] = useMemo(() => {
    if (!assignedTemplate) return [[], []];
    const cols = assignedTemplate.strips[0]?.length ?? 12;
    const rows = boardSize === "small" ? 11 : 15;
    const effectiveOrder = (
      assignedTemplate.order && assignedTemplate.order.length
        ? assignedTemplate.order
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
        assignedTemplate.strips[stripIndex] ??
        Array<string | null>(cols).fill(null);
      if (rowObj.reflected) rowColors = rowColors.slice().reverse();
      out.push([rowColors[0] ?? null, rowColors[1] ?? null]);
    }
    return out;
  }, [assignedTemplate, boardSize]);

  const addToCart = () => {
    if (!product) return;
    if (
      product.category === "apparel" &&
      (!selectedVariant || !selectedColor || !selectedSize)
    )
      return;
    try {
      const raw = localStorage.getItem("bs_cart");
      const arr = raw ? (JSON.parse(raw) as any[]) : [];
      const id = `prod-${product.slug}-${Date.now()}`;
      const lineName = (() => {
        if (product.category === "apparel" && selectedVariant)
          return `${product.name} – ${selectedColor}/${selectedSize}`;
        if (product.category === "boards") {
          const opts: string[] = [];
          if (grooveEnabled) opts.push("Juice groove");
          if (edgeProfile === "roundover")
            opts.push(`Rounded ${borderRadius}px`);
          if (edgeProfile === "chamfer") opts.push(`Chamfer ${chamferSize}px`);
          return opts.length
            ? `${product.name} – ${opts.join(", ")}`
            : product.name;
        }
        return product.name;
      })();
      const line = {
        id,
        name: lineName,
        unitPrice: displayPrice,
        quantity: 1,
        product: { slug: product.slug },
        variant: selectedVariant
          ? { id: selectedVariant.id, color: selectedColor, size: selectedSize }
          : null,
        ...(product.category === "boards"
          ? {
              config: {
                size: "regular",
                strip3Enabled: false,
                boardData: { strips: [], order: [] },
                extras: {
                  edgeProfile,
                  borderRadius,
                  chamferSize,
                  grooveEnabled,
                },
              },
              breakdown: {
                baseCents: basePrice,
                variableCents: 0,
                extrasCents,
              },
            }
          : {}),
      };
      const next = Array.isArray(arr) ? [...arr, line] : [line];
      localStorage.setItem("bs_cart", JSON.stringify(next));
      setAdded(true);
    } catch {}
  };

  if (loading) {
    return (
      <main className="min-h-screen w-full p-6 flex items-center justify-center">
        <div className="text-sm opacity-70">Loading…</div>
      </main>
    );
  }
  if (!product) {
    return (
      <main className="min-h-screen w-full p-6 flex items-center justify-center">
        <div className="text-sm opacity-70">Product not found.</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full overflow-x-hidden">
      <ProductJsonLd
        product={{
          slug: product.slug,
          name: product.name,
          description: product.short_desc || product.long_desc || "",
          priceCents: displayPrice,
          ...(product.primary_image_url
            ? { image: product.primary_image_url }
            : {}),
        }}
      />
      <div className="max-w-5xl mx-auto grid gap-6 md:grid-cols-2 items-start">
        <div className="rounded-xl overflow-hidden border border-black/10 dark:border-white/10">
          <div className="w-full aspect-[4/3] bg-gradient-to-br from-black/5 to-black/10 dark:from-white/5 dark:to-white/10 flex items-center justify-center text-sm opacity-70">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {(() => {
              const first = gallery[0];
              if (first) {
                return (
                  <img
                    src={first.url}
                    alt={first.alt || product.name}
                    className="w-full h-full object-cover"
                  />
                );
              }
              return null;
            })() ||
              (product.primary_image_url ? (
                <img
                  src={product.primary_image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>Image coming soon</span>
              ))}
          </div>
          {gallery.length > 1 && (
            <div className="grid grid-cols-4 gap-2 p-2">
              {gallery.slice(0, 8).map((im) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={im.id}
                  src={im.url}
                  alt={im.alt || ""}
                  className="h-16 w-full object-cover rounded border border-black/10 dark:border-white/10"
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-semibold">{product.name}</h1>
            <div className="text-lg font-medium mt-1">
              {formatCurrencyCents(displayPrice)}
            </div>
            <div className="text-xs opacity-70 mt-1">{etaLabel}</div>
          </div>
          {product.short_desc && (
            <p className="text-sm opacity-80">{product.short_desc}</p>
          )}

          {/* Assigned template preview for boards */}
          {product.category === "boards" && assignedTemplate && (
            <div className="mt-4">
              {/* Customization controls (same as Extras) */}
              <div className="flex flex-col gap-4">
                <div className="w-full overflow-x-hidden overflow-y-visible rounded-md border border-black/10 dark:border-white/10 p-3">
                  <div className="flex items-center justify-evenly">
                    {(() => {
                      const cols = assignedTemplate.strips[0]?.length ?? 12;
                      // Compute visual rows based on selected board size (small removes last 4 rows)
                      const rows = boardSize === "small" ? 11 : 15;
                      const defaultOrder = Array.from(
                        { length: rows },
                        (_, i) => ({
                          stripNo: i % 2 === 0 ? 1 : 2,
                          reflected: false,
                        })
                      ) as { stripNo: number; reflected: boolean }[];
                      // Use template order if provided; truncate bottom 4 for small (i.e., to 'rows')
                      const orderPreview = (
                        assignedTemplate.order && assignedTemplate.order.length
                          ? (assignedTemplate.order as {
                              stripNo: number;
                              reflected: boolean;
                            }[])
                          : defaultOrder
                      ).slice(0, rows);
                      const cellPx = 12;
                      const wPx = cols * cellPx;
                      const hPx = rows * cellPx;
                      let hIn = rows * 0.5; // base scaling for fallback
                      // Fixed dimensions by size
                      if (boardSize === "regular") {
                        hIn = 14;
                      } else if (boardSize === "small") {
                        hIn = 9.5;
                      }
                      const fmtIn = (n: number) =>
                        Math.abs(n - Math.round(n)) < 0.05
                          ? String(Math.round(n))
                          : n.toFixed(1);
                      return (
                        <div
                          className="relative inline-block"
                          style={{ width: `${wPx}px`, height: `${hPx}px` }}
                        >
                          <ExtrasPreview
                            boardData={{
                              strips: assignedTemplate.strips as any,
                              order: orderPreview as any,
                            }}
                            size={boardSize}
                            borderRadius={borderRadius}
                            grooveEnabled={grooveEnabled}
                            edgeProfile={edgeProfile}
                            chamferSize={chamferSize}
                            grooveBorderWidthPx={6}
                            grooveCornerRadiusPx={6}
                          />
                          {/* Width schematic line removed per request */}
                          <div
                            className="absolute top-0 bottom-0"
                            style={{ right: "-18px" }}
                          >
                            <div
                              className="relative my-auto"
                              style={{ height: `${hPx}px`, width: "0px" }}
                            >
                              {/* Vertical dimension line */}
                              <div className="absolute top-0 bottom-0 w-px bg-current" />
                              {/* End ticks */}
                              <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-px rotate-90 bg-current" />
                              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-2 w-px -rotate-90 bg-current" />
                              {/* Centered rotated label with background to create a break in the line */}
                              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-1 bg-background text-[11px] rotate-90 origin-center opacity-80 leading-none select-none">
                                {fmtIn(hIn)}″
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                    {/* Top row (head-on) preview to the right */}
                    {(() => {
                      const colsR = assignedTemplate.strips[0]?.length ?? 12;
                      const cellPxR = 12;
                      const wR = colsR * cellPxR;
                      const widthIn = boardSize === 'regular' ? 10 : 9.5;
                      return (
                        <div className="shrink-0 flex flex-col items-center justify-center">
                          <div className="relative" style={{ width: `${wR}px` }}>
                            <BoardTopRowPreview
                              strips={assignedTemplate.strips as any}
                              order={assignedTemplate.order as any}
                              size={assignedTemplate.size}
                              edgeProfile={edgeProfile}
                              borderRadius={borderRadius}
                              chamferSize={chamferSize}
                              edgeOption={edgeOption}
                              handleStyle={stripSampleOption}
                              showBrassFeet={brassFeet}
                            />
                          </div>
                          {/* Width schematic line for right preview */}
                          <div className="relative mt-2" style={{ width: `${wR}px`, height: '0px' }}>
                            <div className="absolute left-0 right-0 h-px bg-current" />
                            <div className="absolute -left-1 top-0 w-2 h-px rotate-90 bg-current" />
                            <div className="absolute -right-1 top-0 w-2 h-px -rotate-90 bg-current" />
                            <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 px-1 bg-background text-[11px] opacity-80 leading-none">{widthIn}″</div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <div className="w-full rounded-md border border-black/10 dark:border-white/10 p-3">
                  <div className="text-sm font-medium mb-2">Customize</div>
                  {/* Size selector (Small | Regular) */}
                  <div className="mb-4">
                    <div className="text-sm font-medium mb-2">Board size</div>
                    <div className="grid grid-cols-2 gap-3">
                      {(
                        [
                          { key: "small", label: "Small" },
                          { key: "regular", label: "Regular" },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => setBoardSize(opt.key)}
                          aria-pressed={boardSize === opt.key}
                          className={`h-10 px-3 rounded-md border text-sm transition-colors ${
                            boardSize === opt.key
                              ? "border-emerald-500 ring-2 ring-emerald-200"
                              : "border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
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
                    bare
                  />
                  {/* Handle style selector: center 8 cells of top strip */}
                  {assignedTemplate && topRowColors.length > 0 && (
                    <div className="mt-4">
                      <div className="text-sm font-medium mb-2">
                        Handle style
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {(() => {
                          const len = topRowColors.length;
                          const take = 8;
                          const start = Math.max(
                            0,
                            Math.floor((len - take) / 2)
                          );
                          const base = topRowColors.slice(start, start + take);
                          const variants: Array<{
                            key: "none" | "glide" | "lift";
                            label: string;
                            colors: (string | null)[];
                          }> = [
                            { key: "none", label: "None", colors: base },
                            { key: "glide", label: "Glide", colors: base },
                            { key: "lift", label: "Lift", colors: base },
                          ];
                          const CELL = 14;
                          return variants.map((v) => {
                            const enabled = handleEnabled(v.key);
                            const isSelected = stripSampleOption === v.key;
                            return (
                              <button
                                key={v.key}
                                type="button"
                                onClick={() => {
                                  if (enabled) setStripSampleOption(v.key);
                                }}
                                aria-pressed={isSelected}
                                aria-disabled={!enabled}
                                disabled={!enabled}
                                className={`relative h-28 rounded-lg border transition-colors overflow-hidden flex items-center justify-center ${
                                  !enabled
                                    ? "opacity-40 cursor-not-allowed border-black/10 dark:border-white/10"
                                    : isSelected
                                    ? "border-emerald-500 ring-2 ring-emerald-200"
                                    : "border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10"
                                }`}
                              >
                                <div className="flex flex-col items-center gap-2">
                                  <div
                                    className="relative"
                                    style={{
                                      width: `${v.colors.length * CELL}px`,
                                    }}
                                  >
                                    <div
                                      className="relative z-0 grid gap-0"
                                      style={{
                                        gridTemplateColumns: `repeat(${v.colors.length}, ${CELL}px)`,
                                      }}
                                      aria-hidden
                                    >
                                      {v.colors.map((tok, idx) => (
                                        <div
                                          key={idx}
                                          className="border border-black/10 dark:border-white/10"
                                          style={{
                                            width: `${CELL}px`,
                                            height: `${CELL * 2}px`,
                                            ...(typeof tok === "string"
                                              ? styleForToken(tok, CELL)
                                              : {
                                                  backgroundColor:
                                                    "transparent",
                                                }),
                                          }}
                                        />
                                      ))}
                                    </div>
                                    {v.key === "glide" && (
                                      <div
                                        className="absolute z-10 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none bg-black/40 mix-blend-multiply"
                                        style={{
                                          width: `${
                                            v.colors.length * CELL * 0.6
                                          }px`,
                                          height: `${CELL * 0.9}px`,
                                        }}
                                      />
                                    )}
                                    {v.key === "lift" && (
                                      <div
                                        className="absolute z-10 left-1/2 pointer-events-none bg-black/40 mix-blend-multiply"
                                        style={{
                                          width: `${
                                            v.colors.length * CELL * 0.6
                                          }px`,
                                          height: `${CELL * 0.9}px`,
                                          bottom: 0,
                                          transform: `translateX(-50%)`,
                                          borderTopLeftRadius: 6,
                                          borderTopRightRadius: 6,
                                        }}
                                      />
                                    )}
                                  </div>
                                  <div className="text-xs opacity-80">
                                    {v.label}
                                  </div>
                                </div>
                              </button>
                            );
                          });
                        })()}
                      </div>
                      {boardSize === "small" && (
                        <div className="mt-4 flex items-center justify-between rounded-md border border-black/10 dark:border-white/10 p-3">
                          <div>
                            <div className="text-sm font-medium">
                              Brass feet
                            </div>
                            <div className="text-xs opacity-70">
                              Adds brass feet hardware to the base
                            </div>
                          </div>
                          <button
                            type="button"
                            aria-pressed={brassFeet}
                            onClick={() => setBrassFeet((v) => !v)}
                            className={`h-6 w-11 rounded-full border border-black/15 dark:border-white/15 relative transition-colors ${
                              brassFeet
                                ? "bg-emerald-600"
                                : "bg-white/60 dark:bg-black/30"
                            }`}
                            aria-label="Toggle brass feet"
                          >
                            <span
                              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                                brassFeet ? "translate-x-5" : "translate-x-0.5"
                              }`}
                              aria-hidden="true"
                            />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Old board options replaced by unified customization controls above */}

          {product.category === "apparel" && variants.length > 0 && (
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium mb-1">Color</div>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setSelectedColor(c);
                        const s =
                          variants.find((v) => v.color === c)?.size || null;
                        setSelectedSize(s);
                      }}
                      className={`h-9 px-3 rounded-md border text-sm ${
                        selectedColor === c
                          ? "border-emerald-500 text-emerald-700 dark:text-emerald-300"
                          : "border-black/10 dark:border-white/10"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              {selectedColor && (
                <div>
                  <div className="text-sm font-medium mb-1">Size</div>
                  <div className="flex flex-wrap gap-2">
                    {sizeOptions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSelectedSize(s)}
                        className={`h-9 px-3 rounded-md border text-sm ${
                          selectedSize === s
                            ? "border-emerald-500 text-emerald-700 dark:text-emerald-300"
                            : "border-black/10 dark:border-white/10"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={addToCart}
              className="inline-flex h-10 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
              disabled={
                product.category === "apparel" &&
                (!selectedColor || !selectedSize)
              }
            >
              Add to cart
            </button>
            <button
              type="button"
              onClick={() => router.push("/cart")}
              className="inline-flex h-10 px-4 rounded-md border border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10"
            >
              Go to cart
            </button>
          </div>
          {added && <div className="text-xs opacity-70">Added to cart.</div>}
        </div>
      </div>
    </main>
  );
}

function ProductJsonLd({
  product,
}: {
  product: {
    slug: string;
    name: string;
    description: string;
    priceCents: number;
    image?: string;
  };
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const base = (siteUrl || "").replace(/\/$/, "");
  const url = base
    ? `${base}/products/${product.slug}`
    : `/products/${product.slug}`;
  const image = product.image
    ? product.image.startsWith("http")
      ? product.image
      : `${base}${product.image}`
    : base
    ? `${base}/og.svg`
    : "/og.svg";
  const json = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: [image],
    brand: { "@type": "Brand", name: "Berner Studio" },
    url,
    offers: {
      "@type": "Offer",
      priceCurrency: DEFAULT_CURRENCY.toUpperCase(),
      price: (product.priceCents / 100).toFixed(2),
      availability: "http://schema.org/InStock",
      url,
    },
  };
  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
