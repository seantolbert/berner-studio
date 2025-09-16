"use client";

import ExtrasPreview from "../components/ExtrasPreview";
import type { BoardExtras, BoardLayout, BoardSize } from "@/types/board";

export type Size = BoardSize;

type Props = {
  size: BoardSize;
  boardData: BoardLayout;
  edgeProfile: BoardExtras["edgeProfile"];
  borderRadius: BoardExtras["borderRadius"];
  chamferSize: BoardExtras["chamferSize"];
  grooveEnabled: BoardExtras["grooveEnabled"];
  className?: string;
};

export default function PreviewPane({
  size,
  boardData,
  edgeProfile,
  borderRadius,
  chamferSize,
  grooveEnabled,
  className,
}: Props) {
  const effectiveRadius = edgeProfile === "chamfer" ? 0 : borderRadius;
  return (
    <div className={className}>
      <ExtrasPreview
        boardData={boardData}
        size={size}
        borderRadius={effectiveRadius}
        grooveEnabled={grooveEnabled}
        edgeProfile={edgeProfile}
        chamferSize={chamferSize}
      />
    </div>
  );
}
