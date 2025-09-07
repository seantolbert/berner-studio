export type BoardSize = "small" | "regular" | "large";

// Single Source of Truth for pricing
export const PRICING_SSO = {
  currency: "USD",
  cellPrice: 1, // $1 per filled cell
  basePrices: {
    small: 150,
    regular: 200, // "medium" maps to existing "regular" size
    large: 300,
  } as Record<BoardSize, number>,
  extras: {
    juiceGroove: 20,
  },
};

export function countFilledCells(
  strips: (string | null)[][],
  strip3Enabled: boolean
) {
  const rows = strip3Enabled ? [0, 1, 2] : [0, 1];
  let count = 0;
  for (const r of rows) {
    const row = strips[r] || [];
    for (const cell of row) {
      if (cell !== null) count += 1;
    }
  }
  return count;
}

export function calculateBoardPrice(args: {
  size: BoardSize;
  strips: (string | null)[][];
  strip3Enabled: boolean;
}) {
  const base = PRICING_SSO.basePrices[args.size];
  const cellCount = countFilledCells(args.strips, args.strip3Enabled);
  const variable = cellCount * PRICING_SSO.cellPrice;
  const total = base + variable;
  return { base, variable, cellCount, total };
}
