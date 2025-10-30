"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminHomeSection } from "@/types/home";
import { parseAdminHomeSections } from "@/services/adminHome";

type UseHomeSectionsResult = {
  sections: AdminHomeSection[];
  loading: boolean;
  error: string | null;
  setSections: React.Dispatch<React.SetStateAction<AdminHomeSection[]>>;
  refresh: () => Promise<void>;
};

export function useHomeSections(): UseHomeSectionsResult {
  const [sections, setSections] = useState<AdminHomeSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/home-sections");
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load sections");
      const parsed = parseAdminHomeSections({ items: json.items ?? [] });
      setSections(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  return { sections, loading, error, setSections, refresh };
}

