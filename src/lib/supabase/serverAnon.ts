import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client using the public anon key.
// Safe for SSR reads with RLS enforcing access.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

export const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

