"use client";

import React from "react";

type SectionsHeaderProps = {
  saving: boolean;
  onAdd: () => void;
  onSaveOrder: () => void;
};

export default function SectionsHeader({ saving, onAdd, onSaveOrder }: SectionsHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="text-lg font-semibold">Homepage Sections</div>
      <div className="flex items-center gap-2">
        <button onClick={onAdd} className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 text-sm">
          Add section
        </button>
        <button
          onClick={onSaveOrder}
          disabled={saving}
          className="h-9 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save order"}
        </button>
      </div>
    </div>
  );
}
