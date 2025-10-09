"use client";

import { FormEvent, useState } from "react";

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending) return;
    setError(null);
    setSent(false);
    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Unable to send message right now.");
      setSent(true);
      setFormData({ name: "", email: "", message: "" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unable to send message right now.";
      setError(message);
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen w-full p-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="space-y-3">
          <h1 className="text-2xl font-semibold">Contact</h1>
          <p className="text-sm opacity-80">
            Have a custom idea, wholesale question, or need care tips for your board? Send a note below and the
            studio will respond within one to two business days.
          </p>
        </header>

        <section className="space-y-3">
          <form onSubmit={handleSubmit} className="space-y-3">
            {error ? <div className="text-sm text-red-600 dark:text-red-400">{error}</div> : null}
            {sent ? (
              <div className="text-sm text-emerald-600 dark:text-emerald-400">
                Thanks! Your message is on its way.
              </div>
            ) : null}
            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                <span>Name</span>
                <input
                  type="text"
                  autoComplete="name"
                  maxLength={120}
                  value={formData.name}
                  onChange={(event) => {
                    const value = event.target.value;
                    setFormData((prev) => ({ ...prev, name: value }));
                    setSent(false);
                    setError(null);
                  }}
                  className="h-10 rounded-md border border-black/15 dark:border-white/15 bg-transparent px-3"
                  placeholder="Jane Smith"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span>Email *</span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  maxLength={254}
                  value={formData.email}
                  onChange={(event) => {
                    const value = event.target.value;
                    setFormData((prev) => ({ ...prev, email: value }));
                    setSent(false);
                    setError(null);
                  }}
                  className="h-10 rounded-md border border-black/15 dark:border-white/15 bg-transparent px-3"
                  placeholder="you@example.com"
                />
              </label>
            </div>
            <label className="flex flex-col gap-1 text-sm">
              <span>Message *</span>
              <textarea
                required
                rows={6}
                minLength={10}
                maxLength={2000}
                value={formData.message}
                onChange={(event) => {
                  const value = event.target.value;
                  setFormData((prev) => ({ ...prev, message: value }));
                  setSent(false);
                  setError(null);
                }}
                className="rounded-md border border-black/15 dark:border-white/15 bg-transparent px-3 py-2"
                placeholder="Tell us about your project or question…"
              />
            </label>
            <div className="flex items-center justify-between gap-3 text-xs opacity-70">
              <span>We respond within 1–2 business days.</span>
              <button
                type="submit"
                disabled={sending}
                className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {sending ? "Sending…" : "Send message"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
