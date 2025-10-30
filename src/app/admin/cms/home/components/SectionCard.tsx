"use client";

import type { AdminHomeSection } from "@/types/home";
import CollectionsList from "./CollectionsList";

type SectionCardProps = {
  section: AdminHomeSection;
  index: number;
  onMove: (index: number, delta: number) => void;
  onDelete: (id: string) => void;
  onChange: (section: AdminHomeSection) => void;
  onSave: (section: AdminHomeSection) => void;
  onAddCollection: (sectionId: string) => void;
  onSaveCollectionsOrder: (sectionId: string, collections: AdminHomeSection["collections"]) => void;
  onUpdateCollection: (sectionId: string, collection: { id: string; label: string; href: string }) => void;
  onDeleteCollection: (sectionId: string, collectionId: string) => void;
};

export default function SectionCard({
  section,
  index,
  onMove,
  onDelete,
  onChange,
  onSave,
  onAddCollection,
  onSaveCollectionsOrder,
  onUpdateCollection,
  onDeleteCollection,
}: SectionCardProps) {
  return (
    <div className="rounded-md border border-black/10 dark:border-white/10 p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Section {index + 1}</div>
        <div className="flex items-center gap-2">
          <button onClick={() => onMove(index, -1)} className="h-8 px-2 rounded-md border border-black/10 dark:border-white/10 text-xs">
            Up
          </button>
          <button onClick={() => onMove(index, 1)} className="h-8 px-2 rounded-md border border-black/10 dark:border-white/10 text-xs">
            Down
          </button>
          <button
            onClick={() => onDelete(section.id)}
            className="h-8 px-2 rounded-md border border-red-200 text-red-700 dark:border-red-700/50 dark:text-red-200 text-xs"
          >
            Delete
          </button>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-2 mt-2">
        <input
          value={section.title}
          onChange={(event) => onChange({ ...section, title: event.target.value })}
          placeholder="Title"
          className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm"
        />
        <input
          value={section.subtext || ""}
          onChange={(event) => onChange({ ...section, subtext: event.target.value })}
          placeholder="Subtext"
          className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm"
        />
      </div>
      <div className="grid md:grid-cols-4 gap-2 mt-2">
        <input
          value={section.view_all_label || ""}
          onChange={(event) => onChange({ ...section, view_all_label: event.target.value })}
          placeholder="View all label"
          className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm"
        />
        <input
          value={section.view_all_href || ""}
          onChange={(event) => onChange({ ...section, view_all_href: event.target.value })}
          placeholder="View all href (e.g., /boards)"
          className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm"
        />
        <label className="flex items-center gap-2 text-sm">
          <span>Max items</span>
          <input
            type="number"
            min={3}
            max={12}
            value={section.max_items}
            onChange={(event) => {
              const value = Math.max(3, Math.min(12, Number(event.target.value) || 3));
              onChange({ ...section, max_items: value });
            }}
            className="h-9 w-20 px-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Product category</span>
          <select
            value={section.category || ""}
            onChange={(event) => onChange({ ...section, category: event.target.value || null })}
            className="h-9 px-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent"
          >
            <option value="">(Manual selection)</option>
            <option value="boards">Boards</option>
            <option value="bottle-openers">Bottle Openers</option>
            <option value="apparel">Apparel</option>
          </select>
        </label>
      </div>
      <div className="flex items-center justify-end gap-2 mt-2">
        <button
          onClick={() => onSave(section)}
          className="h-8 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
        >
          Save
        </button>
      </div>
      <CollectionsList
        sectionId={section.id}
        collections={section.collections}
        onChange={(collections) => onChange({ ...section, collections })}
        onSaveOrder={onSaveCollectionsOrder}
        onAdd={onAddCollection}
        onSaveCollection={onUpdateCollection}
        onDeleteCollection={onDeleteCollection}
      />
    </div>
  );
}
