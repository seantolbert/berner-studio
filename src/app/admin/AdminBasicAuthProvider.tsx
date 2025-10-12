"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

type AdminBasicAuthContextValue = {
  authorized: boolean;
  verifying: boolean;
  openModal: () => void;
  closeModal: () => void;
  signOut: () => void;
};

const AdminBasicAuthContext = createContext<AdminBasicAuthContextValue | null>(null);

const STORAGE_KEY = "bs.admin.basicAuth";

function encodeCredentials(username: string, password: string) {
  const value = `${username}:${password}`;
  if (typeof window === "undefined") {
    return Buffer.from(value, "utf8").toString("base64");
  }
  return window.btoa(unescape(encodeURIComponent(value)));
}

function isAdminApi(url: string) {
  if (typeof window === "undefined") return false;
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.origin === window.location.origin && parsed.pathname.startsWith("/api/admin");
  } catch {
    return false;
  }
}

export function useAdminBasicAuth() {
  const ctx = useContext(AdminBasicAuthContext);
  if (!ctx) throw new Error("useAdminBasicAuth must be used within AdminBasicAuthProvider");
  return ctx;
}

export default function AdminBasicAuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const originalFetchRef = useRef<typeof window.fetch | null>(null);

  const restoreFetch = useCallback(() => {
    if (typeof window === "undefined") return;
    if (originalFetchRef.current) {
      window.fetch = originalFetchRef.current;
    }
  }, []);

  const verifyToken = useCallback(async (encoded: string) => {
    const runFetch = originalFetchRef.current ?? (typeof window !== "undefined" ? window.fetch.bind(window) : undefined);
    if (!runFetch) return false;
    try {
      const res = await runFetch("/api/admin/auth-check", {
        headers: { Authorization: `Basic ${encoded}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  // Patch global fetch so admin API calls include the Authorization header automatically.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!originalFetchRef.current) {
      originalFetchRef.current = window.fetch.bind(window);
    }
    if (!token) {
      restoreFetch();
      return;
    }

    const baseFetch = originalFetchRef.current;
    if (!baseFetch) {
      return () => {
        restoreFetch();
      };
    }
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const requestInit: RequestInit = { ...init };
      const url = typeof input === "string" || input instanceof URL ? input.toString() : input instanceof Request ? input.url : String(input);

      if (isAdminApi(url)) {
        const headers = new Headers(requestInit.headers || (input instanceof Request ? input.headers : undefined));
        if (!headers.has("Authorization")) {
          headers.set("Authorization", `Basic ${token}`);
        }
        requestInit.headers = headers;
      }

      if (input instanceof Request) {
        return baseFetch(new Request(input, requestInit));
      }
      const requestInput: RequestInfo | URL = input;
      return baseFetch(requestInput, requestInit);
    };

    return () => {
      restoreFetch();
    };
  }, [restoreFetch, token]);

  // Load stored credentials on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    let active = true;
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setVerifying(false);
      setModalOpen(true);
      return;
    }
    (async () => {
      const ok = await verifyToken(stored);
      if (!active) return;
      if (ok) {
        setToken(stored);
        setVerifying(false);
      } else {
        window.sessionStorage.removeItem(STORAGE_KEY);
        setVerifying(false);
        setModalOpen(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [verifyToken]);

  // Persist credentials when they change.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (token) {
      window.sessionStorage.setItem(STORAGE_KEY, token);
    } else {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [token]);

  // Close modal automatically once authorized.
  useEffect(() => {
    if (token) {
      setModalOpen(false);
      setError(null);
      setUsername("");
      setPassword("");
    }
  }, [token]);

  const submit = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    try {
      const encoded = encodeCredentials(username, password);
      const ok = await verifyToken(encoded);
      if (!ok) {
        setError("Invalid admin credentials");
        return;
      }
      setToken(encoded);
    } catch (e) {
      console.error(e);
      setError("Unable to verify credentials. Try again.");
    } finally {
      setSubmitting(false);
    }
  }, [password, username, verifyToken]);

  const openModal = useCallback(() => {
    setModalOpen(true);
    setError(null);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const signOut = useCallback(() => {
    setToken(null);
    setUsername("");
    setPassword("");
    setModalOpen(true);
  }, []);

  // Allow closing modal with Escape.
  useEffect(() => {
    if (!modalOpen) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setModalOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [modalOpen]);

  const value = useMemo<AdminBasicAuthContextValue>(() => ({
    authorized: Boolean(token),
    verifying,
    openModal,
    closeModal,
    signOut,
  }), [closeModal, openModal, signOut, token, verifying]);

  return (
    <AdminBasicAuthContext.Provider value={value}>
      {children}
      {modalOpen && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
              <button
                type="button"
                aria-label="Close admin auth"
                onClick={closeModal}
                className="absolute inset-0 bg-black/50"
              />
              <div className="relative w-full max-w-sm rounded-lg border border-black/10 dark:border-white/10 bg-background text-foreground shadow-xl">
                <div className="flex items-center justify-between px-4 py-3 border-b border-black/10 dark:border-white/10">
                  <h2 className="text-base font-semibold">Admin sign in</h2>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-black/5 dark:hover:bg-white/10"
                    aria-label="Close"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                      aria-hidden="true"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <div className="p-4 space-y-3 text-sm">
                  <p className="opacity-80">Enter the admin username and password to continue.</p>
                  {error && <div className="rounded-md bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 px-3 py-2 text-xs">{error}</div>}
                  <label className="block space-y-1">
                    <span className="text-xs font-medium opacity-80">Username</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      className="w-full h-9 px-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent"
                      autoFocus
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs font-medium opacity-80">Password</span>
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="w-full h-9 px-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent"
                    />
                  </label>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="h-8 px-2 rounded-md border border-black/10 dark:border-white/10 text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={submitting || !username || !password}
                      onClick={submit}
                      className="h-8 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs disabled:opacity-60"
                    >
                      {submitting ? "Verifying…" : "Continue"}
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </AdminBasicAuthContext.Provider>
  );
}
