"use client";

import ExtrasPreview from "../components/ExtrasPreview";

export type Size = "small" | "regular" | "large";

export default function PreviewPane({
  size,
  boardData,
  edgeProfile,
  borderRadius,
  chamferSize,
  grooveEnabled,
  className,
}: {
  size: Size;
  boardData: { strips: (string | null)[][]; order: { stripNo: number; reflected: boolean }[] };
  edgeProfile: "square" | "roundover" | "chamfer";
  borderRadius: number;
  chamferSize: number;
  grooveEnabled: boolean;
  className?: string;
}) {
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

