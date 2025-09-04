"use client";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Intentionally silent in production; devs see console warning
  if (typeof window !== "undefined") {
    console.warn("Supabase env vars are missing. Set SUPABASE_URL and SUPABASE_ANON_KEY.");
  }
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");

