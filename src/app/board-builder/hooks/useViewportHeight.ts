"use client";

import { useEffect, useState } from "react";

/**
 * Returns the real viewport height in pixels (accounts for iOS browser chrome).
 * Use with a style prop: style={vh ? { height: `${vh}px` } : undefined}
 */
export function useViewportHeight(): number | null {
  const [vh, setVh] = useState<number | null>(null);

  useEffect(() => {
    const setHeight = () => {
      const h = (window as any).visualViewport?.height ?? window.innerHeight;
      setVh(Math.round(h));
    };
    setHeight();
    window.addEventListener("resize", setHeight, { passive: true } as any);
    (window as any).visualViewport?.addEventListener?.("resize", setHeight, {
      passive: true,
    } as any);
    window.addEventListener("orientationchange", setHeight as any);
    return () => {
      window.removeEventListener("resize", setHeight as any);
      (window as any).visualViewport?.removeEventListener?.(
        "resize",
        setHeight as any
      );
      window.removeEventListener("orientationchange", setHeight as any);
    };
  }, []);

  return vh;
}
