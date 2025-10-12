"use client";

import { useEffect } from "react";

const PARALLAX_RATIO = 0.2;

/**
 * ParallaxBackground updates the global CSS variable that controls the fixed background
 * image offset. Leveraging requestAnimationFrame keeps the scroll handler performant.
 */
export default function ParallaxBackground() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let rafId: number | null = null;
    let enabled = !media.matches;

    const updateOffset = () => {
      rafId = window.requestAnimationFrame(() => {
        const offset = enabled ? window.scrollY * PARALLAX_RATIO : 0;
        root.style.setProperty("--parallax-offset", `${offset}px`);
        rafId = null;
      });
    };

    const handleScroll = () => {
      if (rafId !== null) return;
      updateOffset();
    };

    const handleMotionPreference = () => {
      enabled = !media.matches;
      if (!enabled) {
        root.style.setProperty("--parallax-offset", "0px");
      } else {
        updateOffset();
      }
    };

    updateOffset();
    window.addEventListener("scroll", handleScroll, { passive: true });

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", handleMotionPreference);
    } else if (typeof media.addListener === "function") {
      media.addListener(handleMotionPreference);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (typeof media.removeEventListener === "function") {
        media.removeEventListener("change", handleMotionPreference);
      } else if (typeof media.removeListener === "function") {
        media.removeListener(handleMotionPreference);
      }
    };
  }, []);

  return null;
}
