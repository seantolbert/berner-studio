"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdminGuard from "@/app/admin/AdminGuard";

export default function AdminInfoPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/info");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load");
        if (aborted) return;
        setTitle(data.item?.title || "");
        setBody(data.item?.body_md || "");
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Unexpected error";
        if (!aborted) setError(message);
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => {
      aborted = true;
    };
  }, []);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/info", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body_md: body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to save");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unexpected error";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen w-full p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-semibold">Info Page</h1>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/admin" className="underline">Admin Dashboard</Link>
            <Link href="/admin/cms" className="underline">CMS Home</Link>
          </div>
        </div>
        <AdminGuard>
          <div className="mb-4">
            <Link href="/admin/cms" className="text-sm underline">Back to CMS</Link>
          </div>
          {loading ? (
            <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 text-sm opacity-70">Loading…</div>
          ) : (
            <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 space-y-4">
              {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}
              <label className="flex flex-col gap-1 text-sm">
                <span>Title</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span>Body (Markdown)</span>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={12}
                  className="px-3 py-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent"
                />
              </label>
              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showPreview}
                    onChange={(e) => setShowPreview(e.target.checked)}
                  />
                  Preview
                </label>
                <button
                  className="h-9 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
                  disabled={saving}
                  onClick={save}
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
              {showPreview && (
                <div className="rounded-md border border-black/10 dark:border-white/10 p-3 text-sm opacity-90">
                  <div className="text-base font-medium mb-2">{title || "Untitled"}</div>
                  <pre className="whitespace-pre-wrap text-sm opacity-80">{body}</pre>
                </div>
              )}
            </div>
          )}
        </AdminGuard>
      </div>
    </main>
  );
}
