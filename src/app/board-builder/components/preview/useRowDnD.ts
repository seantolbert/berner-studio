// Only types are used elsewhere; the DnD hook was unused.
export type Size = "small" | "regular" | "large";
export type RowOrder = { stripNo: number; reflected: boolean };
export type RowDnDParams = {
  order: RowOrder[];
  size: Size;
  onReorder?: (nextOrder: RowOrder[]) => void;
};
