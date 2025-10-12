"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type HomeHeroData = {
  title: string | null;
  subtitle: string | null;
  image_url: string | null;
  primary_label: string | null;
  primary_href: string | null;
  secondary_label: string | null;
  secondary_href: string | null;
};

export default function HomeHero({ data }: { data: HomeHeroData | null }) {
  const title = data?.title || "Craft Your Perfect Board";
  const subtitle =
    data?.subtitle ||
    "Premium, hand-crafted cutting boards. Customize the look, size, and wood combination to fit your kitchen.";
  const imageUrl = data?.image_url || "/og.svg";
  const primaryLabel = data?.primary_label || "Create your own board";
  const primaryHref = data?.primary_href || "/templates";
  const secondaryLabel = data?.secondary_label || "Contact";
  const secondaryHref = data?.secondary_href || "/contact";

  const [imgLoaded, setImgLoaded] = useState(false);
  const [src, setSrc] = useState(imageUrl);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [motionAllowed, setMotionAllowed] = useState(false);

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
      const maybeDecode = (el as HTMLImageElement & {
        decode?: () => Promise<void>;
      }).decode;
      if (typeof maybeDecode === "function") {
        maybeDecode.call(el).catch(() => {}).finally(() => setImgLoaded(true));
      } else {
        setImgLoaded(true);
      }
    }
  }, [src]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");

    const updateMotionPreference = () => {
      setMotionAllowed(!media.matches);
    };

    updateMotionPreference();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", updateMotionPreference);
      return () => media.removeEventListener("change", updateMotionPreference);
    }

    if (typeof media.addListener === "function") {
      media.addListener(updateMotionPreference);
      return () => media.removeListener(updateMotionPreference);
    }

    return undefined;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!motionAllowed) {
      setShouldAnimate(false);
      return;
    }

    const raf = window.requestAnimationFrame(() => setShouldAnimate(true));

    return () => {
      window.cancelAnimationFrame(raf);
    };
  }, [motionAllowed]);

  return (
    <section className="w-full px-6 py-16 md:py-24">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h1
            className={`text-3xl md:text-5xl font-semibold tracking-tight text-foreground ${shouldAnimate ? "hero-fade" : ""}`}
          >
            {title}
          </h1>
          <p
            className={`text-base md:text-lg mt-3 md:mt-4 text-foreground ${shouldAnimate ? "hero-fade hero-fade-delay-100" : ""}`}
          >
            {subtitle}
          </p>
          <div className={`flex flex-wrap gap-3 mt-6 ${shouldAnimate ? "hero-fade hero-fade-delay-200" : ""}`}>
            <Link
              href={primaryHref}
              className="inline-flex h-11 px-5 items-center justify-center rounded-md bg-emerald-600 text-white text-base font-medium transition-colors hover:bg-emerald-700"
            >
              {primaryLabel}
            </Link>
            <Link
              href={secondaryHref}
              className="inline-flex h-11 px-5 items-center justify-center rounded-md border border-black/10 text-base font-medium transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
            >
              {secondaryLabel}
            </Link>
          </div>
        </div>
        <div className="w-full">
          <div
            className={`relative aspect-[4/3] w-full overflow-hidden rounded-md ${shouldAnimate ? "hero-fade hero-fade-delay-300" : ""}`}
          >
            {/* Animated skeleton while image loads */}
            {!imgLoaded && <div className="skeleton-layer" />}
            {/* eslint-disable-next-line @next/next/no-img-element */}
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
