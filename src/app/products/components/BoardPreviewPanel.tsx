"use client";

import ExtrasPreview from "@/app/board-builder/components/ExtrasPreview";
import BoardTopRowPreview from "@/app/products/components/BoardTopRowPreview";
import type { BoardLayout, BoardSize } from "@/types/board";

type BoardPreviewPanelProps = {
  layout: BoardLayout;
  boardSize: BoardSize;
  edgeProfile: "square" | "chamfer" | "roundover";
  borderRadius: number;
  chamferSize: number;
  grooveEnabled: boolean;
  stripSampleOption: "none" | "glide" | "lift";
  brassFeet: boolean;
  edgeOption: string;
};

export function BoardPreviewPanel({
  layout,
  boardSize,
  edgeProfile,
  borderRadius,
  chamferSize,
  grooveEnabled,
  stripSampleOption,
  brassFeet,
  edgeOption,
}: BoardPreviewPanelProps) {
  const normalizedSize: "small" | "regular" = boardSize === "large" ? "regular" : boardSize;
  const cols = layout.strips[0]?.length ?? 12;
  const rows = normalizedSize === "small" ? 11 : 15;
  const defaultOrder = Array.from({ length: rows }, (_, index) => ({
    stripNo: index % 2 === 0 ? 1 : 2,
    reflected: false,
  }));
  const orderPreview = (layout.order && layout.order.length ? layout.order : defaultOrder).slice(0, rows);
  const cellPx = 12;
  const wPx = cols * cellPx;
  const hPx = rows * cellPx;
  const heightInches = normalizedSize === "regular" ? 14 : 9.5;
  const fmtIn = (value: number) =>
    Math.abs(value - Math.round(value)) < 0.05 ? String(Math.round(value)) : value.toFixed(1);

  return (
    <div className="w-full overflow-x-hidden overflow-y-visible rounded-md border border-black/10 dark:border-white/10 p-3">
      <div className="flex items-center justify-between md:justify-evenly">
        <div className="relative inline-block" style={{ width: `${wPx}px`, height: `${hPx}px` }}>
          <ExtrasPreview
            boardData={{ strips: layout.strips, order: orderPreview }}
            size={boardSize}
            borderRadius={borderRadius}
            grooveEnabled={grooveEnabled}
            edgeProfile={edgeProfile}
            chamferSize={chamferSize}
            grooveBorderWidthPx={6}
            grooveCornerRadiusPx={6}
          />
          <div className="absolute top-0 bottom-0" style={{ right: "-18px" }}>
            <div className="relative my-auto" style={{ height: `${hPx}px`, width: "0px" }}>
              <div className="absolute top-0 bottom-0 w-px bg-current" />
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-px rotate-90 bg-current" />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-2 w-px -rotate-90 bg-current" />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-1 bg-background text-[11px] rotate-90 origin-center opacity-80 leading-none select-none">
                {fmtIn(heightInches)}″
              </div>
            </div>
          </div>
        </div>
        <div className="shrink-0 flex flex-col items-center justify-center">
          <div className="relative" style={{ width: `${cols * cellPx}px` }}>
            <BoardTopRowPreview
              strips={layout.strips}
              order={layout.order}
              size={normalizedSize}
              strip3Enabled={layout.strips.length >= 3}
              edgeProfile={edgeProfile}
              borderRadius={borderRadius}
              chamferSize={chamferSize}
              edgeOption={edgeOption}
              handleStyle={stripSampleOption}
              showBrassFeet={brassFeet}
            />
          </div>
          <div className="relative mt-2" style={{ width: `${cols * cellPx}px`, height: "0px" }}>
            <div className="absolute left-0 right-0 h-px bg-current" />
            <div className="absolute -left-1 top-0 w-2 h-px rotate-90 bg-current" />
            <div className="absolute -right-1 top-0 w-2 h-px -rotate-90 bg-current" />
            <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 px-1 bg-background text-[11px] opacity-80 leading-none">
              {normalizedSize === "regular" ? "10" : "9.5"}″
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
