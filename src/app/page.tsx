"use client";

import Link from "next/link";
import { TEMPLATES, LS_SELECTED_TEMPLATE_KEY } from "./templates";
import { useRouter } from "next/navigation";
import TemplateButton from "./components/TemplateButton";

export default function Home() {
  const router = useRouter();
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl flex flex-col items-stretch gap-6">
        <h1 className="text-3xl font-semibold text-center">template selection</h1>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {TEMPLATES.map((t) => (
            <TemplateButton
              key={t.id}
              template={t}
              onClick={() => {
                localStorage.setItem(LS_SELECTED_TEMPLATE_KEY, JSON.stringify(t));
                router.push("/board-builder");
              }}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem(LS_SELECTED_TEMPLATE_KEY, "__blank__");
            router.push("/board-builder");
          }}
          className="self-center inline-flex items-center justify-center rounded-md bg-black text-white dark:bg-white dark:text-black px-5 py-2.5 text-sm font-medium shadow hover:opacity-90 transition"
        >
          create your own
        </button>
      </div>
    </main>
  );
}
