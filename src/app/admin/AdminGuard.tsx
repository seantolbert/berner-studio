"use client";

import { useEffect } from "react";
import { useAdminBasicAuth } from "@/app/admin/AdminBasicAuthProvider";
import { useSupabaseUser } from "@/app/hooks/useSupabaseUser";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useSupabaseUser();
  const { authorized, verifying, openModal, signOut } = useAdminBasicAuth();

  useEffect(() => {
    if (!authorized && !verifying) {
      openModal();
    }
  }, [authorized, openModal, verifying]);

  const allow = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (loading || verifying) return <div className="text-sm opacity-70">Checking access…</div>;
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
  if (!authorized) {
    return (
      <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 space-y-2">
        <div className="text-sm font-medium">Admin password required</div>
        <div className="text-sm opacity-70">Enter the shared admin credentials to continue.</div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openModal}
            className="h-8 rounded-md border border-black/10 dark:border-white/10 px-3 text-xs"
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={signOut}
            className="h-8 rounded-md border border-black/10 dark:border-white/10 px-3 text-xs"
          >
            Clear saved login
          </button>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

