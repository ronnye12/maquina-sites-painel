// Server-only: cliente Supabase autenticado (anon key + login com usuario do painel).
// Credenciais via variaveis de ambiente (PAINEL_EMAIL / PAINEL_PW).
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

function criaClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON) throw new Error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY nao configurados");
  return createClient(SUPABASE_URL, SUPABASE_ANON, {
    db: { schema: "maquina_sites" },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

let cached: ReturnType<typeof criaClient> | null = null;
let cachedAt = 0;

export async function serverSupabase() {
  // reusa sessão por até 45 min (invocações mornas da mesma lambda)
  if (cached && Date.now() - cachedAt < 45 * 60 * 1000) return cached;

  const client = criaClient();

  const email = process.env.PAINEL_EMAIL;
  const password = process.env.PAINEL_PW;
  if (!email || !password) throw new Error("PAINEL_EMAIL/PAINEL_PW nao configurados");

  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error("Auth server falhou: " + error.message);

  cached = client;
  cachedAt = Date.now();
  return client;
}

export const STORAGE_URL = SUPABASE_URL + "/storage/v1/object/public/client-uploads/";
