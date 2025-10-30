"use client";

import Link from "next/link";
import { useState } from "react";
import type { CategoryRecord } from "@/app/admin/cms/products/CategoryManager";
import type { CollectionOption } from "../types";

type ProductFormSectionProps = {
  name: string;
  slug: string;
  price: string;
  category: string;
  status: "draft" | "published" | "archived";
  description: string;
  tags: string[];
  productTemplateId: string | null | "";
  templateOptions: Array<{ id: string; name: string }>;
  categories: CategoryRecord[];
  categoriesLoading: boolean;
  categoriesError: string | null;
  currentCollections: CollectionOption[];
  saving: boolean;
  canSave: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onNameChange: (value: string) => void;
  onSlugChange: (value: string) => void;
  onPriceChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onManageCategories: () => void;
  onStatusChange: (value: "draft" | "published" | "archived") => void;
  onDescriptionChange: (value: string) => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  hasTag: (tag: string) => boolean;
  showTemplateSelector: boolean;
  onTemplateChange: (value: string) => void;
};

export default function ProductFormSection({
  name,
  slug,
  price,
  category,
  status,
  description,
  tags,
  productTemplateId,
  templateOptions,
  categories,
  categoriesLoading,
  categoriesError,
  currentCollections,
  saving,
  canSave,
  onSubmit,
  onNameChange,
  onSlugChange,
  onPriceChange,
  onCategoryChange,
  onManageCategories,
  onStatusChange,
  onDescriptionChange,
  onAddTag,
  onRemoveTag,
  hasTag,
  showTemplateSelector,
  onTemplateChange,
}: ProductFormSectionProps) {
  const [tagInput, setTagInput] = useState("");

  const handleTagAdd = () => {
    const value = tagInput.trim();
    if (!value) return;
    onAddTag(value);
    setTagInput("");
  };

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-black/10 dark:border-white/10 p-4 space-y-4">
      <div className="grid md:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span>Name</span>
          <input
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            required
            className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Slug</span>
          <input
            value={slug}
            onChange={(e) => onSlugChange(e.target.value)}
            className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent"
          />
        </label>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span>Price</span>
          <div className="flex items-center gap-1">
            <span className="px-2 opacity-70">$</span>
            <input
              value={price}
              onChange={(e) => onPriceChange(e.target.value)}
              inputMode="decimal"
              placeholder="0.00"
              className="h-9 flex-1 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent"
            />
          </div>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Category</span>
          <div className="flex items-center gap-2">
            <select
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="h-9 px-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent flex-1"
              disabled={categoriesLoading || categories.length === 0}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onManageCategories}
              className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 text-xs"
            >
              Add
            </button>
          </div>
          {categoriesError ? (
            <span className="text-xs text-red-600 dark:text-red-400">{categoriesError}</span>
          ) : null}
          {!categoriesLoading && !categories.length && !categoriesError ? (
            <span className="text-xs text-amber-600">Add a category to continue.</span>
          ) : null}
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Status</span>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value as ProductFormSectionProps["status"])}
            className="h-9 px-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>
      </div>

      {showTemplateSelector ? (
        <div className="rounded-md border border-black/10 dark:border-white/10 p-3">
          <div className="text-sm font-medium mb-2">Board Template</div>
          <label className="flex items-center gap-2 text-sm">
            <span className="w-32 opacity-80">Assigned template</span>
            <select
              value={productTemplateId || ""}
              onChange={(e) => onTemplateChange(e.target.value)}
              className="h-9 px-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent flex-1"
            >
              <option value="">-- None --</option>
              {templateOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <div className="text-[11px] opacity-70 mt-1">
            Templates come from the Product Templates table. Use the builder Save action to add more.
          </div>
        </div>
      ) : null}

      {currentCollections.length ? (
        <div className="rounded-md border border-black/10 dark:border-white/10 p-3">
          <div className="text-sm font-medium mb-2">Collections</div>
          <div className="flex flex-wrap gap-3">
            {currentCollections.map((collection) => (
              <label key={collection.id} className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={hasTag(collection.label)}
                  onChange={(e) => (e.target.checked ? onAddTag(collection.label) : onRemoveTag(collection.label))}
                />
                {collection.label}
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <label className="flex flex-col gap-1 text-sm">
        <span>Tags</span>
        <div className="flex items-center gap-2">
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleTagAdd();
              }
            }}
            placeholder="Type a tag and press Enter"
            className="h-9 flex-1 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent"
          />
          <button
            type="button"
            onClick={handleTagAdd}
            className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 text-sm"
          >
            Add
          </button>
        </div>
        {tags.length ? (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-2 rounded-full border border-black/10 dark:border-white/10 px-3 py-1 text-xs"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => onRemoveTag(tag)}
                  aria-label={`Remove ${tag}`}
                  className="opacity-70 hover:opacity-100"
                >
                  x
                </button>
              </span>
            ))}
          </div>
        ) : null}
        <span className="text-[11px] opacity-70">Tags help with internal grouping and filters. They are case-insensitive.</span>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span>Description (Markdown)</span>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={10}
          className="px-3 py-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent"
        />
      </label>

      <div className="flex items-center justify-end gap-2">
        <Link href="/admin/cms/products" className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 text-sm">
          Cancel
        </Link>
        <button
          disabled={saving || !canSave}
          className="h-9 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm disabled:opacity-60"
          type="submit"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
