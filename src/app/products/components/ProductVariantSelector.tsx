"use client";

import { useMemo } from "react";
import type { ProductVariant } from "@/types/product";

type ProductVariantSelectorProps = {
  variants: ProductVariant[];
  selectedColor: string | null;
  selectedSize: string | null;
  onSelectColor: (color: string | null) => void;
  onSelectSize: (size: string | null) => void;
};

export function ProductVariantSelector({
  variants,
  selectedColor,
  selectedSize,
  onSelectColor,
  onSelectSize,
}: ProductVariantSelectorProps) {
  const colorOptions = useMemo(() => Array.from(new Set(variants.map((variant) => variant.color))), [variants]);
  const sizeOptions = useMemo(() => {
    if (!selectedColor) return [];
    return variants.filter((variant) => variant.color === selectedColor).map((variant) => variant.size);
  }, [variants, selectedColor]);

  return (
    <div className="space-y-3">
      <div>
        <div className="text-sm font-medium mb-1">Color</div>
        <div className="flex flex-wrap gap-2">
          {colorOptions.map((color) => (
            <button
              key={color ?? "unknown"}
              type="button"
              onClick={() => onSelectColor(color ?? null)}
              className={`h-9 px-3 rounded-md border text-sm ${
                selectedColor === color
                  ? "border-emerald-500 text-emerald-700 dark:text-emerald-300"
                  : "border-black/10 dark:border-white/10"
              }`}
            >
              {color ?? "Unspecified"}
            </button>
          ))}
        </div>
      </div>
      {selectedColor && (
        <div>
          <div className="text-sm font-medium mb-1">Size</div>
          <div className="flex flex-wrap gap-2">
            {sizeOptions.map((size) => (
              <button
                key={size ?? "unknown"}
                type="button"
                onClick={() => onSelectSize(size ?? null)}
                className={`h-9 px-3 rounded-md border text-sm ${
                  selectedSize === size
                    ? "border-emerald-500 text-emerald-700 dark:text-emerald-300"
                    : "border-black/10 dark:border-white/10"
                }`}
              >
                {size ?? "Unspecified"}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
