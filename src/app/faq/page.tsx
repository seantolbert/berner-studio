"use client";

export default function FAQPage() {
  return (
    <main className="min-h-screen w-full p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold">Care & FAQ</h1>
        <section>
          <h2 className="text-lg font-medium">How do I care for my board?</h2>
          <p className="opacity-80 text-sm mt-1">
            Hand wash with mild soap and warm water. Dry upright. Re‑oil with food‑safe mineral oil as needed.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-medium">Can I cut raw meat?</h2>
          <p className="opacity-80 text-sm mt-1">
            Yes, sanitize after use and avoid prolonged moisture. Consider a separate board for proteins.
          </p>
        </section>
      </div>
    </main>
  );
}

