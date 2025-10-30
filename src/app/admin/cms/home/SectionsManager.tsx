"use client";

import { useState } from "react";
import type { AdminHomeSection } from "@/types/home";
import { useHomeSections } from "./hooks/useHomeSections";
import {
  createSection,
  deleteSection as deleteSectionApi,
  saveSection as saveSectionApi,
  reorderSections,
  addCollection,
  reorderCollections,
  updateCollection,
  deleteCollection,
} from "./utils/api";
import SectionsHeader from "./components/SectionsHeader";
import SectionsList from "./components/SectionsList";

export default function SectionsManager() {
  const { sections, loading, error, setSections } = useHomeSections();
  const [savingOrder, setSavingOrder] = useState(false);

  const handleAddSection = async () => {
    const title = prompt("Section title");
    if (!title) return;
    try {
      await createSection(title);
      location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create");
    }
  };

  const handleMove = (index: number, delta: number) => {
    setSections((prev) => {
      const next = [...prev];
      const targetIndex = index + delta;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      const [item] = next.splice(index, 1);
      if (!item) return prev;
      next.splice(targetIndex, 0, item);
      return next;
    });
  };

  const handleSaveOrder = async () => {
    setSavingOrder(true);
    try {
      await reorderSections(sections.map((section) => section.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save order");
    } finally {
      setSavingOrder(false);
    }
  };

  const handleSaveSection = async (section: AdminHomeSection) => {
    try {
      await saveSectionApi(section);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save section");
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!confirm("Delete this section?")) return;
    try {
      await deleteSectionApi(id);
      setSections((prev) => prev.filter((section) => section.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const handleAddCollection = async (sectionId: string) => {
    const label = prompt("Collection label");
    if (!label) return;
    const hrefInput = prompt("Collection href (optional)")?.trim();
    const payload = hrefInput ? { label, href: hrefInput } : { label };
    try {
      await addCollection(sectionId, payload);
      location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add");
    }
  };

  const handleSaveCollectionsOrder = async (
    sectionId: string,
    collections: AdminHomeSection["collections"],
  ) => {
    try {
      await reorderCollections(sectionId, collections.map((item) => item.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save collection order");
    }
  };

  const handleSaveCollection = async (
    sectionId: string,
    collection: { id: string; label: string; href: string },
  ) => {
    try {
      await updateCollection(sectionId, collection);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save collection");
    }
  };

  const handleDeleteCollection = async (sectionId: string, collectionId: string) => {
    if (!confirm("Delete this collection?")) return;
    try {
      await deleteCollection(sectionId, collectionId);
      setSections((prev) =>
        prev.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                collections: section.collections.filter((collection) => collection.id !== collectionId),
              }
            : section,
        ),
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete collection");
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 text-sm opacity-70">
        Loading sections...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-100 dark:border-red-700/50 p-3 text-sm">
        {error}
      </div>
    );
  }

  return (
    <section className="rounded-lg border border-black/10 dark:border-white/10 p-4">
      <SectionsHeader saving={savingOrder} onAdd={handleAddSection} onSaveOrder={handleSaveOrder} />
      <SectionsList
        sections={sections}
        onSectionsChange={setSections}
        onMove={handleMove}
        onDelete={handleDeleteSection}
        onSaveSection={handleSaveSection}
        onAddCollection={handleAddCollection}
        onSaveCollectionsOrder={handleSaveCollectionsOrder}
        onUpdateCollection={handleSaveCollection}
        onDeleteCollection={handleDeleteCollection}
      />
      <div className="text-xs opacity-70 mt-2">Product selection UI coming next.</div>
    </section>
  );
}
