"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import CostSummary from "@/features/board-builder/ui/CostSummary";
import { estimateProductETA } from "@/lib/leadtime";
import { formatCurrencyCents } from "@/lib/money";
import { createBoardPreviewDataUrl } from "@/lib/boardPreviewImage";
import type {
  ProductCore,
  ProductImage,
  ProductVariant,
  ProductTemplateDetail,
} from "@/types/product";
import type { CartItem } from "@/types/cart";
import { ProductGallery } from "@/app/products/components/ProductGallery";
import { BoardPreviewPanel } from "@/app/products/components/BoardPreviewPanel";
import { BoardExtrasControls } from "@/app/products/components/BoardExtrasControls";
import { ProductVariantSelector } from "@/app/products/components/ProductVariantSelector";
import { ProductPurchasePanel } from "@/app/products/components/ProductPurchasePanel";
import { useBoardCustomization } from "@/features/products/hooks/useBoardCustomization";
import { appendCartItem, emitCartUpdate } from "@/utils/cartStorage";

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

  const {
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
  } = useBoardCustomization({ product, template });
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedImageId(images[0]?.id ?? null);
  }, [images]);

  useEffect(() => {
    if (!product) return;
    setAdded(false);
    resetBoardOptions();
  }, [product, resetBoardOptions]);

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
  }, [product, variants]);

  const gallery = useMemo(() => {
    const byColor = selectedColor
      ? images.filter((im) => (im.color || "").toLowerCase() === selectedColor.toLowerCase())
      : [];
    return byColor.length ? byColor : images;
  }, [images, selectedColor]);

  useEffect(() => {
    if (!selectedImageId) return;
    const exists = gallery.some((image) => image.id === selectedImageId);
    if (!exists) {
      setSelectedImageId(gallery[0]?.id ?? null);
    }
  }, [gallery, selectedImageId]);

  const displayImage = useMemo(() => {
    if (selectedImageId) {
      const match = gallery.find((image) => image.id === selectedImageId);
      if (match) return match;
    }
    return gallery[0] ?? null;
  }, [gallery, selectedImageId]);

  const selectedVariant = useMemo(() => {
    if (!selectedColor || !selectedSize) return null;
    return variants.find((variant) => variant.color === selectedColor && variant.size === selectedSize) ?? null;
  }, [variants, selectedColor, selectedSize]);

  const basePrice = selectedVariant?.price_cents_override ?? product?.price_cents ?? 0;

  const displayPrice = useMemo(() => {
    if (product?.category === "boards") {
      if (boardPricing) return boardPricing.totalCents;
      return basePrice + extrasCents;
    }
    return basePrice;
  }, [product?.category, boardPricing, basePrice, extrasCents]);

  const etaLabel = useMemo(() => {
    if (!product) return "";
    if (product.category === "boards") {
      return boardEtaLabel;
    }
    return estimateProductETA().label;
  }, [boardEtaLabel, product]);

  const disableAdd = product?.category === "apparel" && (!selectedColor || !selectedSize);

  const addToCart = () => {
    if (!product) return;
    if (product.category === "apparel" && (!selectedVariant || !selectedColor || !selectedSize)) return;

    try {
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

      const boardBreakdown =
        product?.category === "boards" && boardPricing
          ? {
              baseCents: boardPricing.baseCents,
              variableCents: boardPricing.variableCents,
              extrasCents: boardPricing.extrasCents,
            }
          : undefined;

      const breakdown =
        product?.category === "boards"
          ? {
              baseCents: boardBreakdown?.baseCents ?? basePrice,
              variableCents: boardBreakdown?.variableCents ?? 0,
              extrasCents: boardBreakdown?.extrasCents ?? extrasCents,
              ...(extrasDetailEntries.length ? { extrasDetail: extrasDetailEntries } : {}),
            }
          : undefined;

      const boardPreviewImage =
        canCustomizeBoard && assignedTemplate
          ? createBoardPreviewDataUrl({
              layout: boardLayout,
              size: assignedTemplate.size,
              extras: {
                edgeProfile,
                borderRadius,
                chamferSize,
                grooveEnabled,
              },
            })
          : null;

      const fallbackProductImage = (() => {
        if (gallery[0]?.url) return gallery[0].url;
        if (product.primary_image_url) return product.primary_image_url;
        return null;
      })();

      const cartLineImage = boardPreviewImage ?? fallbackProductImage ?? undefined;

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
                edgeOption,
                handleStyle: stripSampleOption,
                brassFeet,
              },
              ...(breakdown ? { breakdown } : {}),
            }
          : {}),
        variant: selectedVariant
          ? {
              id: selectedVariant.id,
              color: selectedVariant.color ?? null,
              size: selectedVariant.size ?? null,
            }
          : null,
        ...(cartLineImage ? { image: cartLineImage } : {}),
      };

      appendCartItem<ProductCartLine>(line);
      emitCartUpdate();
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
      <div className="max-w-5xl mx-auto grid gap-6 md:grid-cols-2 items-start">
      <ProductGallery
          primary={displayImage}
          fallbackImage={product.primary_image_url}
          productName={product.name}
          gallery={gallery}
          onSelectImage={(image) => {
            setSelectedImageId(image.id);
          }}
        />
        <div className="space-y-4 px-3">
          <div>
            <h1 className="text-2xl font-semibold">{product.name}</h1>
            <div className="text-lg font-medium mt-1">{formatCurrencyCents(displayPrice)}</div>
            {etaLabel && !canCustomizeBoard ? <div className="text-xs opacity-70 mt-1">{etaLabel}</div> : null}
          </div>
          {product.short_desc ? (
            <p className="text-sm opacity-80">{product.short_desc}</p>
          ) : null}
          {product.long_desc ? (
            <article className="prose prose-sm max-w-none dark:prose-invert">
              <div
                dangerouslySetInnerHTML={{ __html: product.long_desc }}
              />
            </article>
          ) : null}

          {canCustomizeBoard && assignedTemplate && (
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
                onBoardSizeChange={setBoardSize}
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
              {boardPricing ? (
                <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 space-y-3">
                  <div className="text-sm font-medium">Price breakdown</div>
                  <CostSummary
                    base={boardPricing.base}
                    variable={boardPricing.variable}
                    cellCount={boardPricing.cellCount}
                    juiceGrooveEnabled={grooveEnabled}
                    brassFeetEnabled={brassFeet}
                    total={boardPricing.totalCents / 100}
                    etaLabel={etaLabel}
                    hideCellsRow
                    woodBreakdown={boardPricing.woodBreakdown}
                  />
                </div>
              ) : null}
              <ProductPurchasePanel
                onAddToCart={addToCart}
                onGoToCart={() => router.push("/cart")}
                disableAdd={disableAdd}
                added={added}
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
          {!canCustomizeBoard && (
            <ProductPurchasePanel
              onAddToCart={addToCart}
              onGoToCart={() => router.push("/cart")}
              disableAdd={disableAdd}
              added={added}
            />
          )}
        </div>
      </div>
    </main>
  );
}
