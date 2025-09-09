// Lightweight lead time estimation utilities.
// Intent: provide helpful ETA messaging without backend complexity.

import { countFilledCells } from "@/app/board-builder/pricing";

export type Size = "small" | "regular" | "large";

export type BoardConfig = {
  size: Size;
  strip3Enabled: boolean;
  boardData?: { strips: (string | null)[][] };
  extras?: { edgeProfile?: "square" | "roundover" | "chamfer"; chamferSize?: number; grooveEnabled?: boolean };
};

export type EtaRange = {
  productionDays: { min: number; max: number };
  shippingDays: { min: number; max: number };
  startDate: Date; // earliest delivery date
  endDate: Date;   // latest delivery date
  label: string;   // concise human-readable label
};

const BASE_PROD_DAYS: Record<Size, { min: number; max: number }> = {
  small: { min: 3, max: 5 },
  regular: { min: 5, max: 7 },
  large: { min: 7, max: 10 },
};

const SHIPPING_STANDARD = { min: 3, max: 5 }; // business days (ground)

function isWeekend(d: Date) {
  const day = d.getDay();
  return day === 0 || day === 6;
}

function addBusinessDays(from: Date, days: number) {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    if (!isWeekend(d)) added++;
  }
  return d;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function estimateBoardETA(cfg: BoardConfig, today = new Date()): EtaRange {
  const base = BASE_PROD_DAYS[cfg.size] || BASE_PROD_DAYS.regular;
  let prodMin = base.min;
  let prodMax = base.max;

  // Extras add complexity
  if (cfg.extras?.grooveEnabled) {
    prodMin += 1;
    prodMax += 1;
  }
  if (cfg.strip3Enabled) {
    prodMin += 1;
    prodMax += 1;
  }
  // Very rough complexity factor based on filled cells
  try {
    const strips: (string | null)[][] = cfg.boardData?.strips || [];
    const cells = countFilledCells(strips, cfg.strip3Enabled);
    const extra = Math.floor(cells / 60); // +1 day per 60 cells
    prodMin += extra;
    prodMax += extra;
  } catch {}

  // Guard rails
  prodMin = clamp(prodMin, base.min, base.max + 7);
  prodMax = clamp(prodMax, prodMin, base.max + 10);

  const shipMin = SHIPPING_STANDARD.min;
  const shipMax = SHIPPING_STANDARD.max;

  const startDate = addBusinessDays(today, prodMin + shipMin);
  const endDate = addBusinessDays(today, prodMax + shipMax);

  const label = formatEtaLabel(startDate, endDate);
  return {
    productionDays: { min: prodMin, max: prodMax },
    shippingDays: { min: shipMin, max: shipMax },
    startDate,
    endDate,
    label,
  };
}

export function estimateProductETA(today = new Date()): EtaRange {
  // Stock products: quick handling
  const prodMin = 0, prodMax = 1;
  const shipMin = SHIPPING_STANDARD.min, shipMax = SHIPPING_STANDARD.max;
  const startDate = addBusinessDays(today, prodMin + shipMin);
  const endDate = addBusinessDays(today, prodMax + shipMax);
  return { productionDays: { min: prodMin, max: prodMax }, shippingDays: { min: shipMin, max: shipMax }, startDate, endDate, label: formatEtaLabel(startDate, endDate) };
}

type CartItemETA = {
  config?: {
    size?: Size;
    strip3Enabled?: boolean;
    boardData?: { strips: (string | null)[][] };
    extras?: { edgeProfile?: "square" | "roundover" | "chamfer"; chamferSize?: number; grooveEnabled?: boolean };
  };
};

export function estimateCartETA(items: CartItemETA[], today = new Date()): EtaRange | null {
  if (!Array.isArray(items) || items.length === 0) return null;
  let prodMin = 0, prodMax = 0;
  let shipMin = SHIPPING_STANDARD.min, shipMax = SHIPPING_STANDARD.max;

  let start: Date | null = null;
  let end: Date | null = null;

  for (const it of items) {
    if (it?.config?.size) {
      const eta = estimateBoardETA({
        size: it.config.size,
        strip3Enabled: Boolean(it.config.strip3Enabled),
        ...(it.config.boardData ? { boardData: it.config.boardData } : {}),
        ...(it.config.extras ? { extras: it.config.extras } : {}),
      }, today);
      // For mixed carts, overall ETA is dominated by the slowest item
      const s = eta.startDate;
      const e = eta.endDate;
      if (!start || s > start) start = s;
      if (!end || e > end) end = e;
    } else {
      const eta = estimateProductETA(today);
      const s = eta.startDate;
      const e = eta.endDate;
      if (!start || s > start) start = s;
      if (!end || e > end) end = e;
    }
  }

  if (!start || !end) return null;
  return { productionDays: { min: prodMin, max: prodMax }, shippingDays: { min: shipMin, max: shipMax }, startDate: start, endDate: end, label: formatEtaLabel(start, end) };
}

function formatEtaLabel(start: Date, end: Date) {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const s = start.toLocaleDateString(undefined, opts);
  const e = end.toLocaleDateString(undefined, opts);
  return s === e ? `Arrives by ${e}` : `Arrives ${s}–${e}`;
}
