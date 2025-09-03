export default function ControlPanel() {
  return (
    <section className="rounded-md bg-black/[.02] dark:bg-white/[.04] h-full w-full flex items-center justify-center overflow-y-auto">
      <div className="flex flex-col items-center gap-4 py-2">
        {/* Randomize */}
        <button
          type="button"
          aria-label="Randomize"
          title="Randomize"
          className="h-12 w-12 rounded-full border border-black/15 dark:border-white/15 bg-white/60 dark:bg-black/20 flex items-center justify-center shadow-sm hover:bg-black/5 dark:hover:bg-white/10 active:scale-[.98]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
            aria-hidden="true"
          >
            <path d="M16 3h5v5" />
            <path d="M4 20l9-9" />
            <path d="M21 8c-4 0-6 2-9 5s-5 4-9 4" />
            <path d="M3 3h5v5" />
            <path d="M8 3C4 3 3 5 3 8" />
          </svg>
        </button>

        {/* Undo */}
        <button
          type="button"
          aria-label="Undo"
          title="Undo"
          className="h-12 w-12 rounded-full border border-black/15 dark:border-white/15 bg-white/60 dark:bg-black/20 flex items-center justify-center shadow-sm hover:bg-black/5 dark:hover:bg-white/10 active:scale-[.98]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
            aria-hidden="true"
          >
            <path d="M9 14l-5-5 5-5" />
            <path d="M4 9h8a7 7 0 1 1 0 14H9" />
          </svg>
        </button>

        {/* Redo */}
        <button
          type="button"
          aria-label="Redo"
          title="Redo"
          className="h-12 w-12 rounded-full border border-black/15 dark:border-white/15 bg-white/60 dark:bg-black/20 flex items-center justify-center shadow-sm hover:bg-black/5 dark:hover:bg-white/10 active:scale-[.98]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
            aria-hidden="true"
          >
            <path d="M15 14l5-5-5-5" />
            <path d="M20 9h-8a7 7 0 1 0 0 14h3" />
          </svg>
        </button>

        {/* Upload */}
        <button
          type="button"
          aria-label="Upload"
          title="Upload"
          className="h-12 w-12 rounded-full border border-black/15 dark:border-white/15 bg-white/60 dark:bg-black/20 flex items-center justify-center shadow-sm hover:bg-black/5 dark:hover:bg-white/10 active:scale-[.98]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
            aria-hidden="true"
          >
            <path d="M12 16V4" />
            <path d="M8 8l4-4 4 4" />
            <path d="M20 16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2" />
          </svg>
        </button>
      </div>
    </section>
  );
}

