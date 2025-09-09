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
      const h = window.visualViewport?.height ?? window.innerHeight;
      setVh(Math.round(h));
    };
    setHeight();
    window.addEventListener("resize", setHeight, { passive: true });
    window.visualViewport?.addEventListener?.("resize", setHeight, {
      passive: true,
    } as AddEventListenerOptions);
    window.addEventListener("orientationchange", setHeight);
    return () => {
      window.removeEventListener("resize", setHeight);
      window.visualViewport?.removeEventListener?.(
        "resize",
        setHeight as EventListener
      );
      window.removeEventListener("orientationchange", setHeight);
    };
  }, []);

  return vh;
}
