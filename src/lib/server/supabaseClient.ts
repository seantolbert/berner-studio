import "server-only";

import { createClient } from "@supabase/supabase-js";
import { clientEnv, serverEnv } from "../../../env.mjs";

const supabaseUrl = serverEnv.SUPABASE_URL ?? clientEnv.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase configuration for server client");
}

export const supabaseServerClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

export type SupabaseServerClient = typeof supabaseServerClient;
