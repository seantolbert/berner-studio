"use client";

import type { AdminHomeSection } from "@/types/home";

type CollectionsListProps = {
  sectionId: string;
  collections: AdminHomeSection["collections"];
  onChange: (collections: AdminHomeSection["collections"]) => void;
  onSaveOrder: (sectionId: string, collections: AdminHomeSection["collections"]) => void;
  onAdd: (sectionId: string) => void;
  onSaveCollection: (sectionId: string, collection: { id: string; label: string; href: string }) => void;
  onDeleteCollection: (sectionId: string, collectionId: string) => void;
};

export default function CollectionsList({
  sectionId,
  collections,
  onChange,
  onSaveOrder,
  onAdd,
  onSaveCollection,
  onDeleteCollection,
}: CollectionsListProps) {
  const move = (index: number, delta: number) => {
    const targetIndex = index + delta;
    if (targetIndex < 0 || targetIndex >= collections.length) return;
    const next = [...collections];
    const [current] = next.splice(index, 1);
    if (!current) return;
    next.splice(targetIndex, 0, current);
    onChange(next);
  };

  const update = (id: string, partial: Partial<{ label: string; href: string }>) => {
    onChange(collections.map((collection) => (collection.id === id ? { ...collection, ...partial } : collection)));
  };

  return (
    <div className="mt-3 pt-3 border-top border-black/10 dark:border-white/10">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium">Collections (optional)</div>
        <div className="flex items-center gap-2">
          <button onClick={() => onAdd(sectionId)} className="h-8 px-2 rounded-md border border-black/10 dark:border-white/10 text-xs">
            Add
          </button>
          <button onClick={() => onSaveOrder(sectionId, collections)} className="h-8 px-2 rounded-md border border-black/10 dark:border-white/10 text-xs">
            Save order
          </button>
        </div>
      </div>
      <div className="grid gap-2">
        {collections.map((collection, index) => (
          <div key={collection.id} className="grid md:grid-cols-[1fr_1fr_auto_auto] gap-2 items-center">
            <input
              value={collection.label}
              onChange={(event) => update(collection.id, { label: event.target.value })}
              placeholder="Label"
              className="h-8 px-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm"
            />
            <input
              value={collection.href}
              onChange={(event) => update(collection.id, { href: event.target.value })}
              placeholder="Href (optional)"
              className="h-8 px-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm"
            />
            <div className="flex items-center gap-1">
              <button onClick={() => move(index, -1)} className="h-8 px-2 rounded-md border border-black/10 dark:border-white/10 text-xs">
                Up
              </button>
              <button onClick={() => move(index, 1)} className="h-8 px-2 rounded-md border border-black/10 dark:border-white/10 text-xs">
                Down
              </button>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => onSaveCollection(sectionId, collection)}
                className="h-8 px-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                Save
              </button>
              <button
                onClick={() => onDeleteCollection(sectionId, collection.id)}
                className="h-8 px-2 rounded-md border border-red-200 text-red-700 dark:border-red-700/50 dark:text-red-200 text-xs"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
