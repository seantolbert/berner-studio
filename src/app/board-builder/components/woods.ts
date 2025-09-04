import type { CSSProperties } from "react";

export type Wood = {
  key: string;
  name: string;
  color: string;
  // Optional pattern generator; receives an approximate cell size in px
  pattern?: (cellPx: number) => CSSProperties;
};

const canaryPattern = (cellPx: number): CSSProperties => {
  // Thicker diagonal grain bands over yellow
  const band = Math.max(2, Math.round(cellPx / 3));
  const spacing = Math.max(4, Math.round(cellPx / 1.5));
  const lineColor = "rgba(90, 60, 20, 0.28)";
  return {
    backgroundImage: `repeating-linear-gradient(135deg, ${lineColor} 0px, ${lineColor} ${band}px, transparent ${band}px, transparent ${spacing}px)`,
    backgroundBlendMode: "multiply",
  } as const;
};

const ambrosiaPattern = (cellPx: number): CSSProperties => {
  // Two crisp knots: dark brown and greenish-blue, no vertical lines
  const knotSize = Math.max(3, Math.round(cellPx / 2.6));
  const darkR = Math.max(2, Math.round(knotSize * 0.45));
  const gbR = Math.max(2, Math.round(knotSize * 0.4));
  const darkKnot = `radial-gradient(circle at 30% 40%, rgba(80, 62, 50, 0.6) 0, rgba(80, 62, 50, 0.6) ${darkR}px, transparent ${
    darkR + 0.5
  }px)`;
  const greenBlueKnot = `radial-gradient(circle at 70% 65%, rgba(60, 110, 110, 0.55) 0, rgba(60, 110, 110, 0.55) ${gbR}px, transparent ${
    gbR + 0.5
  }px)`;
  return {
    backgroundImage: [darkKnot, greenBlueKnot].join(","),
    backgroundBlendMode: "multiply",
  } as const;
};

export const WOODS: Wood[] = [
  { key: "cherry", name: "Cherry", color: "#B35C44" },
  { key: "walnut", name: "Walnut", color: "#6B4F3A" },
  { key: "maple", name: "Maple", color: "#E8D6B6" },
  { key: "purpleheart", name: "Purple Heart", color: "#6E1E6A" },
  { key: "canarywood", name: "Canarywood", color: "#D7A321", pattern: canaryPattern },
  { key: "padauk", name: "Padauk", color: "#D24B1F" },
  { key: "ambrosia_maple", name: "Ambrosia Maple", color: "#E8D6B6", pattern: ambrosiaPattern },
];

export const woodByKey: Record<string, Wood> = Object.fromEntries(
  WOODS.map((w) => [w.key, w])
);

export function styleForToken(token: string | null, cellPx: number): CSSProperties | undefined {
  if (!token) return undefined;
  // Prefer matching by wood key; fallback to color hex
  const byKey = woodByKey[token];
  if (byKey) {
    return {
      backgroundColor: byKey.color,
      ...(byKey.pattern ? byKey.pattern(cellPx) : {}),
    } as CSSProperties;
  }
  const byColor = WOODS.find((w) => w.color === token);
  if (byColor) {
    return {
      backgroundColor: byColor.color,
      ...(byColor.pattern ? byColor.pattern(cellPx) : {}),
    } as CSSProperties;
  }
  return { backgroundColor: token } as CSSProperties;
}
