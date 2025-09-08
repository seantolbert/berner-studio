"use client";

import { useSupabaseUser } from "@/app/hooks/useSupabaseUser";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useSupabaseUser();
  const allow = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (loading) return <div className="text-sm opacity-70">Checking access…</div>;
  const email = (user?.email || "").toLowerCase();
  const ok = user && allow.length > 0 && allow.includes(email);
  if (!ok) {
    return (
      <div className="rounded-lg border border-black/10 dark:border-white/10 p-4">
        <div className="text-sm font-medium mb-1">Access restricted</div>
        <div className="text-sm opacity-70">Sign in with an admin email to view this page.</div>
      </div>
    );
  }
  return <>{children}</>;
}

