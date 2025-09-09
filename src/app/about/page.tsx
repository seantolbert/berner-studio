"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function AboutPage() {
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState<string>("");
  const [body, setBody] = useState<string>("");

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("about_page")
          .select("title, body_md")
          .maybeSingle();
        if (!aborted && data) {
          setTitle(data.title || "About");
          setBody(data.body_md || "");
        }
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => { aborted = true; };
  }, []);

  return (
    <main className="min-h-screen w-full p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="text-2xl font-semibold">{loading ? 'Loading…' : (title || 'About')}</h1>
        {!loading && (
          <pre className="opacity-80 text-sm whitespace-pre-wrap">{body || 'More info coming soon.'}</pre>
        )}
      </div>
    </main>
  );
}
