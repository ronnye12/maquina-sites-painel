"use client";
import { createClient } from "@supabase/supabase-js";

// A chave anon e publica por design; o acesso aos dados e protegido por RLS (so usuario logado le).
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.warn("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY nao configurados.");
}

export const supabase = createClient(SUPABASE_URL || "http://localhost", SUPABASE_ANON || "anon", {
  db: { schema: "maquina_sites" },
  auth: { persistSession: true, autoRefreshToken: true },
});
