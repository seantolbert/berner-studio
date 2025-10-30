"use client";

import { useCallback, useEffect, useState } from "react";

type VariantRow = {
  include: boolean;
  color: string;
  size: string;
  sku: string;
  price_cents_override?: string;
  status: "draft" | "published";
};

type ExistingVariant = {
  id: string;
  color: string;
  size: string;
  sku: string | null;
  price_cents_override: number | null;
  status: "draft" | "published";
  updated_at: string;
};

type VariantsPanelProps = {
  productId: string;
  slug: string;
};

const DEFAULT_COLORS = ["grey", "purple", "blue"];
const DEFAULT_SIZES = ["S", "M", "L", "XL"];

export default function VariantsPanel({ productId, slug }: VariantsPanelProps) {
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [existingVariants, setExistingVariants] = useState<ExistingVariant[]>([]);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [variantsError, setVariantsError] = useState<string | null>(null);
  const [selectedColors, setSelectedColors] = useState<string[]>(DEFAULT_COLORS);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(DEFAULT_SIZES);

  const toggleSelection = (value: string, selected: string[], setSelected: (next: string[]) => void) => {
    setSelected(selected.includes(value) ? selected.filter((entry) => entry !== value) : [...selected, value]);
  };

  const updateVariant = (idx: number, partial: Partial<VariantRow>) => {
    setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, ...partial } : v)));
  };

  const refreshVariants = useCallback(async () => {
    setVariantsLoading(true);
    setVariantsError(null);
    try {
      const res = await fetch(`/api/admin/products/${productId}/variants`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load variants");
      setExistingVariants(Array.isArray(data.items) ? data.items : []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setVariantsError(message);
    } finally {
      setVariantsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    refreshVariants();
  }, [refreshVariants]);

  const generateVariants = () => {
    const rows: VariantRow[] = [];
    const slugBase = slug || "product";
    for (const color of selectedColors) {
      for (const size of selectedSizes) {
        const sku = `${slugBase}-${color}-${size}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
        rows.push({ include: true, color, size: size.toUpperCase(), sku, status: "draft" });
      }
    }
    setVariants(rows);
  };

  const saveVariants = async () => {
    const items = variants
      .filter((v) => v.include)
      .map((v) => ({
        color: v.color,
        size: v.size,
        sku: v.sku || null,
        price_cents_override: v.price_cents_override ? Math.round(Number(v.price_cents_override) * 100) : null,
        status: v.status,
      }));
    if (items.length === 0) return;
    try {
      const res = await fetch(`/api/admin/products/${productId}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to save variants");
      await refreshVariants();
      setVariants([]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setVariantsError(message);
    }
  };

  return (
    <div className="mt-6 rounded-lg border border-black/10 dark:border-white/10 p-4">
      <div className="text-lg font-semibold mb-1">Apparel Variants</div>
      <div className="text-xs opacity-70 mb-3">Generate color x size combinations, then save. You can edit or remove variants anytime.</div>
      {variantsError && <div className="text-sm text-red-600 dark:text-red-400 mb-2">{variantsError}</div>}
      <div className="grid md:grid-cols-2 gap-4 mb-3">
        <div>
          <div className="text-sm font-medium mb-1">Colors</div>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_COLORS.map((color) => {
              const active = selectedColors.includes(color);
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => toggleSelection(color, selectedColors, setSelectedColors)}
                  className={`h-8 px-3 rounded-md border text-xs ${
                    active ? "border-emerald-500 text-emerald-700 dark:text-emerald-300" : "border-black/10 dark:border-white/10"
                  }`}
                >
                  {color}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <div className="text-sm font-medium mb-1">Sizes</div>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_SIZES.map((size) => {
              const active = selectedSizes.includes(size);
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSelection(size, selectedSizes, setSelectedSizes)}
                  className={`h-8 px-3 rounded-md border text-xs ${
                    active ? "border-emerald-500 text-emerald-700 dark:text-emerald-300" : "border-black/10 dark:border-white/10"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <button
          type="button"
          className="h-8 px-3 rounded-md border border-black/10 dark:border-white/10 text-sm"
          onClick={generateVariants}
        >
          Generate combinations
        </button>
        <span className="text-xs opacity-70">Creates rows below; edit then Save variants.</span>
      </div>
      {variants.length > 0 && (
        <div className="rounded border border-black/10 dark:border-white/10 overflow-x-auto mb-3">
          <table className="w-full text-sm">
            <thead className="bg-black/5 dark:bg-white/10">
              <tr>
                <th className="px-2 py-1 text-left">Include</th>
                <th className="px-2 py-1 text-left">Color</th>
                <th className="px-2 py-1 text-left">Size</th>
                <th className="px-2 py-1 text-left">SKU</th>
                <th className="px-2 py-1 text-left">Price override</th>
                <th className="px-2 py-1 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((variant, idx) => (
                <tr key={`${variant.color}-${variant.size}-${idx}`} className="border-t border-black/10 dark:border-white/10">
                  <td className="px-2 py-1">
                    <input
                      type="checkbox"
                      checked={variant.include}
                      onChange={(e) => updateVariant(idx, { include: e.target.checked })}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      value={variant.color}
                      onChange={(e) => updateVariant(idx, { color: e.target.value })}
                      className="h-8 px-2 rounded border border-black/10 dark:border-white/10 bg-transparent"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      value={variant.size}
                      onChange={(e) => updateVariant(idx, { size: e.target.value.toUpperCase() })}
                      className="h-8 px-2 rounded border border-black/10 dark:border-white/10 bg-transparent w-16"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      value={variant.sku}
                      onChange={(e) => updateVariant(idx, { sku: e.target.value })}
                      className="h-8 px-2 rounded border border-black/10 dark:border-white/10 bg-transparent"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      value={variant.price_cents_override ?? ""}
                      onChange={(e) => updateVariant(idx, { price_cents_override: e.target.value })}
                      placeholder="$0.00"
                      className="h-8 px-2 rounded border border-black/10 dark:border-white/10 bg-transparent w-28"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <select
                      value={variant.status}
                      onChange={(e) => updateVariant(idx, { status: e.target.value as VariantRow["status"] })}
                      className="h-8 px-2 rounded border border-black/10 dark:border-white/10 bg-transparent"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {variants.length > 0 && (
        <div className="flex items-center justify-end mb-4">
          <button
            type="button"
            className="h-9 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
            onClick={saveVariants}
          >
            Save variants
          </button>
        </div>
      )}

      <div className="text-sm font-medium mb-1">Existing variants</div>
      {variantsLoading ? (
        <div className="text-sm opacity-70">Loading...</div>
      ) : existingVariants.length === 0 ? (
        <div className="text-sm opacity-70">No variants yet</div>
      ) : (
        <div className="rounded border border-black/10 dark:border-white/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-black/5 dark:bg-white/10">
              <tr>
                <th className="px-2 py-1 text-left">Color</th>
                <th className="px-2 py-1 text-left">Size</th>
                <th className="px-2 py-1 text-left">SKU</th>
                <th className="px-2 py-1 text-left">Price</th>
                <th className="px-2 py-1 text-left">Status</th>
                <th className="px-2 py-1 text-left">Updated</th>
                <th className="px-2 py-1 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {existingVariants.map((variant) => (
                <tr key={variant.id} className="border-t border-black/10 dark:border-white/10">
                  <td className="px-2 py-1">{variant.color}</td>
                  <td className="px-2 py-1">{variant.size}</td>
                  <td className="px-2 py-1">{variant.sku || "--"}</td>
                  <td className="px-2 py-1">
                    {variant.price_cents_override != null ? `$${(variant.price_cents_override / 100).toFixed(2)}` : "--"}
                  </td>
                  <td className="px-2 py-1 capitalize">{variant.status}</td>
                  <td className="px-2 py-1 whitespace-nowrap">{new Date(variant.updated_at).toLocaleString()}</td>
                  <td className="px-2 py-1">
                    <button
                      className="h-7 px-2 rounded-md border border-black/10 dark:border-white/10 text-xs mr-2"
                      onClick={async () => {
                        try {
                          await fetch(`/api/admin/products/${productId}/variants/${variant.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              status: variant.status === "published" ? "draft" : "published",
                            }),
                          });
                          await refreshVariants();
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                    >
                      {variant.status === "published" ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      className="h-7 px-2 rounded-md border border-black/10 dark:border-white/10 text-xs"
                      onClick={async () => {
                        if (!confirm("Delete this variant?")) return;
                        try {
                          await fetch(`/api/admin/products/${productId}/variants/${variant.id}`, { method: "DELETE" });
                          await refreshVariants();
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
