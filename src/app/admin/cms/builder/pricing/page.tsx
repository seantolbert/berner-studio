"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdminGuard from "@/app/admin/AdminGuard";

type Pricing = {
  currency: string;
  cell_price: number;
  base_small: number;
  base_regular: number;
  base_large: number;
  extra_third_strip: number;
  extra_juice_groove: number;
  extra_brass_feet: number;
};

export default function BuilderPricingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pricing, setPricing] = useState<Pricing>({
    currency: "USD",
    cell_price: 1,
    base_small: 150,
    base_regular: 200,
    base_large: 300,
    extra_third_strip: 0,
    extra_juice_groove: 20,
    extra_brass_feet: 0,
  });

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/builder/pricing");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load pricing");
        if (aborted) return;
        if (data?.item) setPricing((prev) => ({ ...prev, ...data.item }));
      } catch (e: any) {
        setError(e?.message || "Unexpected error");
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => { aborted = true; };
  }, []);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/builder/pricing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pricing),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to save");
    } catch (e: any) {
      setError(e?.message || "Unexpected error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen w-full p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-semibold">Builder Pricing</h1>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/admin" className="underline">Admin Dashboard</Link>
            <Link href="/admin/cms" className="underline">CMS Home</Link>
          </div>
        </div>
        <AdminGuard>
          {loading ? (
            <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 text-sm opacity-70">Loading…</div>
          ) : (
            <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 space-y-6">
              {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}

              <div className="grid md:grid-cols-3 gap-3">
                <label className="flex flex-col gap-1 text-sm">
                  <span>Currency</span>
                  <input value={pricing.currency} onChange={(e)=>setPricing((p)=>({...p, currency: e.target.value}))} className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent" />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span>Cell price</span>
                  <input type="number" min="0" step="0.01" value={pricing.cell_price} onChange={(e)=>setPricing((p)=>({...p, cell_price: Number(e.target.value) || 0}))} className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent" />
                </label>
                <div />
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                <label className="flex flex-col gap-1 text-sm">
                  <span>Base (Small)</span>
                  <input type="number" min="0" step="0.01" value={pricing.base_small} onChange={(e)=>setPricing((p)=>({...p, base_small: Number(e.target.value) || 0}))} className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent" />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span>Base (Regular)</span>
                  <input type="number" min="0" step="0.01" value={pricing.base_regular} onChange={(e)=>setPricing((p)=>({...p, base_regular: Number(e.target.value) || 0}))} className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent" />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span>Base (Large)</span>
                  <input type="number" min="0" step="0.01" value={pricing.base_large} onChange={(e)=>setPricing((p)=>({...p, base_large: Number(e.target.value) || 0}))} className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent" />
                </label>
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                <label className="flex flex-col gap-1 text-sm">
                  <span>Extra: Third strip</span>
                  <input type="number" min="0" step="0.01" value={pricing.extra_third_strip} onChange={(e)=>setPricing((p)=>({...p, extra_third_strip: Number(e.target.value) || 0}))} className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent" />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span>Extra: Juice groove</span>
                  <input type="number" min="0" step="0.01" value={pricing.extra_juice_groove} onChange={(e)=>setPricing((p)=>({...p, extra_juice_groove: Number(e.target.value) || 0}))} className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent" />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span>Extra: Brass feet</span>
                  <input type="number" min="0" step="0.01" value={pricing.extra_brass_feet} onChange={(e)=>setPricing((p)=>({...p, extra_brass_feet: Number(e.target.value) || 0}))} className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent" />
                </label>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button onClick={save} disabled={saving} className="h-9 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm">
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>

              {/* Woods section */}
              <WoodsManager />
            </div>
          )}
        </AdminGuard>
      </div>
    </main>
  );
}

function WoodsManager() {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [items, setItems] = useState<Array<{ key: string; name: string; price_per_stick: number; enabled: boolean; color: string | null }>>([]);
  const [adding, setAdding] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState<string>("");
  const [newEnabled, setNewEnabled] = useState(true);
  const [newColor, setNewColor] = useState<string>("#cccccc");

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/builder/woods");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load woods");
        if (!aborted) setItems(data.items || []);
      } catch (e: any) {
        if (!aborted) setErrorMsg(e?.message || "Unexpected error");
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => { aborted = true; };
  }, []);

  const addWood = async () => {
    setAdding(true);
    try {
      const res = await fetch("/api/admin/builder/woods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: newKey.trim(), name: newName.trim(), price_per_stick: Number(newPrice || 0), enabled: newEnabled, color: newColor }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to add wood");
      // Reload
      const res2 = await fetch("/api/admin/builder/woods");
      const data2 = await res2.json();
      setItems(data2.items || []);
      setNewKey(""); setNewName(""); setNewPrice(""); setNewEnabled(true); setNewColor("#cccccc");
    } catch (e: any) {
      alert(e?.message || "Failed to add wood");
    } finally {
      setAdding(false);
    }
  };

  const updateWood = async (key: string, patch: Partial<{ name: string; price_per_stick: number; enabled: boolean; color: string }>) => {
    try {
      const res = await fetch(`/api/admin/builder/woods/${key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to save");
    } catch (e: any) {
      alert(e?.message || "Failed to save");
    }
  };

  const removeWood = async (key: string) => {
    if (!confirm("Remove this wood species?")) return;
    try {
      const res = await fetch(`/api/admin/builder/woods/${key}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to delete");
      setItems((prev) => prev.filter((w) => w.key !== key));
    } catch (e: any) {
      alert(e?.message || "Failed to delete");
    }
  };

  return (
    <section>
      <div className="text-lg font-semibold mb-2">Available Woods</div>
      {loading ? (
        <div className="text-sm opacity-70">Loading…</div>
      ) : (
        <div className="space-y-3">
          {errorMsg && <div className="text-sm text-red-600 dark:text-red-400">{errorMsg}</div>}
          {/* Add new */}
          <div className="rounded-md border border-black/10 dark:border-white/10 p-3">
            <div className="text-sm font-medium mb-2">Add wood species</div>
            <div className="grid md:grid-cols-5 gap-2">
              <input value={newKey} onChange={(e)=>setNewKey(e.target.value)} placeholder="Key (e.g., walnut)" className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm" />
              <input value={newName} onChange={(e)=>setNewName(e.target.value)} placeholder="Name (e.g., Walnut)" className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm" />
              <input value={newPrice} onChange={(e)=>setNewPrice(e.target.value)} placeholder="Price per stick" inputMode="decimal" className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm" />
              <div className="flex items-center gap-2">
                <input value={newColor} onChange={(e)=>setNewColor(e.target.value)} placeholder="#hex color" className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm w-full" />
                <span className="inline-block h-6 w-6 rounded border" style={{ backgroundColor: newColor || '#ccc' }} />
              </div>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={newEnabled} onChange={(e)=>setNewEnabled(e.target.checked)} />
                Enabled
              </label>
            </div>
            <div className="flex items-center justify-end mt-2">
              <button onClick={addWood} disabled={adding || !newKey || !newName} className="h-9 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm">{adding? 'Adding…':'Add'}</button>
            </div>
          </div>

          {/* List */}
          <div className="rounded-md border border-black/10 dark:border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-black/5 dark:bg-white/10">
                <tr>
                  <th className="text-left px-3 py-2">Key</th>
                  <th className="text-left px-3 py-2">Name</th>
                  <th className="text-left px-3 py-2">Price/stick</th>
                  <th className="text-left px-3 py-2">Enabled</th>
                  <th className="text-left px-3 py-2">Color</th>
                  <th className="text-left px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-4 text-center opacity-70">No woods defined yet.</td>
                  </tr>
                ) : (
                  items.map((w) => (
                    <tr key={w.key} className="border-t border-black/10 dark:border-white/10">
                      <td className="px-3 py-2 font-mono text-xs">{w.key}</td>
                      <td className="px-3 py-2">
                        <input value={w.name} onChange={(e)=> setItems((prev)=>prev.map((x)=> x.key===w.key? { ...x, name: e.target.value } : x))} className="h-8 px-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent" />
                      </td>
                      <td className="px-3 py-2">
                        <input value={String(w.price_per_stick)} onChange={(e)=> setItems((prev)=>prev.map((x)=> x.key===w.key? { ...x, price_per_stick: Number(e.target.value) || 0 } : x))} inputMode="decimal" className="h-8 px-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent w-28" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="checkbox" checked={w.enabled} onChange={(e)=> setItems((prev)=>prev.map((x)=> x.key===w.key? { ...x, enabled: e.target.checked } : x))} />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <input value={w.color || ''} onChange={(e)=> setItems((prev)=>prev.map((x)=> x.key===w.key? { ...x, color: e.target.value } : x))} placeholder="#hex color" className="h-8 px-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent w-28" />
                          <span className="inline-block h-5 w-5 rounded border" style={{ backgroundColor: w.color || '#ccc' }} />
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <button onClick={()=>updateWood(w.key, { name: w.name, price_per_stick: w.price_per_stick, enabled: w.enabled, ...(w.color ? { color: w.color } : {}) })} className="h-8 px-2 rounded-md border border-black/10 dark:border-white/10 text-xs">Save</button>
                          <button onClick={()=>removeWood(w.key)} className="h-8 px-2 rounded-md border border-red-200 text-red-700 dark:border-red-700/50 dark:text-red-200 text-xs">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
