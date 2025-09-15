"use client";

import { useEffect, useRef, useState } from "react";
import Button from "@/app/components/ui/Button";

export type HomeHeroData = {
  title: string | null;
  subtitle: string | null;
  image_url: string | null;
  primary_label: string | null;
  secondary_label: string | null;
};

export default function HomeHero({ data }: { data: HomeHeroData | null }) {
  const title = data?.title || "Craft Your Perfect Board";
  const subtitle =
    data?.subtitle ||
    "Premium, hand-crafted cutting boards. Customize the look, size, and wood combination to fit your kitchen.";
  const imageUrl = data?.image_url || "/og.svg";
  const primaryLabel = data?.primary_label || "Start Building";
  const secondaryLabel = data?.secondary_label || "Browse Boards";

  const [imgLoaded, setImgLoaded] = useState(false);
  const [src, setSrc] = useState(imageUrl);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Keep current src in sync with server-provided URL
  useEffect(() => {
    setSrc(imageUrl || "/og.svg");
    if (!imageUrl || imageUrl === "/og.svg") {
      setImgLoaded(true);
      return;
    }
    setImgLoaded(false);
  }, [imageUrl]);

  // Handle cached images on hydration: if already complete, mark loaded
  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;
    if (el.complete) {
      // Some browsers need decode() to settle rendering
      if (typeof (el as any).decode === "function") {
        (el as any).decode().catch(() => {}).finally(() => setImgLoaded(true));
      } else {
        setImgLoaded(true);
      }
    }
  }, [src]);

  return (
    <section className="w-full px-6 py-16 md:py-24">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="text-base md:text-lg mt-3 md:mt-4 text-foreground">{subtitle}</p>
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
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md">
            {/* Animated skeleton while image loads */}
            {!imgLoaded && <div className="skeleton-layer" />}
            <img
              ref={imgRef}
              src={src}
              alt="Featured board"
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
              style={{ opacity: imgLoaded ? 1 : 0 }}
              onLoad={() => setImgLoaded(true)}
              onError={() => { setSrc("/og.svg"); setImgLoaded(true); }}
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
