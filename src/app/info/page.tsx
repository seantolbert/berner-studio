"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function InfoPage() {
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
          <h2 className="text-xl font-semibold">Care For Your 2-inch End-Grain Board</h2>
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
      </div>
    </main>
  );
}
