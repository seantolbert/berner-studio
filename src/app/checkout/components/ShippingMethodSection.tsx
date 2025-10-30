"use client";

import type { ShippingOption } from "../types";

type ShippingMethodSectionProps = {
  options: ShippingOption[];
  selectedId: ShippingOption["id"];
  onSelect: (id: ShippingOption["id"]) => void;
};

export default function ShippingMethodSection({ options, selectedId, onSelect }: ShippingMethodSectionProps) {
  return (
    <section className="rounded-lg border border-black/10 dark:border-white/10 p-4 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Shipping method</h2>
        <p className="text-sm opacity-70">Choose the speed that works best for you.</p>
      </div>
      <div className="space-y-3">
        {options.map((option) => (
          <label
            key={option.id}
            className="flex items-start gap-3 rounded-lg border border-black/10 dark:border-white/10 p-3 text-sm hover:border-black/20 dark:hover:border-white/20 transition"
          >
            <input
              type="radio"
              className="mt-1"
              checked={selectedId === option.id}
              onChange={() => onSelect(option.id)}
            />
            <span>
              <span className="font-medium block">{option.label}</span>
              <span className="opacity-70 block text-xs">{option.description}</span>
            </span>
          </label>
        ))}
      </div>
    </section>
  );
}

