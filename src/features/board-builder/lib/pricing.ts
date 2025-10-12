import { getPriceForToken } from "@/features/board-builder/lib/woods";

export type BoardSize = "small" | "regular" | "large";

export const PRICING_SSO = {
  currency: "USD",
  cellPrice: 1,
  basePrices: {
    small: 150,
    regular: 200,
    large: 300,
  } as Record<BoardSize, number>,
  extras: {
    juiceGroove: 20,
    thirdStrip: 0,
    brassFeet: 0,
  },
};

export function countFilledCells(strips: (string | null)[][], strip3Enabled: boolean) {
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
  const rows = args.strip3Enabled ? [0, 1, 2] : [0, 1];
  let variable = 0;
  let cellCount = 0;

  for (const r of rows) {
    const row = args.strips[r] || [];
    for (const cell of row) {
      if (cell !== null) {
        cellCount += 1;
        const price = getPriceForToken(cell);
        variable += typeof price === "number" ? price : PRICING_SSO.cellPrice;
      }
    }
  }

  if (cellCount === 0) {
    cellCount = countFilledCells(args.strips, args.strip3Enabled);
    variable = cellCount * PRICING_SSO.cellPrice;
  }

  const extrasThirdStrip = args.strip3Enabled ? PRICING_SSO.extras.thirdStrip : 0;
  const total = base + variable + extrasThirdStrip;
  return { base, variable, cellCount, total, extrasThirdStrip };
}

export function setRuntimePricing(patch: Partial<{
  currency: string;
  cellPrice: number;
  basePrices: Partial<Record<BoardSize, number>>;
  extras: Partial<{ juiceGroove: number; thirdStrip: number; brassFeet: number }>;
}>) {
  if (!patch || typeof patch !== "object") return;
  if (typeof patch.currency === "string" && patch.currency) {
    PRICING_SSO.currency = patch.currency.toUpperCase();
  }
  if (typeof patch.cellPrice === "number" && patch.cellPrice >= 0) {
    PRICING_SSO.cellPrice = patch.cellPrice;
  }
  if (patch.basePrices) {
    PRICING_SSO.basePrices = {
      ...PRICING_SSO.basePrices,
      ...patch.basePrices,
    } as Record<BoardSize, number>;
  }
  if (patch.extras) {
    PRICING_SSO.extras = {
      ...PRICING_SSO.extras,
      ...patch.extras,
    } as typeof PRICING_SSO.extras;
  }
}
