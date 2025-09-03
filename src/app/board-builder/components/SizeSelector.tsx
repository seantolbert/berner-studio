export default function SizeSelector() {
  return (
    <section className="rounded-md bg-black/[.03] dark:bg-white/[.06] h-full w-full flex items-center justify-center">
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-2">
        <h5 className="text-sm font-semibold uppercase tracking-wide">size</h5>

        <div className="w-full flex flex-col gap-3">
          {/* Square option */}
          <div className="w-full space-y-1">
            <button
              type="button"
              className="w-full h-24 rounded-md border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/20 backdrop-blur-sm flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-black/30 dark:focus:ring-white/30"
            >
              <div className="w-12 h-12 rounded-sm border-2 border-current" />
            </button>
            <p className="text-center text-xs text-foreground/80">9.5&quot; x 9.5&quot;</p>
          </div>

          {/* Vertical rectangle (smaller) */}
          <div className="w-full space-y-1">
            <button
              type="button"
              className="w-full h-24 rounded-md border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/20 backdrop-blur-sm flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-black/30 dark:focus:ring-white/30"
            >
              <div className="w-10 h-16 rounded-sm border-2 border-current" />
            </button>
            <p className="text-center text-xs text-foreground/80">10&quot; x 14&quot;</p>
          </div>

          {/* Vertical rectangle (larger) */}
          <div className="w-full space-y-1">
            <button
              type="button"
              className="w-full h-24 rounded-md border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/20 backdrop-blur-sm flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-black/30 dark:focus:ring-white/30"
            >
              <div className="w-12 h-20 rounded-sm border-2 border-current" />
            </button>
            <p className="text-center text-xs text-foreground/80">12&quot; x 16&quot;</p>
          </div>
        </div>
      </div>
    </section>
  );
}

