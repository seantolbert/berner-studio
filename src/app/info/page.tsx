"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function InfoPage() {
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState<string>("");
  const [body, setBody] = useState<string>("");
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("about_page")
          .select("title, body_md")
          .maybeSingle();
        if (!aborted && data) {
          setTitle(data.title || "Info");
          setBody(data.body_md || "");
        }
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => {
      aborted = true;
    };
  }, []);

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
      if (!res.ok) {
        throw new Error(data?.error || "Unable to send message right now.");
      }
      setSent(true);
      setFormData({ name: "", email: "", message: "" });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unable to send message right now.";
      setError(message);
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen w-full p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold">{loading ? "Loading…" : title || "Info"}</h1>
          {!loading && (
            <pre className="opacity-80 text-sm whitespace-pre-wrap">
              {body || "More info coming soon."}
            </pre>
          )}
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Care For Your 2" End-Grain Board</h2>
          <p className="text-sm opacity-80">
            A 2-inch-thick end-grain board is built to take years of service, but it still thrives on a steady
            routine. Follow these steps to keep it sanitary, stable, and looking showroom-fresh.
          </p>

          <div className="space-y-3">
            <div className="space-y-2">
              <h3 className="text-base font-medium">After Each Use</h3>
              <ul className="list-disc pl-5 space-y-2 text-sm opacity-80">
                <li>Scrape away food residue with a bench scraper or plastic spatula—skip metal tools that could score the surface.</li>
                <li>Wash by hand with warm water and a drop of mild dish soap, wiping in the direction of the wood grain.</li>
                <li>Rinse quickly and dry immediately with a clean towel; never soak or run through the dishwasher.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-medium">Deep Cleaning (Weekly or After Raw Protein)</h3>
              <ul className="list-disc pl-5 space-y-2 text-sm opacity-80">
                <li>Sanitize with a solution of one part white vinegar to four parts water, or sprinkle coarse salt and scrub with half a lemon.</li>
                <li>Wipe with a damp cloth to remove any residue, then dry thoroughly on all sides.</li>
                <li>Flip the board between uses so both faces wear evenly and stay flat.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-medium">Monthly Conditioning</h3>
              <ul className="list-disc pl-5 space-y-2 text-sm opacity-80">
                <li>Warm a food-safe mineral oil (or board cream) slightly so it flows easily, then flood the top, sides, and feet.</li>
                <li>Let the oil absorb for at least 20 minutes—overnight is better—before wiping away excess with a lint-free cloth.</li>
                <li>Follow with a beeswax-based board conditioner to seal in moisture if you prefer a satin finish.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-medium">Long-Term Storage & Upkeep</h3>
              <ul className="list-disc pl-5 space-y-2 text-sm opacity-80">
                <li>Store the board upright on its edge or on a rack that allows air to circulate on all sides.</li>
                <li>Keep it away from direct heat vents, strong sunlight, and standing water to prevent warping or cracking.</li>
                <li>If the surface ever raises slightly, sand lightly with 220-grit paper, wipe clean, and re-oil.</li>
              </ul>
            </div>
          </div>

          <p className="text-sm opacity-80">
            With a rinse, dry, and monthly oiling, your board will stay level, resist stains, and become the
            centerpiece of every prep session for decades.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Contact the Studio</h2>
          <p className="text-sm opacity-80">
            Have a custom project in mind or need help with care? Send a note and the admin team will reply from
            the shared inbox as soon as possible.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            {error ? <div className="text-sm text-red-600 dark:text-red-400">{error}</div> : null}
            {sent ? <div className="text-sm text-emerald-600 dark:text-emerald-400">Thanks—your message is on its way.</div> : null}
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
