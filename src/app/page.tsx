import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-3xl font-semibold">template selection</h1>
        <Link
          href="/board-builder"
          className="inline-flex items-center justify-center rounded-md bg-black text-white dark:bg-white dark:text-black px-5 py-2.5 text-sm font-medium shadow hover:opacity-90 transition"
        >
          create your own
        </Link>
      </div>
    </main>
  );
}
