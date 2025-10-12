"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type FAQ = { id: string; question: string; answer: string; position: number };

export default function FAQPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<FAQ[]>([]);

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("faq")
          .select("id,question,answer,position")
          .eq("published", true)
          .order("position", { ascending: true });
        if (!aborted) setItems((data as FAQ[]) ?? []);
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => { aborted = true; };
  }, []);

  return (
    <main className="min-h-screen w-full p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold">Care & FAQ</h1>
        {loading ? (
          <div className="text-sm opacity-70">Loading…</div>
        ) : items.length === 0 ? (
          <div className="text-sm opacity-70">No FAQs available.</div>
        ) : (
          items.map((f) => (
            <section key={f.id}>
              <h2 className="text-lg font-medium">{f.question}</h2>
              <p className="opacity-80 text-sm mt-1 whitespace-pre-wrap">{f.answer}</p>
            </section>
          ))
        )}
      </div>
    </main>
  );
}
