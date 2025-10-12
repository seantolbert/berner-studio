export default function LoadingProductPage() {
  return (
    <main className="min-h-screen w-full px-6 py-16">
      <div className="mx-auto max-w-5xl grid gap-6 md:grid-cols-2 items-start">
        <div className="aspect-square w-full animate-pulse rounded-xl bg-black/5 dark:bg-white/10" />
        <div className="space-y-4">
          <div className="h-8 w-2/3 animate-pulse rounded bg-black/10 dark:bg-white/10" />
          <div className="h-6 w-1/3 animate-pulse rounded bg-black/10 dark:bg-white/10" />
          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-black/10 dark:bg-white/10" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-black/10 dark:bg-white/10" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-black/10 dark:bg-white/10" />
          </div>
          <div className="h-10 w-40 animate-pulse rounded bg-black/10 dark:bg-white/10" />
        </div>
      </div>
    </main>
  );
}
