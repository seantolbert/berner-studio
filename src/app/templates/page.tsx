"use client";

import { useEffect, useState } from "react";
import { LS_SELECTED_TEMPLATE_KEY, type BoardTemplate } from "../templates";
import { supabase } from "@/lib/supabase/client";
import { setDynamicWoods } from "@/app/board-builder/components/woods";
import { useRouter } from "next/navigation";
import TemplateButton from "../components/TemplateButton";
import { listTemplates, listMyBoardTemplates } from "@/lib/supabase/usage";
import { useSupabaseUser } from "@/app/hooks/useSupabaseUser";

export default function TemplatesPage() {
  const router = useRouter();
  const { loading: authLoading } = useSupabaseUser();
  const [templates, setTemplates] = useState<BoardTemplate[] | null>(null);
  const [myTemplates, setMyTemplates] = useState<BoardTemplate[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await listTemplates();
        if (mounted) setTemplates(data);
      } catch (e: any) {
        console.error(e);
        if (mounted) setError(e?.message || "Failed to load templates");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);
  // Load available woods (colors) for correct preview rendering
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("builder_woods")
          .select("key,color,enabled")
          .eq("enabled", true)
          .order("name", { ascending: true });
        if (!cancelled && !error) {
          setDynamicWoods((data || []).map((w: any) => ({ key: w.key, color: w.color || "" })));
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (authLoading) return;
      try {
        const mine = await listMyBoardTemplates();
        if (mounted) setMyTemplates(mine);
      } catch (e: any) {
        console.error(e);
        if (mounted) setMyTemplates([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [authLoading]);
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl flex flex-col items-stretch gap-6">
        <h1 className="text-3xl font-semibold text-center">template selection</h1>
        {myTemplates === null && !error && (
          <div className="text-center text-sm opacity-70">Loading your designs…</div>
        )}
        {myTemplates && myTemplates.length > 0 && (
          <>
            <h2 className="text-sm opacity-80">Your saved designs</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {myTemplates.map((t) => (
                <TemplateButton
                  key={`mine-${t.id}`}
                  template={t}
                  onClick={() => {
                    localStorage.setItem(LS_SELECTED_TEMPLATE_KEY, JSON.stringify(t));
                    router.push("/board-builder");
                  }}
                />
              ))}
            </div>
          </>
        )}
        {templates === null && !error && (
          <div className="text-center text-sm opacity-70">Loading templates…</div>
        )}
        {error && (
          <div className="text-center text-sm text-red-600 dark:text-red-400">{error}</div>
        )}
        {templates && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {templates.map((t) => (
              <TemplateButton
                key={`seed-${t.id}`}
                template={t}
                onClick={() => {
                  localStorage.setItem(LS_SELECTED_TEMPLATE_KEY, JSON.stringify(t));
                  router.push("/board-builder");
                }}
              />
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            localStorage.setItem(LS_SELECTED_TEMPLATE_KEY, "__blank__");
            router.push("/board-builder");
          }}
          className="self-center inline-flex items-center justify-center rounded-md bg-black text-white dark:bg-white dark:text-black px-5 py-2.5 text-sm font-medium shadow hover:opacity-90 transition"
        >
          create your own
        </button>
      </div>
    </main>
  );
}
