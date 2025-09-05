export type BoardTemplate = {
  id: string;
  name: string;
  size: "small" | "regular" | "large";
  strip3Enabled: boolean;
  // Wood keys (no nulls per requirements)
  strips: string[][];
  order: { stripNo: number; reflected: boolean }[];
};

// Templates now load from Supabase. The static list was removed.
// See: src/lib/supabase/usage.ts:listTemplates

export const LS_SELECTED_TEMPLATE_KEY = "bb.selectedTemplate";
