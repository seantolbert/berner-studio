"use client";

import { useState } from "react";
import AvailableWoods from "./AvailableWoods";
import Strips from "./Strips";
import { useModal } from "./modal/ModalProvider";

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
  onConfirmComplete?: () => void;
  pricing?: { total: number; cellCount: number };
};

export default function StripBuilder({
  boardData,
  setBoardData,
  strip3Enabled,
  onToggleStrip3,
  onConfirmComplete,
  pricing,
}: Props) {
  const [selectedWoodKey, setSelectedWoodKey] = useState<string | null>(null);
  const { open, close } = useModal();
  // Complete only when required strips are fully filled
  const requiredRows = strip3Enabled ? [0, 1, 2] : [0, 1];
  const isAllRequiredStripsComplete = requiredRows.every((r) =>
    boardData.strips[r].every((c) => c !== null)
  );

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
          {/* Price indicator replaces back button */}
          <div
            className="col-span-1 inline-flex items-center justify-between h-12 rounded-md border border-black/15 dark:border-white/15 bg-white/70 dark:bg-black/30 px-3"
            aria-live="polite"
          >
            <span className="text-xs text-black/60 dark:text-white/60">
              Total
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-semibold tabular-nums">
                ${pricing ? pricing.total.toFixed(2) : "0.00"}
              </span>
              <span className="text-[10px] text-black/50 dark:text-white/50">
                {pricing ? pricing.cellCount : 0} cells
              </span>
            </div>
          </div>

          {/* Complete button (2/3 width) */}
          <button
            type="button"
            disabled={!isAllRequiredStripsComplete}
            onClick={() => {
              if (!isAllRequiredStripsComplete) return;
              open(
                <div className="flex flex-col gap-4">
                  <p className="text-sm">
                    Ready to move on with your current board configuration?
                  </p>
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      type="button"
                      onClick={close}
                      className="inline-flex h-9 px-3 rounded-md border border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        close();
                        onConfirmComplete?.();
                      }}
                      className="inline-flex h-9 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Continue
                    </button>
                  </div>
                </div>,
                { title: "Confirm Completion", size: "sm", dismissible: true }
              );
            }}
            className={`col-span-2 inline-flex items-center justify-center h-12 rounded-md font-medium shadow transition-colors ${
              isAllRequiredStripsComplete
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-red-500/40 text-white/70 cursor-not-allowed dark:bg-red-400/30"
            }`}
          >
            Complete
          </button>
        </div>
      </div>
    </section>
  );
}
