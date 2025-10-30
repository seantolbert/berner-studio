import type { BoardExtras, BoardLayout, BoardSize } from "@/types/board";

export type CartBreakdown = {
  baseCents: number;
  variableCents: number;
  extrasCents: number;
  extrasDetail?: Array<{ label: string; amountCents: number }>;
};

export type CartConfig = {
  size: BoardSize;
  strip3Enabled: boolean;
  boardData: BoardLayout;
  extras: BoardExtras;
  edgeOption?: string | null;
  handleStyle?: "none" | "glide" | "lift";
  brassFeet?: boolean;
};

export type CartItem = {
  id: string;
  name: string;
  unitPrice: number; // cents
  quantity: number;
  breakdown?: CartBreakdown;
  config?: CartConfig;
  image?: string;
};
