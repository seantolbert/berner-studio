"use client";

type OrderNotesSectionProps = {
  notes: string;
  onChange: (value: string) => void;
};

export default function OrderNotesSection({ notes, onChange }: OrderNotesSectionProps) {
  return (
    <section className="rounded-lg border border-black/10 dark:border-white/10 p-4 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Order notes</h2>
        <p className="text-sm opacity-70">Share delivery preferences or personalization details.</p>
      </div>
      <textarea
        className="w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent min-h-[96px] px-3 py-2 text-sm"
        value={notes}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Gate code, preferred delivery window, or gift message."
      />
    </section>
  );
}

