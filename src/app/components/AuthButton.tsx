"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase/client";
import { useSupabaseUser } from "@/app/hooks/useSupabaseUser";

export default function AuthButton() {
  const { user, loading } = useSupabaseUser();
  const [authOpen, setAuthOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const signIn = useCallback(async (provider: "github" | "google") => {
    const redirectTo = typeof window !== "undefined" ? window.location.origin : undefined;
    const creds: Parameters<typeof supabase.auth.signInWithOAuth>[0] = { provider } as any;
    if (redirectTo) {
      (creds as any).options = { redirectTo };
    }
    await supabase.auth.signInWithOAuth(creds);
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const sendMagicLink = useCallback(async () => {
    setErr(null);
    setSending(true);
    setSent(false);
    try {
      const redirectTo = typeof window !== "undefined" ? window.location.origin : undefined;
      const otpArgs: Parameters<typeof supabase.auth.signInWithOtp>[0] = { email } as any;
      if (redirectTo) {
        (otpArgs as any).options = { emailRedirectTo: redirectTo };
      }
      const { error } = await supabase.auth.signInWithOtp(otpArgs);
      if (error) throw error;
      setSent(true);
    } catch (e: any) {
      setErr(e?.message || "Failed to send link");
    } finally {
      setSending(false);
    }
  }, [email]);

  // Close modal on Escape
  useEffect(() => {
    if (!authOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAuthOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [authOpen]);

  if (loading) {
    return (
      <button
        type="button"
        className="inline-flex items-center rounded-md px-3 py-1.5 text-sm opacity-70"
        aria-busy
      >
        Loading…
      </button>
    );
  }

  if (!user) {
    return (
      <>
        <button
          type="button"
          onClick={() => setAuthOpen(true)}
          className="inline-flex items-center gap-2 rounded-md border border-black/10 dark:border-white/10 px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10"
        >
          Sign up
        </button>
        {authOpen && createPortal(
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <button
              type="button"
              aria-label="Close auth"
              onClick={() => setAuthOpen(false)}
              className="absolute inset-0 bg-black/40"
            />
            <div className="relative w-full max-w-sm rounded-lg bg-background text-foreground shadow-xl border border-black/10 dark:border-white/10">
              <div className="flex items-center justify-between px-4 py-3 border-b border-black/10 dark:border-white/10">
                <h2 className="text-base font-semibold">Sign in</h2>
                <button
                  type="button"
                  onClick={() => setAuthOpen(false)}
                  className="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-black/5 dark:hover:bg-white/10"
                  aria-label="Close"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div className="p-4 space-y-3">
                <button
                  type="button"
                  onClick={() => signIn("google")}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-black/10 dark:border-white/10 px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                    <path fill="#EA4335" d="M12 10.2v3.6h5.1c-.2 1.2-1.5 3.6-5.1 3.6-3.1 0-5.7-2.5-5.7-5.7S8.9 6 12 6c1.8 0 3 .8 3.7 1.5l2.5-2.4C16.8 3.6 14.6 2.7 12 2.7 6.9 2.7 2.7 6.9 2.7 12S6.9 21.3 12 21.3c6.9 0 9.3-4.8 9.3-7.2 0-.5 0-.8-.1-1.2H12z"/>
                  </svg>
                  Continue with Google
                </button>
                <div className="h-px bg-black/10 dark:bg-white/10" />
                {err && <div className="text-xs text-red-600 dark:text-red-400">{err}</div>}
                {sent ? (
                  <div className="text-xs opacity-80">Link sent to {email}. Check your inbox.</div>
                ) : (
                  <>
                    <label className="text-xs opacity-80">Or, receive a magic link</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full h-9 px-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setAuthOpen(false)}
                        className="h-8 px-2 rounded-md border border-black/10 dark:border-white/10 text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={sending || !email}
                        onClick={sendMagicLink}
                        className="h-8 px-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs disabled:opacity-50"
                      >
                        {sending ? "Sending…" : "Send link"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>, document.body)}
      </>
    );
  }

  return (
    <div className="inline-flex items-center gap-2">
      <span className="text-sm opacity-80 max-w-[12rem] truncate">{user.email ?? user.user_metadata?.user_name ?? "Signed in"}</span>
      <button
        type="button"
        onClick={signOut}
        className="inline-flex items-center rounded-md border border-black/10 dark:border-white/10 px-2.5 py-1 text-xs hover:bg-black/5 dark:hover:bg-white/10"
      >
        Sign out
      </button>
    </div>
  );
}
