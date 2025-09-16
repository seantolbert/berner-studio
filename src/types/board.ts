export type BoardSize = "small" | "regular" | "large";

export type BoardRowOrder = {
  stripNo: number;
  reflected: boolean;
};

export type BoardStrips = Array<Array<string | null>>;

export type BoardLayout = {
  strips: BoardStrips;
  order: BoardRowOrder[];
};

export type BoardTemplate = {
  id: string;
  name: string;
  size: BoardSize;
  strip3Enabled: boolean;
  strips: BoardStrips;
  order: BoardRowOrder[];
};

export type BoardExtras = {
  edgeProfile: "square" | "roundover" | "chamfer";
  borderRadius: number;
  chamferSize: number;
  grooveEnabled: boolean;
};

export type BuilderWood = {
  key: string;
  name: string | null;
  color: string;
  enabled: boolean;
  price_per_stick: number | null;
};
