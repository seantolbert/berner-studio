import { woodByKey } from "@/features/board-builder/lib/woods";
import type { CartConfig } from "@/types/cart";
import type { OrderSummaryItem } from "@/lib/orderSummary";

export type BoardCustomizationField = { label: string; value: string };
export type BoardCustomizationDetail = {
  itemName: string;
  quantity: number;
  fields: BoardCustomizationField[];
};

const EDGE_OPTION_LABELS: Record<string, string> = {
  edged: "Edged",
  rounded4: "Rounded",
  rounded8: "Heavy Rounded",
  double_chamfer: "Double Chamfer",
  diamond: "Diamond",
  flat_top: "Flat Top",
};

const HANDLE_LABELS: Record<NonNullable<CartConfig["handleStyle"]>, string> = {
  none: "None",
  glide: "Glide",
  lift: "Lift",
};

const SIZE_LABELS: Record<string, string> = {
  small: "Small",
  regular: "Regular",
  large: "Large",
};

export function collectBoardCustomizations(items: OrderSummaryItem[]): BoardCustomizationDetail[] {
  const details: BoardCustomizationDetail[] = [];
  items.forEach((item) => {
    if (!hasBoardConfig(item.config)) return;
    const fields: BoardCustomizationField[] = [];
    fields.push(...buildBoardExtrasFields(item.config));
    if (shouldIncludeStripDetails(item)) {
      fields.push(...describeStrips(item.config.boardData));
    }
    if (!fields.length) return;
    details.push({ itemName: item.name, quantity: item.quantity, fields });
  });
  return details;
}

function hasBoardConfig(config: CartConfig | null | undefined): config is CartConfig {
  if (!config || !config.boardData || !Array.isArray(config.boardData.strips)) return false;
  return true;
}

function shouldIncludeStripDetails(item: OrderSummaryItem): boolean {
  const id = item.itemId?.toLowerCase() ?? "";
  if (id.startsWith("cart-") || id.startsWith("custom-")) return true;
  const name = item.name.toLowerCase();
  if (name.includes("custom")) return true;
  return false;
}

function buildBoardExtrasFields(config: CartConfig): BoardCustomizationField[] {
  const extras: CartConfig["extras"] =
    config.extras ?? { edgeProfile: "square", borderRadius: 0, chamferSize: 8, grooveEnabled: false };
  return [
    { label: "Size", value: describeSize(config.size) },
    { label: "Strip layout", value: describeStripLayout(Boolean(config.strip3Enabled)) },
    { label: "Juice groove", value: yesNo(Boolean(extras.grooveEnabled)) },
    { label: "Corner", value: describeCorner(extras) },
    { label: "Edge profile", value: describeEdgeOption(config.edgeOption) },
    { label: "Handle style", value: describeHandle(config.handleStyle) },
    { label: "Brass feet", value: yesNo(Boolean(config.brassFeet)) },
  ];
}

function describeStripLayout(strip3Enabled: boolean): string {
  return strip3Enabled ? "Three strips" : "Two strips";
}

function describeSize(size: CartConfig["size"]): string {
  return SIZE_LABELS[String(size).toLowerCase()] ?? titleCaseWords(String(size));
}

function describeCorner(extras: CartConfig["extras"] | undefined): string {
  if (!extras) return "—";
  switch (extras.edgeProfile) {
    case "roundover":
      return extras.borderRadius ? `Rounded (${extras.borderRadius}px radius)` : "Rounded";
    case "chamfer":
      return extras.chamferSize ? `Chamfer (${extras.chamferSize}px)` : "Chamfer";
    default:
      return "Square";
  }
}

function describeEdgeOption(edgeOption: CartConfig["edgeOption"]): string {
  if (!edgeOption) return "Standard";
  const key = edgeOption.toLowerCase();
  return EDGE_OPTION_LABELS[key] ?? titleCaseWords(edgeOption);
}

function describeHandle(handle: CartConfig["handleStyle"]): string {
  const key = handle ?? "none";
  if (key === "none" || key === "glide" || key === "lift") {
    return HANDLE_LABELS[key];
  }
  return titleCaseWords(String(key));
}

function describeStrips(boardData: CartConfig["boardData"]): BoardCustomizationField[] {
  if (!boardData || !Array.isArray(boardData.strips)) return [];
  return boardData.strips
    .map((strip, idx) => ({
      label: `Strip ${idx + 1}`,
      value: describeStripSequence(strip),
    }))
    .filter(({ value }) => value !== "—");
}

function describeStripSequence(strip: Array<string | null> | undefined): string {
  if (!Array.isArray(strip)) return "—";
  const segments: string[] = [];
  let previous: string | null = null;
  let count = 0;

  const flush = () => {
    if (!previous) return;
    segments.push(count > 1 ? `${previous} ×${count}` : previous);
    previous = null;
    count = 0;
  };

  strip.forEach((token) => {
    const name = tokenToWoodName(token);
    if (!name) return;
    if (name === previous) {
      count += 1;
    } else {
      flush();
      previous = name;
      count = 1;
    }
  });
  flush();

  return segments.length ? segments.join(" • ") : "—";
}

function tokenToWoodName(token: string | null | undefined): string | null {
  if (!token) return null;
  const trimmed = token.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  const byKey = woodByKey[lower];
  if (byKey?.name) return byKey.name;
  if (trimmed.startsWith("#") || trimmed.startsWith("rgb")) return trimmed;
  return titleCaseWords(trimmed.replace(/[_-]+/g, " "));
}

function yesNo(value: boolean): string {
  return value ? "Yes" : "No";
}

function titleCaseWords(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}
