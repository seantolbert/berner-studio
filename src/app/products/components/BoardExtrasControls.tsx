"use client";

import { styleForToken } from "@/app/board-builder/components/woods";
import ExtrasFormControls from "@/app/board-builder/components/ExtrasFormControls";
import type { Dispatch, SetStateAction } from "react";
import type { BoardSize } from "@/types/board";

type BoardExtrasControlsProps = {
  boardSize: BoardSize;
  onBoardSizeChange: (size: BoardSize) => void;
  grooveEnabled: boolean;
  setGrooveEnabled: Dispatch<SetStateAction<boolean>>;
  edgeProfile: "square" | "chamfer" | "roundover";
  setEdgeProfile: Dispatch<SetStateAction<"square" | "chamfer" | "roundover">>;
  borderRadius: number;
  setBorderRadius: Dispatch<SetStateAction<number>>;
  chamferSize: number;
  setChamferSize: Dispatch<SetStateAction<number>>;
  edgeOption: string;
  setEdgeOption: Dispatch<SetStateAction<string>>;
  topRowColors: (string | null)[];
  cornerColors2x2: (string | null)[][];
  stripSampleOption: "none" | "glide" | "lift";
  setStripSampleOption: Dispatch<SetStateAction<"none" | "glide" | "lift">>;
  handleEnabled: (opt: "none" | "glide" | "lift") => boolean;
  brassFeet: boolean;
  setBrassFeet: Dispatch<SetStateAction<boolean>>;
  showHandleControls?: boolean;
  showBrassControl?: boolean;
  showSizeControl?: boolean;
};

export function BoardExtrasControls({
  boardSize,
  onBoardSizeChange,
  grooveEnabled,
  setGrooveEnabled,
  edgeProfile,
  setEdgeProfile,
  borderRadius,
  setBorderRadius,
  chamferSize,
  setChamferSize,
  edgeOption,
  setEdgeOption,
  topRowColors,
  cornerColors2x2,
  stripSampleOption,
  setStripSampleOption,
  handleEnabled,
  brassFeet,
  setBrassFeet,
  showHandleControls = true,
  showBrassControl = true,
  showSizeControl = true,
}: BoardExtrasControlsProps) {
  const sizeOptions: Array<{ key: BoardSize; label: string }> = [
    { key: "small", label: "Small" },
    { key: "regular", label: "Regular" },
  ];
  const normalizedSize: "small" | "regular" = boardSize === "large" ? "regular" : boardSize;

  return (
    <div className="w-full rounded-md border border-black/10 dark:border-white/10 p-3">
      <div className="text-sm font-medium mb-2">Customize</div>
      {showSizeControl && (
        <div className="mb-4">
          <div className="text-sm font-medium mb-2">Board size</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {sizeOptions.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => onBoardSizeChange(opt.key)}
                aria-pressed={normalizedSize === opt.key}
                className={`h-10 px-3 rounded-md border text-sm transition-colors ${
                  normalizedSize === opt.key
                    ? "border-emerald-500 ring-2 ring-emerald-200"
                    : "border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
      <ExtrasFormControls
        grooveEnabled={grooveEnabled}
        setGrooveEnabled={setGrooveEnabled}
        edgeProfile={edgeProfile}
        setEdgeProfile={setEdgeProfile}
        borderRadius={borderRadius}
        setBorderRadius={setBorderRadius}
        chamferSize={chamferSize}
        setChamferSize={setChamferSize}
        edgeOption={edgeOption}
        setEdgeOption={setEdgeOption}
        topRowColors={topRowColors}
        cornerColors2x2={cornerColors2x2}
        bare
      />
      {showHandleControls && topRowColors.length > 0 && (
        <div className="mt-4">
          <div className="text-sm font-medium mb-2">Handle style</div>
          <div className="grid grid-cols-3 gap-3">
            {(() => {
              const len = topRowColors.length;
              const take = 8;
              const start = Math.max(0, Math.floor((len - take) / 2));
              const base = topRowColors.slice(start, start + take);
              const variants: Array<{
                key: "none" | "glide" | "lift";
                label: string;
                colors: (string | null)[];
              }> = [
                { key: "none", label: "None", colors: base },
                { key: "glide", label: "Glide", colors: base },
                { key: "lift", label: "Lift", colors: base },
              ];
              const CELL = 14;
              return variants.map((variant) => {
                const enabled = handleEnabled(variant.key);
                const isSelected = stripSampleOption === variant.key;
                return (
                  <button
                    key={variant.key}
                    type="button"
                    onClick={() => {
                      if (enabled) setStripSampleOption(variant.key);
                    }}
                    aria-pressed={isSelected}
                    aria-disabled={!enabled}
                    disabled={!enabled}
                    className={`relative h-28 rounded-lg border transition-colors overflow-hidden flex items-center justify-center ${
                      !enabled
                        ? "opacity-40 cursor-not-allowed border-black/10 dark:border-white/10"
                        : isSelected
                        ? "border-emerald-500 ring-2 ring-emerald-200"
                        : "border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className="relative"
                        style={{ width: `${variant.colors.length * CELL}px` }}
                      >
                        <div
                          className="relative z-0 grid gap-0"
                          style={{ gridTemplateColumns: `repeat(${variant.colors.length}, ${CELL}px)` }}
                          aria-hidden
                        >
                          {variant.colors.map((token, idx) => (
                            <div
                              key={idx}
                              className="border border-black/10 dark:border-white/10"
                              style={{
                                width: `${CELL}px`,
                                height: `${CELL * 2}px`,
                                ...(typeof token === "string"
                                  ? styleForToken(token, CELL)
                                  : { backgroundColor: "transparent" }),
                              }}
                            />
                          ))}
                        </div>
                        {variant.key === "glide" && (
                          <div
                            className="absolute z-10 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none bg-black/40 mix-blend-multiply"
                            style={{ width: `${variant.colors.length * CELL * 0.6}px`, height: `${CELL * 0.9}px` }}
                          />
                        )}
                        {variant.key === "lift" && (
                          <div
                            className="absolute z-10 left-1/2 pointer-events-none bg-black/40 mix-blend-multiply"
                            style={{
                              width: `${variant.colors.length * CELL * 0.6}px`,
                              height: `${CELL * 0.9}px`,
                              bottom: 0,
                              transform: `translateX(-50%)`,
                              borderTopLeftRadius: 6,
                              borderTopRightRadius: 6,
                            }}
                          />
                        )}
                      </div>
                      <div className="text-xs opacity-80">{variant.label}</div>
                    </div>
                  </button>
                );
              });
            })()}
        </div>
          {showBrassControl && normalizedSize === "small" && (
            <div className="mt-4 flex items-center justify-between rounded-md border border-black/10 dark:border-white/10 p-3">
              <div>
                <div className="text-sm font-medium">Brass feet</div>
                <div className="text-xs opacity-70">Adds brass feet hardware to the base</div>
              </div>
              <button
                type="button"
                aria-pressed={brassFeet}
                onClick={() => setBrassFeet(!brassFeet)}
                className={`h-6 w-11 rounded-full border border-black/15 dark:border-white/15 relative transition-colors ${
                  brassFeet ? "bg-emerald-600" : "bg-white/60 dark:bg-black/30"
                }`}
                aria-label="Toggle brass feet"
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    brassFeet ? "translate-x-5" : "translate-x-0.5"
                  }`}
                  aria-hidden
                />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
