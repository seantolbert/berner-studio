"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Button from "@/app/components/ui/Button";

type HomeHero = {
  title: string | null;
  subtitle: string | null;
  image_url: string | null;
  primary_label: string | null;
  primary_href: string | null; // kept for future use
  secondary_label: string | null;
  secondary_href: string | null; // kept for future use
};

export default function HomePage() {
  const [hero, setHero] = useState<HomeHero | null>(null);

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("home_hero")
          .select(
            "title,subtitle,image_url,primary_label,primary_href,secondary_label,secondary_href"
          )
          .maybeSingle();
        if (!aborted && !error) setHero((data as HomeHero) || null);
      } catch {}
    })();
    return () => {
      aborted = true;
    };
  }, []);

  const title = hero?.title || "Craft Your Perfect Board";
  const subtitle =
    hero?.subtitle ||
    "Premium, hand-crafted cutting boards. Customize the look, size, and wood combination to fit your kitchen.";
  const imageUrl = hero?.image_url || "/og.svg"; // placeholder in /public
  const primaryLabel = hero?.primary_label || "Start Building";
  const secondaryLabel = hero?.secondary_label || "Browse Boards";

  return (
    <main className="min-h-screen w-full">
      <section className="w-full px-6 py-16 md:py-24">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="text-base md:text-lg mt-3 md:mt-4 text-foreground">
              {subtitle}
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <Button variant="link" size="lg" onClick={() => {}} aria-disabled>
                {primaryLabel}
              </Button>
              <Button variant="link" size="lg" onClick={() => {}} aria-disabled>
                {secondaryLabel}
              </Button>
            </div>
          </div>
          <div className="w-full">
            <div className="aspect-[4/3] w-full overflow-hidden rounded-md">
              <img
                src={imageUrl}
                alt="Featured board"
                className="h-full w-full object-cover"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </section>
      {/* Footer handled by global layout */}
    </main>
  );
}
