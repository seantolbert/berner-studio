export { type BoardTemplate } from "@/types/board";

// Templates now load from Supabase. The static list was removed.
// See: src/lib/supabase/usage.ts:listTemplates

export const LS_SELECTED_TEMPLATE_KEY = "bb.selectedTemplate";
