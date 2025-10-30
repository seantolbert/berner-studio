"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onDelete = async () => {
    if (loading) return;
    const confirmed = confirm(`Permanently delete “${name}”? This cannot be undone.`);
    if (!confirmed) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${id}?hard=true`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = typeof data?.error === "string" ? data.error : "Failed to delete product";
        alert(message);
        return;
      }
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete product";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={loading}
      className="text-sm text-red-600 hover:underline disabled:opacity-60"
    >
      {loading ? "Deleting…" : "Delete"}
    </button>
  );
}
