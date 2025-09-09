"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdminGuard from "@/app/admin/AdminGuard";

type FAQ = { id: string; question: string; answer: string; position: number; published: boolean; updated_at: string };

export default function AdminFAQPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<FAQ[]>([]);
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const [pos, setPos] = useState<string>("0");
  const [publ, setPubl] = useState(true);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/faq");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load FAQs");
      setItems(data.items || []);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unexpected error";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function addFAQ() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/faq", {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ question: q, answer: a, position: Number(pos)||0, published: publ }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to add');
      setQ(""); setA(""); setPos("0"); setPubl(true);
      await refresh();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unexpected error';
      setError(message);
    } finally { setSaving(false); }
  }

  return (
    <main className="min-h-screen w-full p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-semibold">FAQ</h1>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/admin" className="underline">Admin Dashboard</Link>
            <Link href="/admin/cms" className="underline">CMS Home</Link>
          </div>
        </div>
        <AdminGuard>
          <div className="mb-4">
            <Link href="/admin/cms" className="text-sm underline">Back to CMS</Link>
          </div>

          <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 mb-4">
            <div className="text-sm font-medium mb-2">Add FAQ</div>
            {error && <div className="text-sm text-red-600 dark:text-red-400 mb-2">{error}</div>}
            <div className="grid md:grid-cols-2 gap-3 mb-2">
              <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Question" className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm" />
              <input value={pos} onChange={(e)=>setPos(e.target.value)} placeholder="Position" className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm w-24" />
            </div>
            <textarea value={a} onChange={(e)=>setA(e.target.value)} placeholder="Answer" rows={4} className="w-full px-3 py-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm mb-2" />
            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={publ} onChange={(e)=>setPubl(e.target.checked)} /> Published</label>
              <button className="h-9 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm" disabled={saving} onClick={addFAQ}>{saving? 'Saving…':'Add'}</button>
            </div>
          </div>

          <div className="rounded-lg border border-black/10 dark:border-white/10 overflow-hidden">
            {loading ? (
              <div className="p-4 text-sm opacity-70">Loading…</div>
            ) : items.length === 0 ? (
              <div className="p-4 text-sm opacity-70">No FAQs</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-black/5 dark:bg-white/10">
                  <tr>
                    <th className="text-left px-3 py-2">Question</th>
                    <th className="text-left px-3 py-2">Position</th>
                    <th className="text-left px-3 py-2">Published</th>
                    <th className="text-left px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((f) => (
                    <tr key={f.id} className="border-t border-black/10 dark:border-white/10">
                      <td className="px-3 py-2">
                        <div className="font-medium truncate max-w-[26rem]" title={f.question}>{f.question}</div>
                        <div className="text-xs opacity-70 truncate max-w-[26rem]" title={f.answer}>{f.answer}</div>
                      </td>
                      <td className="px-3 py-2 w-28">
                        <input defaultValue={String(f.position)} onBlur={async (e)=>{ try{ await fetch(`/api/admin/faq/${f.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ position: Number(e.target.value)||0 }) }); } catch{} }} className="h-8 w-20 px-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent" />
                      </td>
                      <td className="px-3 py-2 w-32">
                        <label className="inline-flex items-center gap-2 text-xs">
                          <input type="checkbox" defaultChecked={f.published} onChange={async (e)=>{ try{ await fetch(`/api/admin/faq/${f.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ published: e.target.checked }) }); } catch{} }} /> Published
                        </label>
                      </td>
                      <td className="px-3 py-2 w-56">
                        <button className="h-8 px-2 rounded-md border border-black/10 dark:border-white/10 text-xs mr-2" onClick={async()=>{
                          const nq = prompt('Edit question', f.question); if (nq===null) return;
                          const na = prompt('Edit answer', f.answer); if (na===null) return;
                          try { await fetch(`/api/admin/faq/${f.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ question:nq, answer:na }) }); await refresh(); } catch{}
                        }}>Edit</button>
                        <button className="h-8 px-2 rounded-md border border-black/10 dark:border-white/10 text-xs" onClick={async()=>{ if(!confirm('Delete FAQ?')) return; try{ await fetch(`/api/admin/faq/${f.id}`, { method:'DELETE' }); await refresh(); } catch{} }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </AdminGuard>
      </div>
    </main>
  );
}
