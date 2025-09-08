"use client";

import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useSupabaseUser } from "@/app/hooks/useSupabaseUser";

export default function AuthButton() {
  const { user, loading } = useSupabaseUser();
  const [emailOpen, setEmailOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const signIn = useCallback(async () => {
    const redirectTo = typeof window !== "undefined" ? window.location.origin : undefined;
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: redirectTo ? { redirectTo } : undefined,
    });
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
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
      });
      if (error) throw error;
      setSent(true);
    } catch (e: any) {
      setErr(e?.message || "Failed to send link");
    } finally {
      setSending(false);
    }
  }, [email]);

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
      <div className="inline-flex items-center gap-2">
        <button
          type="button"
          onClick={signIn}
          className="inline-flex items-center gap-2 rounded-md border border-black/10 dark:border-white/10 px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10"
          aria-label="Sign in with GitHub"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
            <path d="M12 .5a12 12 0 00-3.79 23.4c.6.11.82-.26.82-.58v-2.02c-3.34.73-4.04-1.61-4.04-1.61-.55-1.38-1.35-1.75-1.35-1.75-1.1-.75.08-.74.08-.74 1.22.09 1.86 1.26 1.86 1.26 1.08 1.85 2.82 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.25-3.22-.13-.31-.54-1.56.12-3.25 0 0 1-.32 3.3 1.23a11.5 11.5 0 016 0c2.3-1.55 3.3-1.23 3.3-1.23.66 1.69.25 2.94.12 3.25.78.84 1.25 1.9 1.25 3.22 0 4.61-2.81 5.62-5.49 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0012 .5z" />
          </svg>
          GitHub
        </button>
        <div className="relative">
          {!emailOpen ? (
            <button
              type="button"
              onClick={() => setEmailOpen(true)}
              className="inline-flex items-center gap-2 rounded-md border border-black/10 dark:border-white/10 px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10"
            >
              Email
            </button>
          ) : (
            <div className="absolute right-0 z-40 mt-2 w-72 rounded-md border border-black/10 dark:border-white/10 bg-background p-3 shadow">
              <div className="text-sm font-medium mb-1">Sign in via email</div>
              <div className="text-xs opacity-70 mb-2">We’ll send you a magic link.</div>
              {err && <div className="text-xs text-red-600 dark:text-red-400 mb-2">{err}</div>}
              {sent ? (
                <div className="text-xs opacity-80">Link sent to {email}. Check your inbox.</div>
              ) : (
                <>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-8 px-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm mb-2"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEmailOpen(false)}
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
          )}
        </div>
      </div>
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
