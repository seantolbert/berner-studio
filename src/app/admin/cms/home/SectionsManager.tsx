"use client";

import { useEffect, useState } from "react";

type Section = {
  id: string;
  title: string;
  subtext: string | null;
  view_all_label: string | null;
  view_all_href: string | null;
  max_items: number;
  position: number;
  category: string | null;
  collections?: Array<{ id: string; label: string; href: string }>;
};

export default function SectionsManager() {
  const [loading, setLoading] = useState(true);
  const [savingOrder, setSavingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sections, setSections] = useState<Section[]>([]);

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/home-sections");
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to load sections");
        const items = (json.items || []).map((s: any) => ({
          id: s.id,
          title: s.title,
          subtext: s.subtext ?? null,
          view_all_label: s.view_all_label ?? null,
          view_all_href: s.view_all_href ?? null,
          max_items: s.max_items ?? 3,
          position: s.position ?? 0,
          category: s.category ?? null,
          collections: (s.collections || []).map((c: any) => ({ id: c.id, label: c.label, href: c.href ?? "" })),
        }));
        if (!aborted) setSections(items);
      } catch (e: any) {
        if (!aborted) setError(e?.message || "Unexpected error");
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => { aborted = true; };
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
    if (!res.ok) { alert(json?.error || "Failed to create"); return; }
    // reload
    location.reload();
  }

  function move(idx: number, delta: number) {
    const next = [...sections];
    const j = idx + delta;
    if (j < 0 || j >= next.length) return;
    const [it] = next.splice(idx, 1);
    if (!it) return;
    next.splice(j, 0, it);
    setSections(next);
  }

  async function saveOrder() {
    setSavingOrder(true);
    try {
      const ids = sections.map((s) => s.id);
      const res = await fetch("/api/admin/home-sections/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to save order");
    } catch (e: any) {
      alert(e?.message || "Failed to save order");
    } finally {
      setSavingOrder(false);
    }
  }

  async function saveSection(s: Section) {
    const res = await fetch(`/api/admin/home-sections/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: s.title,
        subtext: s.subtext ?? null,
        view_all_label: s.view_all_label ?? null,
        view_all_href: s.view_all_href ?? null,
        max_items: s.max_items,
        category: s.category ?? null,
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
    if (!res.ok) { alert(json?.error || "Failed to add"); return; }
    location.reload();
  }

  async function saveCollectionsOrder(sectionId: string, items: { id: string; label: string; href: string }[]) {
    const ids = items.map((i) => i.id);
    const res = await fetch(`/api/admin/home-sections/${sectionId}/collections`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    const json = await res.json();
    if (!res.ok) alert(json?.error || "Failed to save collection order");
  }

  async function updateCollection(sectionId: string, col: { id: string; label: string; href: string }) {
    const res = await fetch(`/api/admin/home-sections/${sectionId}/collections/${col.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: col.label, href: col.href || null }),
    });
    const json = await res.json();
    if (!res.ok) alert(json?.error || "Failed to save collection");
  }

  async function deleteCollection(sectionId: string, id: string) {
    if (!confirm("Delete this collection?")) return;
    const res = await fetch(`/api/admin/home-sections/${sectionId}/collections/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) { alert(json?.error || "Failed to delete"); return; }
    setSections((prev)=>prev.map((s)=> s.id===sectionId ? { ...s, collections: (s as any).collections.filter((c: any)=>c.id!==id) } : s));
  }

  async function deleteSection(id: string) {
    if (!confirm("Delete this section?")) return;
    const res = await fetch(`/api/admin/home-sections/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) { alert(json?.error || "Failed to delete"); return; }
    setSections((prev) => prev.filter((s) => s.id !== id));
  }

  if (loading) return <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 text-sm opacity-70">Loading sections…</div>;
  if (error) return <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-100 dark:border-red-700/50 p-3 text-sm">{error}</div>;

  return (
    <section className="rounded-lg border border-black/10 dark:border-white/10 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-lg font-semibold">Homepage Sections</div>
        <div className="flex items-center gap-2">
          <button onClick={createSection} className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 text-sm">Add section</button>
          <button onClick={saveOrder} disabled={savingOrder} className="h-9 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm">{savingOrder ? 'Saving…' : 'Save order'}</button>
        </div>
      </div>
      <div className="grid gap-3">
        {sections.map((s: any, idx) => (
          <div key={s.id} className="rounded-md border border-black/10 dark:border-white/10 p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Section {idx + 1}</div>
              <div className="flex items-center gap-2">
                <button onClick={() => move(idx, -1)} className="h-8 px-2 rounded-md border border-black/10 dark:border-white/10 text-xs">Up</button>
                <button onClick={() => move(idx, 1)} className="h-8 px-2 rounded-md border border-black/10 dark:border-white/10 text-xs">Down</button>
                <button onClick={() => deleteSection(s.id)} className="h-8 px-2 rounded-md border border-red-200 text-red-700 dark:border-red-700/50 dark:text-red-200 text-xs">Delete</button>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-2 mt-2">
              <input value={s.title} onChange={(e)=>setSections((prev)=>prev.map((x)=>x.id===s.id?{...x,title:e.target.value}:x))} placeholder="Title" className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm" />
              <input value={s.subtext || ''} onChange={(e)=>setSections((prev)=>prev.map((x)=>x.id===s.id?{...x,subtext:e.target.value}:x))} placeholder="Subtext" className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm" />
            </div>
            <div className="grid md:grid-cols-4 gap-2 mt-2">
              <input value={s.view_all_label || ''} onChange={(e)=>setSections((prev)=>prev.map((x)=>x.id===s.id?{...x,view_all_label:e.target.value}:x))} placeholder="View all label" className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm" />
              <input value={s.view_all_href || ''} onChange={(e)=>setSections((prev)=>prev.map((x)=>x.id===s.id?{...x,view_all_href:e.target.value}:x))} placeholder="View all href (e.g., /boards)" className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm" />
              <label className="flex items-center gap-2 text-sm">
                <span>Max items</span>
                <input type="number" min={3} max={12} value={s.max_items} onChange={(e)=>setSections((prev)=>prev.map((x)=>x.id===s.id?{...x,max_items:Math.max(3, Math.min(12, Number(e.target.value)||3))}:x))} className="h-9 w-20 px-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent" />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span>Product category</span>
                <select
                  value={s.category || ''}
                  onChange={(e)=>setSections((prev)=>prev.map((x)=>x.id===s.id?{...x,category:e.target.value || null}:x))}
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
              <button onClick={()=>saveSection(s)} className="h-8 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs">Save</button>
            </div>

            {/* Collections */}
            <div className="mt-3 pt-3 border-t border-black/10 dark:border-white/10">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">Collections (optional)</div>
                <div className="flex items-center gap-2">
                  <button onClick={() => addCollection(s.id)} className="h-8 px-2 rounded-md border border-black/10 dark:border-white/10 text-xs">Add</button>
                  <button onClick={() => saveCollectionsOrder(s.id, s.collections)} className="h-8 px-2 rounded-md border border-black/10 dark:border-white/10 text-xs">Save order</button>
                </div>
              </div>
              <div className="grid gap-2">
                {s.collections?.map((c: any, cIdx: number) => (
                  <div key={c.id} className="grid md:grid-cols-[1fr_1fr_auto_auto] gap-2 items-center">
                    <input value={c.label} onChange={(e)=>{
                      const label = e.target.value;
                      setSections((prev:any)=>prev.map((sec:any)=> sec.id===s.id ? { ...sec, collections: sec.collections.map((x:any)=> x.id===c.id ? { ...x, label } : x) } : sec));
                    }} placeholder="Label" className="h-8 px-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm" />
                    <input value={c.href || ''} onChange={(e)=>{
                      const href = e.target.value;
                      setSections((prev:any)=>prev.map((sec:any)=> sec.id===s.id ? { ...sec, collections: sec.collections.map((x:any)=> x.id===c.id ? { ...x, href } : x) } : sec));
                    }} placeholder="Href (optional)" className="h-8 px-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm" />
                    <div className="flex items-center gap-1">
                      <button onClick={() => {
                        // move up
                        setSections((prev:any)=>prev.map((sec:any)=>{
                          if (sec.id!==s.id) return sec;
                          const list = [...sec.collections];
                          if (cIdx<=0) return sec;
                          const [it] = list.splice(cIdx,1);
                          list.splice(cIdx-1,0,it);
                          return { ...sec, collections: list };
                        }));
                      }} className="h-8 px-2 rounded-md border border-black/10 dark:border-white/10 text-xs">Up</button>
                      <button onClick={() => {
                        setSections((prev:any)=>prev.map((sec:any)=>{
                          if (sec.id!==s.id) return sec;
                          const list = [...sec.collections];
                          if (cIdx>=list.length-1) return sec;
                          const [it] = list.splice(cIdx,1);
                          list.splice(cIdx+1,0,it);
                          return { ...sec, collections: list };
                        }));
                      }} className="h-8 px-2 rounded-md border border-black/10 dark:border-white/10 text-xs">Down</button>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => updateCollection(s.id, c)} className="h-8 px-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs">Save</button>
                      <button onClick={() => deleteCollection(s.id, c.id)} className="h-8 px-2 rounded-md border border-red-200 text-red-700 dark:border-red-700/50 dark:text-red-200 text-xs">Delete</button>
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
