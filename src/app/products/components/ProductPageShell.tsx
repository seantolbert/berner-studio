"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { setDynamicWoods } from "@/app/board-builder/components/woods";
import { estimateProductETA, estimateBoardETA } from "@/lib/leadtime";
import { formatCurrencyCents } from "@/lib/money";
import { DEFAULT_CURRENCY } from "@/lib/env";
import { PRICING_SSO } from "@features/board-builder/lib/pricing";
import { listEnabledBuilderWoods } from "@/lib/supabase/usage";
import { createBoardPreviewDataUrl } from "@/lib/boardPreviewImage";
import type {
  ProductCore,
  ProductImage,
  ProductVariant,
  ProductTemplateDetail,
} from "@/types/product";
import type { CartItem } from "@/types/cart";
import type { BoardLayout } from "@/types/board";
import { ProductGallery } from "@/app/products/components/ProductGallery";
import { BoardPreviewPanel } from "@/app/products/components/BoardPreviewPanel";
import { BoardExtrasControls } from "@/app/products/components/BoardExtrasControls";
import { ProductVariantSelector } from "@/app/products/components/ProductVariantSelector";
import { ProductPurchasePanel } from "@/app/products/components/ProductPurchasePanel";

type ProductCartLine = CartItem & {
  product: { slug: string };
  variant?: { id: string; color: string | null; size: string | null } | null;
};

type Props = {
  loading: boolean;
  product: ProductCore | null;
  variants: ProductVariant[];
  images: ProductImage[];
  template: ProductTemplateDetail | null;
};

export function ProductPageShell({ loading, product, variants, images, template }: Props) {
  const router = useRouter();

  const [assignedTemplate, setAssignedTemplate] = useState<ProductTemplateDetail | null>(template);
  const [localImages, setLocalImages] = useState<ProductImage[]>(images);
  const [edgeProfile, setEdgeProfile] = useState<"square" | "chamfer" | "roundover">("square");
  const [borderRadius, setBorderRadius] = useState<number>(0);
  const [chamferSize, setChamferSize] = useState<number>(8);
  const [edgeOption, setEdgeOption] = useState<string>("square");
  const [grooveEnabled, setGrooveEnabled] = useState<boolean>(false);
  const [stripSampleOption, setStripSampleOption] = useState<"none" | "glide" | "lift">("none");
  const [brassFeet, setBrassFeet] = useState<boolean>(false);
  const [boardSize, setBoardSize] = useState<"small" | "regular">("regular");
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [customPrice, setCustomPrice] = useState<number | null>(null);

  useEffect(() => {
    setAssignedTemplate(template);
  }, [template?.id]);

  useEffect(() => {
    setLocalImages(images);
  }, [images]);

  useEffect(() => {
    if (assignedTemplate) {
      setBoardSize(assignedTemplate.size === "small" ? "small" : "regular");
    }
  }, [assignedTemplate?.size]);

  useEffect(() => {
    let active = true;
    if (!assignedTemplate) return;
    listEnabledBuilderWoods()
      .then((woods) => {
        if (!active) return;
        setDynamicWoods(woods.map((wood) => ({ key: wood.key, color: wood.color })));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [assignedTemplate]);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("bs_current_config") : null;
      if (!raw) return;
      const cfg = JSON.parse(raw);
      if (!cfg || !cfg.boardData) return;
      const strips = Array.isArray(cfg.boardData.strips)
        ? cfg.boardData.strips.map((row: unknown) =>
            Array.isArray(row)
              ? row.map((cell) => (typeof cell === "string" ? cell : null))
              : []
          )
        : [];
      const order = Array.isArray(cfg.boardData.order)
        ? cfg.boardData.order.map((entry: unknown) => {
            if (!entry || typeof entry !== "object") {
              return { stripNo: 1, reflected: false };
            }
            const rawOrder = entry as { stripNo?: unknown; reflected?: unknown };
            const stripNoRaw = Number(rawOrder.stripNo);
            const stripNo = Number.isFinite(stripNoRaw) ? Math.max(1, Math.round(stripNoRaw)) : 1;
            return { stripNo, reflected: Boolean(rawOrder.reflected) };
          })
        : [];
      setAssignedTemplate({
        id: "local",
        name: "Custom",
        size: cfg.size === "small" ? "small" : "regular",
        strip3Enabled: Boolean(cfg.strip3Enabled),
        layout: { strips, order },
      });
      if (typeof cfg.price === "number") {
        setCustomPrice(Math.max(0, Math.round(cfg.price)));
      } else if (cfg.breakdown && typeof cfg.breakdown.total === "number") {
        setCustomPrice(Math.max(0, Math.round(cfg.breakdown.total)));
      }
    } catch {}
  }, []);

  const handleEnabled = (opt: "none" | "glide" | "lift") => {
    const eo = (edgeOption || "").toLowerCase();
    if (eo === "double_chamfer") return opt === "none";
    if (eo === "diamond" || eo === "flat_top") return opt !== "glide";
    return true;
  };

  useEffect(() => {
    if (!handleEnabled(stripSampleOption)) {
      setStripSampleOption("none");
    }
  }, [edgeOption]);

  useEffect(() => {
    if (!product) {
      setSelectedColor(null);
      setSelectedSize(null);
      return;
    }
    if (product.category === "apparel" && variants.length) {
      const firstVariant = variants[0];
      if (firstVariant) {
        setSelectedColor(firstVariant.color ?? null);
        const matchingSize = variants.find((variant) => variant.color === firstVariant.color)?.size ?? null;
        setSelectedSize(matchingSize);
      }
    }
  }, [product?.id, product?.category, variants]);

  const gallery = useMemo(() => {
    const byColor = selectedColor
      ? localImages.filter((im) => (im.color || "").toLowerCase() === selectedColor.toLowerCase())
      : [];
    return byColor.length ? byColor : localImages;
  }, [localImages, selectedColor]);

  const selectedVariant = useMemo(() => {
    if (!selectedColor || !selectedSize) return null;
    return variants.find((variant) => variant.color === selectedColor && variant.size === selectedSize) ?? null;
  }, [variants, selectedColor, selectedSize]);

  const basePrice = selectedVariant?.price_cents_override ?? product?.price_cents ?? 0;
  const extrasCents = useMemo(() => {
    if (!product) return 0;
    if (product.category !== "boards") return 0;
    let extras = 0;
    if (grooveEnabled) extras += Math.round((PRICING_SSO.extras.juiceGroove || 0) * 100);
    if (brassFeet) extras += Math.round((PRICING_SSO.extras.brassFeet || 0) * 100);
    return extras;
  }, [product, grooveEnabled, brassFeet]);

  const extrasDetailEntries = useMemo(() => {
    const details: Array<{ label: string; amountCents: number }> = [];
    if (grooveEnabled) details.push({ label: "Juice groove", amountCents: Math.round((PRICING_SSO.extras.juiceGroove || 0) * 100) });
    if (brassFeet) details.push({ label: "Brass feet", amountCents: Math.round((PRICING_SSO.extras.brassFeet || 0) * 100) });
    return details;
  }, [grooveEnabled, brassFeet]);

  const displayPrice = customPrice ?? basePrice + extrasCents;

  const etaLabel = useMemo(() => {
    if (!product) return "";
    if (product.category === "boards") {
      return estimateBoardETA({
        size: boardSize,
        strip3Enabled: assignedTemplate?.strip3Enabled ?? false,
        extras: { edgeProfile, chamferSize, grooveEnabled },
        ...(assignedTemplate ? { boardData: { strips: assignedTemplate.layout.strips } } : {}),
      }).label;
    }
    return estimateProductETA().label;
  }, [product, edgeProfile, chamferSize, grooveEnabled, boardSize, assignedTemplate]);

  const topRowColors: (string | null)[] = useMemo(() => {
    if (!assignedTemplate) return [];
    const cols = assignedTemplate.layout.strips[0]?.length ?? 12;
    const rows = boardSize === "small" ? 11 : 15;
    const effectiveOrder = (
      assignedTemplate.layout.order && assignedTemplate.layout.order.length
        ? assignedTemplate.layout.order
        : Array.from({ length: rows }, (_, i) => ({ stripNo: i % 2 === 0 ? 1 : 2, reflected: false }))
    ) as { stripNo: number; reflected: boolean }[];
    const rowObj = effectiveOrder[0] || { stripNo: 1, reflected: false };
    const stripIndex = Math.max(0, Math.min(2, (rowObj.stripNo ?? 1) - 1));
    const rowColors =
      assignedTemplate.layout.strips[stripIndex] ??
      Array<string | null>(cols).fill(null);
    return rowObj.reflected ? rowColors.slice().reverse() : rowColors;
  }, [assignedTemplate, boardSize]);

  const cornerColors2x2: (string | null)[][] = useMemo(() => {
    if (!assignedTemplate) return [[], []];
    const cols = assignedTemplate.layout.strips[0]?.length ?? 12;
    const rows = boardSize === "small" ? 11 : 15;
    const effectiveOrder = (
      assignedTemplate.layout.order && assignedTemplate.layout.order.length
        ? assignedTemplate.layout.order
        : Array.from({ length: rows }, (_, i) => ({ stripNo: i % 2 === 0 ? 1 : 2, reflected: false }))
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

  const isBoard = product?.category === "boards" && assignedTemplate;
  const disableAdd = product?.category === "apparel" && (!selectedColor || !selectedSize);
  const boardLayout: BoardLayout = assignedTemplate?.layout ?? { strips: [], order: [] };

  const addToCart = () => {
    if (!product) return;
    if (product.category === "apparel" && (!selectedVariant || !selectedColor || !selectedSize)) return;

    try {
      const raw = localStorage.getItem("bs_cart");
      const parsed = raw ? JSON.parse(raw) : [];
      const existing: ProductCartLine[] = Array.isArray(parsed) ? (parsed as ProductCartLine[]) : [];

      const id = `prod-${product.slug}-${Date.now()}`;
      const lineName = (() => {
        if (product.category === "apparel" && selectedVariant) {
          return `${product.name} – ${selectedColor ?? ""}/${selectedSize ?? ""}`;
        }
        if (product.category === "boards") {
          const opts: string[] = [];
          if (grooveEnabled) opts.push("Juice groove");
          if (edgeProfile === "roundover") opts.push(`Rounded ${borderRadius}px`);
          if (edgeProfile === "chamfer") opts.push(`Chamfer ${chamferSize}px`);
          return opts.length ? `${product.name} – ${opts.join(", ")}` : product.name;
        }
        return product.name;
      })();

      const previewImage = createBoardPreviewDataUrl({
        layout: boardLayout,
        size: assignedTemplate?.size ?? boardSize,
        extras: {
          edgeProfile,
          borderRadius,
          chamferSize,
          grooveEnabled,
        },
      });

      const line: ProductCartLine = {
        id,
        name: lineName,
        unitPrice: displayPrice,
        quantity: 1,
        product: { slug: product.slug },
        ...(product.category === "boards"
          ? {
              config: {
                size: assignedTemplate?.size ?? boardSize,
                strip3Enabled: assignedTemplate?.strip3Enabled ?? false,
                boardData: boardLayout,
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
                ...(extrasDetailEntries.length ? { extrasDetail: extrasDetailEntries } : {}),
              },
            }
          : {}),
        variant: selectedVariant
          ? {
              id: selectedVariant.id,
              color: selectedVariant.color ?? null,
              size: selectedVariant.size ?? null,
            }
          : null,
        image: previewImage,
      };

      const next = [...existing, line];
      localStorage.setItem("bs_cart", JSON.stringify(next));
      setAdded(true);
    } catch (error) {
      console.error("Failed to add to cart", error);
    }
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
          ...(product.primary_image_url ? { image: product.primary_image_url } : {}),
        }}
      />
      <div className="max-w-5xl mx-auto grid gap-6 md:grid-cols-2 items-start">
        <ProductGallery
          primary={gallery[0] ?? null}
          fallbackImage={product.primary_image_url}
          productName={product.name}
          gallery={gallery}
          onSelectImage={(image) => {
            const order = [image, ...localImages.filter((item) => item.id !== image.id)];
            setLocalImages(order);
          }}
        />
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-semibold">{product.name}</h1>
            <div className="text-lg font-medium mt-1">{formatCurrencyCents(displayPrice)}</div>
            <div className="text-xs opacity-70 mt-1">{etaLabel}</div>
          </div>
          {product.short_desc && <p className="text-sm opacity-80">{product.short_desc}</p>}

          {isBoard && assignedTemplate && (
            <>
              <BoardPreviewPanel
                layout={boardLayout}
                boardSize={boardSize}
                edgeProfile={edgeProfile}
                borderRadius={borderRadius}
                chamferSize={chamferSize}
                grooveEnabled={grooveEnabled}
                stripSampleOption={stripSampleOption}
                brassFeet={brassFeet}
                edgeOption={edgeOption}
              />
              <BoardExtrasControls
                boardSize={boardSize}
                onBoardSizeChange={(next) => setBoardSize(next === "large" ? "regular" : next)}
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
              />
            </>
          )}

          {product.category === "apparel" && variants.length > 0 && (
            <ProductVariantSelector
              variants={variants}
              selectedColor={selectedColor}
              selectedSize={selectedSize}
              onSelectColor={setSelectedColor}
              onSelectSize={setSelectedSize}
            />
          )}

          <ProductPurchasePanel
            onAddToCart={addToCart}
            onGoToCart={() => router.push("/cart")}
            disableAdd={disableAdd}
            added={added}
          />
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
  const url = base ? `${base}/products/${product.slug}` : `/products/${product.slug}`;
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
