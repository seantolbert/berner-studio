"use client";

import type { ContactFormState } from "../types";

type ContactSectionProps = {
  contact: ContactFormState;
  onChange: (partial: Partial<ContactFormState>) => void;
};

export default function ContactSection({ contact, onChange }: ContactSectionProps) {
  return (
    <section className="rounded-lg border border-black/10 dark:border-white/10 p-4 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Contact information</h2>
        <p className="text-sm opacity-70">We'll use this for order updates and receipts.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="text-sm font-medium">
          Full name
          <input
            className="mt-1 w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent h-10 px-3 text-sm"
            type="text"
            value={contact.fullName}
            onChange={(e) => onChange({ fullName: e.target.value })}
            placeholder="Jamie Rivera"
          />
        </label>
        <label className="text-sm font-medium">
          Phone
          <input
            className="mt-1 w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent h-10 px-3 text-sm"
            type="tel"
            value={contact.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            placeholder="(555) 000-1234"
          />
        </label>
        <label className="text-sm font-medium md:col-span-2">
          Email
          <input
            className="mt-1 w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent h-10 px-3 text-sm"
            type="email"
            value={contact.email}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder="you@example.com"
          />
        </label>
      </div>
    </section>
  );
}
