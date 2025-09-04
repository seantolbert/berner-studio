"use client";

import { useState } from "react";
import AvailableWoods from "./AvailableWoods";
import Strips from "./Strips";

type Props = {
  boardData: { strips: (string | null)[][]; order: number[] };
  setBoardData: (
    updater:
      | { strips: (string | null)[][]; order: number[] }
      | ((prev: { strips: (string | null)[][]; order: number[] }) => {
          strips: (string | null)[][];
          order: number[];
        })
  ) => void;
  strip3Enabled: boolean;
  onToggleStrip3: () => void;
};

export default function StripBuilder({
  boardData,
  setBoardData,
  strip3Enabled,
  onToggleStrip3,
}: Props) {
  const [selectedWoodKey, setSelectedWoodKey] = useState<string | null>(null);

  return (
    <section className="row-span-1 pt-2">
      <div className="w-full h-full grid gap-2">
        <AvailableWoods
          selectedKey={selectedWoodKey}
          onSelect={setSelectedWoodKey}
        />
        <Strips
          selectedKey={selectedWoodKey}
          boardData={boardData}
          setBoardData={setBoardData}
          strip3Enabled={strip3Enabled}
          onToggleStrip3={onToggleStrip3}
        />
        <div className="grid grid-cols-3 gap-2">
          {/* Back button (1/3 width) */}
          <button
            type="button"
            aria-label="Back"
            title="Back"
            className="col-span-1 inline-flex items-center justify-center h-12 rounded-md border border-black/15 dark:border-white/15 bg-white/70 dark:bg-black/30 hover:bg-black/5 dark:hover:bg-white/10"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          {/* Complete button (2/3 width) */}
          <button
            type="button"
            className="col-span-2 inline-flex items-center justify-center h-12 rounded-md bg-black text-white dark:bg-white dark:text-black font-medium shadow hover:opacity-90"
          >
            Complete
          </button>
        </div>
      </div>
    </section>
  );
}
