"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem("theme") as Theme | null;
  if (stored === "light" || stored === "dark") return stored;
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  // Apply theme to <html data-theme="...">
  useEffect(() => {
    const el = document.documentElement;
    el.setAttribute("data-theme", theme);
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  const label = theme === "light" ? "Light" : "Dark";
  const next = theme === "light" ? "dark" : "light";

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className={`inline-flex items-center gap-2 h-9 px-3 rounded-md border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 text-sm ${className}`}
      aria-label="Toggle color theme"
      title={`Switch to ${next} mode`}
    >
      <span
        aria-hidden
        className="inline-block w-4 h-4 rounded-full bg-current"
        style={{ opacity: 0.8 }}
      />
      <span>{label} mode</span>
    </button>
  );
}

