"use client";

import { useEffect, useState } from "react";
import type { AdminHomeSection } from "@/types/home";
import { parseAdminHomeSections } from "@/services/adminHome";

export default function SectionsManager() {
  const [loading, setLoading] = useState(true);
  const [savingOrder, setSavingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sections, setSections] = useState<AdminHomeSection[]>([]);

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/home-sections");
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to load sections");
        const parsed = parseAdminHomeSections({ items: json.items ?? [] });
        setSections(parsed);
      } catch (err) {
        if (!aborted) setError(err instanceof Error ? err.message : "Unexpected error");
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => {
      aborted = true;
    };
  }, []);

  async function createSection() {
    const title = prompt("Section title");
    if (!title) return;
    const res = await fetch("/api/admin/home-sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    const json = await res.json();
    if (!res.ok) {
      alert(json?.error || "Failed to create");
      return;
    }
    location.reload();
  }

  function move(index: number, delta: number) {
    setSections((prev) => {
      const next = [...prev];
      const targetIndex = index + delta;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      const [item] = next.splice(index, 1);
      if (!item) return prev;
      next.splice(targetIndex, 0, item);
      return next;
    });
  }

  async function saveOrder() {
    setSavingOrder(true);
    try {
      const ids = sections.map((section) => section.id);
      const res = await fetch("/api/admin/home-sections/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to save order");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save order");
    } finally {
      setSavingOrder(false);
    }
  }

  async function saveSection(section: AdminHomeSection) {
    const res = await fetch(`/api/admin/home-sections/${section.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: section.title,
        subtext: section.subtext ?? null,
        view_all_label: section.view_all_label ?? null,
        view_all_href: section.view_all_href ?? null,
        max_items: section.max_items,
        category: section.category ?? null,
      }),
    });
    const json = await res.json();
    if (!res.ok) alert(json?.error || "Failed to save");
  }

  async function addCollection(sectionId: string) {
    const label = prompt("Collection label");
    if (!label) return;
    const href = prompt("Collection href (optional)") || undefined;
    const res = await fetch(`/api/admin/home-sections/${sectionId}/collections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, href: href || null }),
    });
    const json = await res.json();
    if (!res.ok) {
      alert(json?.error || "Failed to add");
      return;
    }
    location.reload();
  }

  async function saveCollectionsOrder(sectionId: string, items: { id: string }[]) {
    const ids = items.map((item) => item.id);
    const res = await fetch(`/api/admin/home-sections/${sectionId}/collections`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    const json = await res.json();
    if (!res.ok) alert(json?.error || "Failed to save collection order");
  }

  async function updateCollection(sectionId: string, collection: { id: string; label: string; href: string }) {
    const res = await fetch(`/api/admin/home-sections/${sectionId}/collections/${collection.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: collection.label, href: collection.href || null }),
    });
    const json = await res.json();
    if (!res.ok) alert(json?.error || "Failed to save collection");
  }

  async function deleteCollection(sectionId: string, id: string) {
    if (!confirm("Delete this collection?")) return;
    const res = await fetch(`/api/admin/home-sections/${sectionId}/collections/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) {
      alert(json?.error || "Failed to delete");
      return;
    }
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? { ...section, collections: section.collections.filter((collection) => collection.id !== id) }
          : section
      )
    );
  }

  async function deleteSection(id: string) {
    if (!confirm("Delete this section?")) return;
    const res = await fetch(`/api/admin/home-sections/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) {
      alert(json?.error || "Failed to delete");
      return;
    }
    setSections((prev) => prev.filter((section) => section.id !== id));
  }

  if (loading) {
    return <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 text-sm opacity-70">Loading sections…</div>;
  }
  if (error) {
    return <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-100 dark:border-red-700/50 p-3 text-sm">{error}</div>;
  }

  return (
    <section className="rounded-lg border border-black/10 dark:border-white/10 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-lg font-semibold">Homepage Sections</div>
        <div className="flex items-center gap-2">
          <button onClick={createSection} className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 text-sm">Add section</button>
          <button onClick={saveOrder} disabled={savingOrder} className="h-9 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm">
            {savingOrder ? "Saving…" : "Save order"}
          </button>
        </div>
      </div>
      <div className="grid gap-3">
        {sections.map((section, index) => (
          <div key={section.id} className="rounded-md border border-black/10 dark:border-white/10 p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Section {index + 1}</div>
              <div className="flex items-center gap-2">
                <button onClick={() => move(index, -1)} className="h-8 px-2 rounded-md border border-black/10 dark:border-white/10 text-xs">
                  Up
                </button>
                <button onClick={() => move(index, 1)} className="h-8 px-2 rounded-md border border-black/10 dark:border-white/10 text-xs">
                  Down
                </button>
                <button onClick={() => deleteSection(section.id)} className="h-8 px-2 rounded-md border border-red-200 text-red-700 dark:border-red-700/50 dark:text-red-200 text-xs">
                  Delete
                </button>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-2 mt-2">
              <input
                value={section.title}
                onChange={(event) =>
                  setSections((prev) =>
                    prev.map((item) => (item.id === section.id ? { ...item, title: event.target.value } : item))
                  )
                }
                placeholder="Title"
                className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm"
              />
              <input
                value={section.subtext || ""}
                onChange={(event) =>
                  setSections((prev) =>
                    prev.map((item) => (item.id === section.id ? { ...item, subtext: event.target.value } : item))
                  )
                }
                placeholder="Subtext"
                className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm"
              />
            </div>
            <div className="grid md:grid-cols-4 gap-2 mt-2">
              <input
                value={section.view_all_label || ""}
                onChange={(event) =>
                  setSections((prev) =>
                    prev.map((item) =>
                      item.id === section.id ? { ...item, view_all_label: event.target.value } : item
                    )
                  )
                }
                placeholder="View all label"
                className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm"
              />
              <input
                value={section.view_all_href || ""}
                onChange={(event) =>
                  setSections((prev) =>
                    prev.map((item) =>
                      item.id === section.id ? { ...item, view_all_href: event.target.value } : item
                    )
                  )
                }
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
                    setSections((prev) =>
                      prev.map((item) => (item.id === section.id ? { ...item, max_items: value } : item))
                    );
                  }}
                  className="h-9 w-20 px-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span>Product category</span>
                <select
                  value={section.category || ""}
                  onChange={(event) =>
                    setSections((prev) =>
                      prev.map((item) =>
                        item.id === section.id ? { ...item, category: event.target.value || null } : item
                      )
                    )
                  }
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
                onClick={() => saveSection(section)}
                className="h-8 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                Save
              </button>
            </div>
            <div className="mt-3 pt-3 border-t border-black/10 dark:border-white/10">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">Collections (optional)</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => addCollection(section.id)}
                    className="h-8 px-2 rounded-md border border-black/10 dark:border-white/10 text-xs"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => saveCollectionsOrder(section.id, section.collections)}
                    className="h-8 px-2 rounded-md border border-black/10 dark:border-white/10 text-xs"
                  >
                    Save order
                  </button>
                </div>
              </div>
              <div className="grid gap-2">
                {section.collections.map((collection, collectionIndex) => (
                  <div key={collection.id} className="grid md:grid-cols-[1fr_1fr_auto_auto] gap-2 items-center">
                    <input
                      value={collection.label}
                      onChange={(event) => {
                        const label = event.target.value;
                        setSections((prev) =>
                          prev.map((item) =>
                            item.id === section.id
                              ? {
                                  ...item,
                                  collections: item.collections.map((entry) =>
                                    entry.id === collection.id ? { ...entry, label } : entry
                                  ),
                                }
                              : item
                          )
                        );
                      }}
                      placeholder="Label"
                      className="h-8 px-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm"
                    />
                    <input
                      value={collection.href}
                      onChange={(event) => {
                        const href = event.target.value;
                        setSections((prev) =>
                          prev.map((item) =>
                            item.id === section.id
                              ? {
                                  ...item,
                                  collections: item.collections.map((entry) =>
                                    entry.id === collection.id ? { ...entry, href } : entry
                                  ),
                                }
                              : item
                          )
                        );
                      }}
                      placeholder="Href (optional)"
                      className="h-8 px-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm"
                    />
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          setSections((prev) =>
                            prev.map((item) => {
                              if (item.id !== section.id) return item;
                              if (collectionIndex <= 0) return item;
                              const list = [...item.collections];
                              const [current] = list.splice(collectionIndex, 1);
                              if (!current) return item;
                              list.splice(collectionIndex - 1, 0, current);
                              return { ...item, collections: list };
                            })
                          )
                        }
                        className="h-8 px-2 rounded-md border border-black/10 dark:border-white/10 text-xs"
                      >
                        Up
                      </button>
                      <button
                        onClick={() =>
                          setSections((prev) =>
                            prev.map((item) => {
                              if (item.id !== section.id) return item;
                              const list = [...item.collections];
                              if (collectionIndex >= list.length - 1) return item;
                              const [current] = list.splice(collectionIndex, 1);
                              if (!current) return item;
                              list.splice(collectionIndex + 1, 0, current);
                              return { ...item, collections: list };
                            })
                          )
                        }
                        className="h-8 px-2 rounded-md border border-black/10 dark:border-white/10 text-xs"
                      >
                        Down
                      </button>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => updateCollection(section.id, collection)}
                        className="h-8 px-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => deleteCollection(section.id, collection.id)}
                        className="h-8 px-2 rounded-md border border-red-200 text-red-700 dark:border-red-700/50 dark:text-red-200 text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="text-xs opacity-70 mt-2">Product selection UI coming next.</div>
    </section>
  );
}
