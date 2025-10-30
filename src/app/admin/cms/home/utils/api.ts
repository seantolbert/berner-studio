"use client";

import type { AdminHomeSection } from "@/types/home";

export async function createSection(title: string) {
  const res = await fetch("/api/admin/home-sections", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "Failed to create section");
  return json;
}

export async function deleteSection(id: string) {
  const res = await fetch(`/api/admin/home-sections/${id}`, { method: "DELETE" });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "Failed to delete section");
  return json;
}

export async function saveSection(section: AdminHomeSection) {
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
  if (!res.ok) throw new Error(json?.error || "Failed to save section");
  return json;
}

export async function reorderSections(ids: string[]) {
  const res = await fetch("/api/admin/home-sections/reorder", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "Failed to save order");
  return json;
}

export async function addCollection(sectionId: string, payload: { label: string; href?: string }) {
  const res = await fetch(`/api/admin/home-sections/${sectionId}/collections`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ label: payload.label, href: payload.href ?? null }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "Failed to add collection");
  return json;
}

export async function reorderCollections(sectionId: string, ids: string[]) {
  const res = await fetch(`/api/admin/home-sections/${sectionId}/collections`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "Failed to reorder collections");
  return json;
}

export async function updateCollection(sectionId: string, collection: { id: string; label: string; href: string }) {
  const res = await fetch(`/api/admin/home-sections/${sectionId}/collections/${collection.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ label: collection.label, href: collection.href || null }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "Failed to save collection");
  return json;
}

export async function deleteCollection(sectionId: string, id: string) {
  const res = await fetch(`/api/admin/home-sections/${sectionId}/collections/${id}`, { method: "DELETE" });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "Failed to delete collection");
  return json;
}

