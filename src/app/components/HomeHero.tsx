"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";

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
  const interactiveRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | undefined>(undefined);
  const latestPointRef = useRef<{ x: number; y: number; rect: DOMRect | null }>({ x: 0, y: 0, rect: null });
  const [pointerActive, setPointerActive] = useState(false);
  const [supportsInteractive, setSupportsInteractive] = useState(false);

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

  // Detect when the viewport supports fine-grained pointer interactions
  useEffect(() => {
    if (typeof window === "undefined") return;

    const finePointer = window.matchMedia("(pointer: fine)");
    const hoverCapable = window.matchMedia("(hover: hover)");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const updateSupport = () => {
      const notMobileWidth = window.innerWidth >= 768;
      const avoidsTouchOnly = typeof navigator !== "undefined" ? navigator.maxTouchPoints === 0 : true;
      const motionAllowed = !prefersReducedMotion.matches;
      setSupportsInteractive(finePointer.matches && hoverCapable.matches && motionAllowed && notMobileWidth && avoidsTouchOnly);
    };

    updateSupport();

    const listeners: Array<() => void> = [];

    const attach = (query: MediaQueryList) => {
      const handler = () => updateSupport();
      if (typeof query.addEventListener === "function") {
        query.addEventListener("change", handler);
        listeners.push(() => query.removeEventListener("change", handler));
      } else if (typeof query.addListener === "function") {
        query.addListener(handler);
        listeners.push(() => query.removeListener(handler));
      }
    };

    attach(finePointer);
    attach(hoverCapable);
    attach(prefersReducedMotion);

    const handleResize = () => updateSupport();
    window.addEventListener("resize", handleResize);
    listeners.push(() => window.removeEventListener("resize", handleResize));

    return () => {
      listeners.forEach((cleanup) => cleanup());
    };
  }, []);

  const applyInteractiveStyles = useCallback(() => {
    const container = interactiveRef.current;
    const point = latestPointRef.current;
    if (!container || !point.rect) return;

    const { x, y, rect } = point;
    container.style.setProperty("--cursor-x", `${x}px`);
    container.style.setProperty("--cursor-y", `${y}px`);

    const progressX = rect.width ? x / rect.width - 0.5 : 0;
    const progressY = rect.height ? y / rect.height - 0.5 : 0;
    container.style.setProperty("--cursor-progress-x", progressX.toFixed(4));
    container.style.setProperty("--cursor-progress-y", progressY.toFixed(4));

    const rotateX = progressY * -6;
    const rotateY = progressX * 6;
    const rotateXSoft = rotateX * 0.6;
    const rotateYSoft = rotateY * 0.6;
    const rotateXStrong = rotateX * 1.25;
    const rotateYStrong = rotateY * 1.25;

    const translateX = progressX * 18;
    const translateY = progressY * 12;
    const translateXSoft = progressX * 9;
    const translateYSoft = progressY * 6;
    const translateXStrong = progressX * 24;
    const translateYStrong = progressY * 16;

    container.style.setProperty("--tilt-rotate-x", `${rotateX.toFixed(2)}deg`);
    container.style.setProperty("--tilt-rotate-y", `${rotateY.toFixed(2)}deg`);
    container.style.setProperty("--tilt-rotate-x-soft", `${rotateXSoft.toFixed(2)}deg`);
    container.style.setProperty("--tilt-rotate-y-soft", `${rotateYSoft.toFixed(2)}deg`);
    container.style.setProperty("--tilt-rotate-x-strong", `${rotateXStrong.toFixed(2)}deg`);
    container.style.setProperty("--tilt-rotate-y-strong", `${rotateYStrong.toFixed(2)}deg`);

    container.style.setProperty("--tilt-translate-x", `${translateX.toFixed(2)}px`);
    container.style.setProperty("--tilt-translate-y", `${translateY.toFixed(2)}px`);
    container.style.setProperty("--tilt-translate-x-soft", `${translateXSoft.toFixed(2)}px`);
    container.style.setProperty("--tilt-translate-y-soft", `${translateYSoft.toFixed(2)}px`);
    container.style.setProperty("--tilt-translate-x-strong", `${translateXStrong.toFixed(2)}px`);
    container.style.setProperty("--tilt-translate-y-strong", `${translateYStrong.toFixed(2)}px`);
  }, []);

  const commitPoint = useCallback(
    (x: number, y: number, rect: DOMRect) => {
      latestPointRef.current = { x, y, rect };
      if (frameRef.current) return;
      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = undefined;
        applyInteractiveStyles();
      });
    },
    [applyInteractiveStyles]
  );

  const resetInteractiveCursor = useCallback(() => {
    if (!supportsInteractive || !interactiveRef.current) return;
    const rect = interactiveRef.current.getBoundingClientRect();
    commitPoint(rect.width / 2, rect.height / 2, rect);
  }, [commitPoint, supportsInteractive]);

  useEffect(() => {
    if (!supportsInteractive) {
      setPointerActive(false);
      return;
    }
    resetInteractiveCursor();
  }, [resetInteractiveCursor, supportsInteractive]);

  useEffect(() => {
    return () => {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!supportsInteractive || !interactiveRef.current) return;
      const rect = interactiveRef.current.getBoundingClientRect();
      commitPoint(event.clientX - rect.left, event.clientY - rect.top, rect);
    },
    [commitPoint, supportsInteractive]
  );

  const handlePointerEnter = useCallback(() => {
    if (!supportsInteractive) return;
    setPointerActive(true);
  }, [supportsInteractive]);

  const handlePointerLeave = useCallback(() => {
    if (!supportsInteractive) return;
    setPointerActive(false);
    resetInteractiveCursor();
  }, [resetInteractiveCursor, supportsInteractive]);

  const interactiveStyle = supportsInteractive
    ? ({
        ["--cursor-x" as string]: "50%",
        ["--cursor-y" as string]: "50%",
        ["--cursor-progress-x" as string]: "0",
        ["--cursor-progress-y" as string]: "0",
        ["--tilt-rotate-x" as string]: "0deg",
        ["--tilt-rotate-y" as string]: "0deg",
        ["--tilt-rotate-x-soft" as string]: "0deg",
        ["--tilt-rotate-y-soft" as string]: "0deg",
        ["--tilt-rotate-x-strong" as string]: "0deg",
        ["--tilt-rotate-y-strong" as string]: "0deg",
        ["--tilt-translate-x" as string]: "0px",
        ["--tilt-translate-y" as string]: "0px",
        ["--tilt-translate-x-soft" as string]: "0px",
        ["--tilt-translate-y-soft" as string]: "0px",
        ["--tilt-translate-x-strong" as string]: "0px",
        ["--tilt-translate-y-strong" as string]: "0px",
      } satisfies CSSProperties)
    : undefined;

  return (
    <section className="w-full px-6 py-16 md:py-24">
      <div
        ref={interactiveRef}
        className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center"
        style={interactiveStyle}
        onPointerMove={handlePointerMove}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        <div
          className="transition-transform duration-300 ease-out will-change-transform"
          style={
            supportsInteractive
              ? {
                  transform:
                    "perspective(1400px) rotateX(var(--tilt-rotate-x-soft)) rotateY(var(--tilt-rotate-y-soft)) translate3d(var(--tilt-translate-x-soft), var(--tilt-translate-y-soft), 0)",
                }
              : undefined
          }
        >
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="text-base md:text-lg mt-3 md:mt-4 text-foreground">{subtitle}</p>
          <div
            className="flex flex-wrap gap-3 mt-6 transition-transform duration-300 ease-out will-change-transform"
            style={
              supportsInteractive
                ? {
                    transform:
                      "translate3d(var(--tilt-translate-x-soft), calc(var(--tilt-translate-y-soft) * 1.25), 0)",
                  }
                : undefined
            }
          >
            <Link
              href={primaryHref}
              className="inline-flex h-11 px-5 items-center justify-center rounded-md bg-emerald-600 text-white text-base font-medium transition-colors hover:bg-emerald-700 transition-transform duration-200"
              style={
                supportsInteractive
                  ? {
                      transform:
                        "translate3d(calc(var(--tilt-translate-x-soft) * 0.2), calc(var(--tilt-translate-y-soft) * 0.25), 0)",
                    }
                  : undefined
              }
            >
              {primaryLabel}
            </Link>
            <Link
              href={secondaryHref}
              className="inline-flex h-11 px-5 items-center justify-center rounded-md border border-black/10 text-base font-medium transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10 transition-transform duration-200"
              style={
                supportsInteractive
                  ? {
                      transform:
                        "translate3d(calc(var(--tilt-translate-x-soft) * 0.25), calc(var(--tilt-translate-y-soft) * 0.3), 0)",
                    }
                  : undefined
              }
            >
              {secondaryLabel}
            </Link>
          </div>
        </div>
        <div className="w-full">
          <div
            className="relative aspect-[4/3] w-full overflow-hidden rounded-md transition-transform duration-300 ease-out will-change-transform"
            style={
              supportsInteractive
                ? {
                    transform:
                      "perspective(1600px) rotateX(var(--tilt-rotate-x)) rotateY(var(--tilt-rotate-y)) translate3d(var(--tilt-translate-x), var(--tilt-translate-y), 0)",
                  }
                : undefined
            }
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
            {supportsInteractive && pointerActive && (
              // Subtle vignette that follows pointer; glow removed per request
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(420px circle at var(--cursor-x) var(--cursor-y), rgba(15, 23, 42, 0.08), transparent 70%)",
                }}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
