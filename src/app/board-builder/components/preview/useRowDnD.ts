// Only type exports remain; the DnD implementation was removed.
import type { BoardRowOrder, BoardSize } from "@/types/board";

export type Size = BoardSize;
export type RowOrder = BoardRowOrder;
export type RowDnDParams = {
  order: RowOrder[];
  size: Size;
  onReorder?: (nextOrder: RowOrder[]) => void;
};
