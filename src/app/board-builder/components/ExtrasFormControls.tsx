"use client";

import PreviewRow from "../components/preview/PreviewRow";
import { styleForToken } from "../components/woods";
import { useMemo } from "react";

type EdgeProfile = "square" | "roundover" | "chamfer";

type EdgeOption =
  | { key: string; label: string; kind: "edged" }
  | { key: string; label: string; kind: "rounded"; radius?: number }
  | {
      key: string;
      label: string;
      kind: "chamfer";
      chamfer?: number;
      chamferTLX?: number;
      chamferTLY?: number;
      chamferBLX?: number;
      chamferBLY?: number;
    };

export default function ExtrasFormControls({
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
}: {
  grooveEnabled: boolean;
  setGrooveEnabled: (v: boolean | ((v: boolean) => boolean)) => void;
  edgeProfile: EdgeProfile;
  setEdgeProfile: (v: EdgeProfile) => void;
  borderRadius: number;
  setBorderRadius: (v: number) => void;
  chamferSize: number;
  setChamferSize: (v: number) => void;
  edgeOption: string;
  setEdgeOption: (v: string) => void;
  topRowColors: (string | null)[];
  cornerColors2x2: (string | null)[][];
}) {
  // Reference to satisfy no-unused-vars for currently unused value
  void chamferSize;
  const PREVIEW_CELL_PX = 20;
  const VISIBLE_CELLS = 4;

  const EDGE_OPTIONS: EdgeOption[] = useMemo(
    () => [
      { key: "edged", label: "Edged", kind: "edged" },
      { key: "rounded4", label: "Rounded", kind: "rounded", radius: 4 },
      { key: "rounded8", label: "Heavy Rounded", kind: "rounded", radius: 8 },
      { key: "double_chamfer", label: "Double Chamfer", kind: "chamfer", chamfer: 8 },
      { key: "diamond", label: "Diamond", kind: "chamfer", chamferTLX: 3, chamferTLY: 2, chamferBLX: 6, chamferBLY: 12 },
      { key: "flat_top", label: "Flat Top", kind: "chamfer", chamferTLX: 0, chamferTLY: 0, chamferBLX: 6, chamferBLY: 12 },
    ],
    []
  );

  return (
    <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 grid gap-4">
      {/* Juice groove toggle (hidden on mobile; shown on md+) */}
      <div className="hidden md:flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">Juice groove</div>
          <div className="text-xs opacity-70">Previewed as a black inset line</div>
        </div>
        <button
          type="button"
          onClick={() => setGrooveEnabled((v: boolean) => !v)}
          className={`h-9 px-3 rounded-md border ${
            grooveEnabled
              ? "border-emerald-500 text-emerald-700 dark:text-emerald-400"
              : "border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10"
          }`}
        >
          {grooveEnabled ? "Enabled" : "Disabled"}
        </button>
      </div>

      {/* Corner presets */}
      <div>
        <div className="text-sm font-medium mb-2">Corner</div>
        <div className="grid grid-cols-4 gap-3">
          {[
            { key: "edged", label: "Edged", onSelect: () => { setEdgeProfile("square"); setBorderRadius(0); } },
            { key: "r4", label: "Rounded 4px", onSelect: () => { setEdgeProfile("roundover"); setBorderRadius(4); } },
            { key: "r8", label: "Rounded 8px", onSelect: () => { setEdgeProfile("roundover"); setBorderRadius(8); } },
            { key: "ch4", label: "Chamfer", onSelect: () => { setEdgeProfile("chamfer"); setBorderRadius(0); setChamferSize(4); } },
          ].map((opt) => {
            const selected =
              (opt.key === "edged" && edgeProfile === "square" && borderRadius === 0) ||
              (opt.key === "r4" && edgeProfile === "roundover" && borderRadius === 4) ||
              (opt.key === "r8" && edgeProfile === "roundover" && borderRadius === 8) ||
              (opt.key === "ch4" && edgeProfile === "chamfer");
            const cellPx = 22;
            const cornerStyle: React.CSSProperties = {
              width: `${cellPx * 2}px`,
              height: `${cellPx * 2}px`,
              overflow: "hidden",
              borderTopLeftRadius: opt.key.startsWith("r") ? (opt.key === "r4" ? 4 : 8) : 0,
              clipPath:
                opt.key === "ch4"
                  ? `polygon(4px 0, 100% 0, 100% 100%, 0 100%, 0 4px)`
                  : undefined,
            };
            return (
              <button
                key={opt.key}
                type="button"
                onClick={opt.onSelect}
                className={`rounded-lg border p-2 flex flex-col items-center gap-2 ${
                  selected
                    ? "border-emerald-500 ring-2 ring-emerald-200"
                    : "border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10"
                }`}
              >
                <div style={cornerStyle} className="grid grid-cols-2 grid-rows-2">
                  {cornerColors2x2.flat().map((tok, idx) => (
                    <div
                      key={idx}
                      style={{
                        width: `${cellPx}px`,
                        height: `${cellPx}px`,
                        ...(styleForToken(tok, cellPx) || { backgroundColor: "transparent" }),
                      }}
                    />
                  ))}
                </div>
                <div className="text-xs opacity-80 text-center">{opt.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Edge profile chooser */}
      <div>
        <div className="text-sm font-medium mb-2">Edge profile</div>
        <div className="grid grid-cols-3 gap-3">
          {EDGE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              aria-pressed={edgeOption === opt.key}
              onClick={() => setEdgeOption(opt.key)}
              className={`relative h-28 rounded-lg border transition-colors ${
                edgeOption === opt.key
                  ? "border-emerald-500 ring-2 ring-emerald-200"
                  : "border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10"
              } overflow-hidden flex flex-col items-center justify-center gap-2`}
            >
              <div className="pointer-events-none" style={{ width: `${VISIBLE_CELLS * PREVIEW_CELL_PX}px`, overflow: "hidden" }}>
                <div
                  style={{
                    borderTopLeftRadius: opt.kind === "rounded" ? (opt.radius ?? 0) : 0,
                    borderBottomLeftRadius: opt.kind === "rounded" ? (opt.radius ?? 0) : 0,
                    clipPath:
                      opt.kind === "chamfer"
                        ? (() => {
                            const c = opt;
                            const tX = c.chamferTLX ?? c.chamfer ?? 8;
                            const tY = c.chamferTLY ?? c.chamfer ?? 8;
                            const bX = c.chamferBLX ?? c.chamfer ?? 8;
                            const bY = c.chamferBLY ?? c.chamfer ?? 8;
                            return `polygon(${tX}px 0, 100% 0, 100% 100%, ${bX}px 100%, 0 calc(100% - ${bY}px), 0 ${tY}px)`;
                          })()
                        : undefined,
                    overflow: "hidden",
                  }}
                >
                  <PreviewRow
                    index={0}
                    stripNo={1}
                    colors={topRowColors}
                    colCount={topRowColors.length || 12}
                    cellPx={PREVIEW_CELL_PX}
                    selected={false}
                    deselecting={false}
                    compact
                  />
                </div>
              </div>
              <div className="text-xs opacity-80 text-center px-2">{opt.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
