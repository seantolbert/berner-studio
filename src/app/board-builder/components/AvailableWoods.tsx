"use client";

import { WOODS } from "./woods";

type Props = {
  selectedKey: string | null;
  onSelect: (key: string) => void;
};

export default function AvailableWoods({ selectedKey, onSelect }: Props) {
  const selectedWood = WOODS.find((w) => w.key === selectedKey);

  return (
    <div className="relative rounded-lg  w-full">
      {/* Header row: title left, selected name right */}
      <div className="flex items-center justify-between px-3">
        <h3 className="text-sm font-medium">Available Woods</h3>
        <span className="text-xs font-medium text-foreground/80">
          {selectedWood?.name || "\u00A0"}
        </span>
      </div>

      {/* Squares row */}
      <div className="h-full w-full flex items-center justify-center">
        <div className="w-full px-3 pt-2 pb-3 overflow-x-auto">
          <div className="flex items-center gap-3 min-w-max">
            {WOODS.map((wood) => (
              <button
                key={wood.key}
                type="button"
                aria-label={wood.name}
                title={wood.name}
                onClick={() => onSelect(wood.key)}
                className={`relative h-8 w-8 rounded-lg border transition shadow-sm focus:outline-none focus:ring-2 focus:ring-black/30 dark:focus:ring-white/30 ${
                  selectedKey === wood.key
                    ? "border-black/60 dark:border-white/60 ring-2 ring-black/30 dark:ring-white/30"
                    : "border-black/15 dark:border-white/15"
                }`}
                style={{ backgroundColor: wood.color }}
              >
                <span className="sr-only">{wood.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
