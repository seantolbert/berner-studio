"use client";

import { usePathname, useRouter } from "next/navigation";

export default function HeaderBackButton() {
  const pathname = usePathname();
  const router = useRouter();

  const showBack = pathname?.startsWith("/board-builder");
  if (!showBack) return null;

  return (
    <button
      type="button"
      onClick={() => router.push("/")}
      className="inline-flex items-center gap-2 h-8 px-2 rounded-md border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10"
      aria-label="Back"
      title="Back"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
      <span className="text-sm">Back</span>
    </button>
  );
}

