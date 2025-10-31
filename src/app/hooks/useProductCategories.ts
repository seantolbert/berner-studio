"use client";

import { useEffect, useState } from "react";
import type { ProductCategoryRecord } from "@/types/product";
import { listProductCategoriesPublic } from "@/lib/supabase/usage";

export function useProductCategories() {
  const [categories, setCategories] = useState<ProductCategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    listProductCategoriesPublic()
      .then((items) => {
        if (!active) return;
        setCategories(items);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setCategories([]);
        setError(err instanceof Error ? err.message : "Failed to load categories");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { categories, loading, error };
}
