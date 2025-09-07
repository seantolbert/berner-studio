"use client";

import { useEffect, useState } from "react";
import TemplateButton from "../components/TemplateButton";
import { listTemplates } from "@/lib/supabase/usage";
import type { BoardTemplate } from "../templates";

export default function GalleryPage() {
  const [templates, setTemplates] = useState<BoardTemplate[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await listTemplates();
        if (mounted) setTemplates(data);
      } catch (e: any) {
        console.error(e);
        if (mounted) setError(e?.message || "Failed to load gallery");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen w-full p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Gallery</h1>
        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</div>
        )}
        {!templates && !error && (
          <div className="text-sm opacity-70">Loading…</div>
        )}
        {templates && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {templates.map((t) => (
              <TemplateButton key={t.id} template={t} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

