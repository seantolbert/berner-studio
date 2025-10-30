"use client";

import { useMemo, useState } from "react";

export type CategoryRecord = {
  id: string;
  name: string;
  slug: string;
};

type CategoryManagerProps = {
  open: boolean;
  onClose: () => void;
  categories: CategoryRecord[];
  refreshCategories: () => Promise<void>;
  onCategoryCreated?: (_category: CategoryRecord) => void;
  onCategoryRenamed?: (_category: CategoryRecord, _previousSlug: string | null) => void;
};

export default function CategoryManager({ open, onClose, categories, refreshCategories, onCategoryCreated, onCategoryRenamed }: CategoryManagerProps) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    [categories]
  );

  if (!open) return null;

  const resetStates = () => {
    setNewName("");
    setEditingId(null);
    setEditingName("");
    setBusyId(null);
    setSubmitting(false);
  };

  const handleClose = () => {
    resetStates();
    setError(null);
    onClose();
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newName.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to create category");
      setNewName("");
      await refreshCategories();
      if (data?.item && typeof onCategoryCreated === "function") {
        onCategoryCreated(data.item as CategoryRecord);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create category";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRename = async (id: string) => {
    if (!editingName.trim()) {
      setError("Name cannot be empty.");
      return;
    }
    const current = categories.find((cat) => cat.id === id);
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingName }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to rename category");
      setEditingId(null);
      setEditingName("");
      await refreshCategories();
      if (data?.item && typeof onCategoryRenamed === "function") {
        onCategoryRenamed(data.item as CategoryRecord, current?.slug ?? null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to rename category";
      setError(message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete the “${name}” category? Products assigned to it will need to be updated manually.`)) return;
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to delete category");
      await refreshCategories();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete category";
      setError(message);
    } finally {
      setBusyId(null);
    }
  };

  const beginEdit = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-lg rounded-lg border border-black/10 dark:border-white/10 bg-background p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Manage categories</h2>
            <p className="text-sm opacity-70">Create, rename, or delete product categories.</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-black/10 dark:border-white/10 text-sm"
            aria-label="Close category manager"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleCreate} className="mt-5 flex items-center gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New category name"
            className="flex-1 h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm"
            disabled={submitting}
          />
          <button
            type="submit"
            className="h-9 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm disabled:opacity-60"
            disabled={submitting}
          >
            {submitting ? "Adding…" : "Add"}
          </button>
        </form>

        <div className="mt-6">
          <div className="text-sm font-medium mb-2">Existing categories</div>
          {sortedCategories.length === 0 ? (
            <div className="text-sm opacity-70 border border-black/10 dark:border-white/10 rounded-md p-3">
              No categories yet. Add one above to get started.
            </div>
          ) : (
            <ul className="space-y-2">
              {sortedCategories.map((cat) => {
                const isEditing = editingId === cat.id;
                const isBusy = busyId === cat.id;
                return (
                  <li
                    key={cat.id}
                    className="flex flex-col gap-2 rounded-md border border-black/10 dark:border-white/10 p-3 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      {isEditing ? (
                        <input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="flex-1 h-8 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent"
                          disabled={isBusy}
                        />
                      ) : (
                        <div>
                          <div className="font-medium">{cat.name}</div>
                          <div className="text-xs opacity-70">Slug: {cat.slug}</div>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleRename(cat.id)}
                              disabled={isBusy}
                              className="h-8 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs disabled:opacity-60"
                            >
                              {isBusy ? "Saving…" : "Save"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(null);
                                setEditingName("");
                              }}
                              disabled={isBusy}
                              className="h-8 px-3 rounded-md border border-black/10 dark:border-white/10 text-xs"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => beginEdit(cat.id, cat.name)}
                              className="h-8 px-3 rounded-md border border-black/10 dark:border-white/10 text-xs"
                            >
                              Rename
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(cat.id, cat.name)}
                              disabled={isBusy}
                              className="h-8 px-3 rounded-md border border-red-300 text-red-700 dark:text-red-300 text-xs disabled:opacity-60"
                            >
                              {isBusy ? "Deleting…" : "Delete"}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {error ? (
          <div className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</div>
        ) : null}
      </div>
    </div>
  );
}
