"use client";

import { useEffect, useState } from "react";
import { listMyBoardTemplates } from "@/lib/supabase/usage";
import type { BoardTemplate } from "../templates";
import TemplateButton from "../components/TemplateButton";
import { useRouter } from "next/navigation";
import { LS_SELECTED_TEMPLATE_KEY } from "../templates";
import { useSupabaseUser } from "@/app/hooks/useSupabaseUser";

export default function MyDesignsPage() {
  const { user, loading } = useSupabaseUser();
  const [templates, setTemplates] = useState<BoardTemplate[]>([]);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (loading || !user) return;
      try {
        const mine = await listMyBoardTemplates();
        if (mounted) setTemplates(mine || []);
      } catch {
        if (mounted) setTemplates([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [loading, user]);

  return (
    <main className="min-h-screen w-full p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">My Designs</h1>
        {!user && (
          <div className="text-sm opacity-70">Sign in to see your saved designs.</div>
        )}
        {user && templates.length === 0 && (
          <div className="text-sm opacity-70">No designs yet.</div>
        )}
        {user && templates.length > 0 && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {templates.map((t) => (
              <TemplateButton
                key={t.id}
                template={t}
                onClick={() => {
                  localStorage.setItem(LS_SELECTED_TEMPLATE_KEY, JSON.stringify(t));
                  router.push("/board-builder");
                }}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

