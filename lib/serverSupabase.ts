// Server-only: cliente Supabase de backend com privilégios de serviço.
// Prioridade 1: SUPABASE_SERVICE_ROLE_KEY (padrão de mercado, bypass de RLS server-side, sem login por senha)
// Prioridade 2: Fallback retrocompatível para PAINEL_EMAIL / PAINEL_PW via auth.signInWithPassword
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

function criaClient(key: string) {
  return createClient(SUPABASE_URL, key, {
    db: { schema: "maquina_sites" },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

type ClientType = ReturnType<typeof criaClient>;

let serviceClientCached: ClientType | null = null;
let userClientCached: ClientType | null = null;
let userClientCachedAt = 0;

export async function serverSupabase(): Promise<ClientType> {
  if (!SUPABASE_URL) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_URL nao configurado no servidor");
  }

  // 1. Caminho Principal: Service Role Key (robusto, seguro, sem dependência de senha de usuário)
  if (SERVICE_ROLE_KEY) {
    if (!serviceClientCached) {
      serviceClientCached = criaClient(SERVICE_ROLE_KEY);
    }
    return serviceClientCached;
  }

  // 2. Fallback Retrocompatível: Login por senha caso SERVICE_ROLE_KEY ainda não esteja setada
  if (!SUPABASE_ANON) {
    throw new Error("Nem SUPABASE_SERVICE_ROLE_KEY nem SUPABASE_ANON_KEY estao disponiveis");
  }

  const email = process.env.PAINEL_EMAIL;
  const password = process.env.PAINEL_PW;
  if (!email || !password) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY nao configurada e credenciais PAINEL_EMAIL/PAINEL_PW ausentes");
  }

  if (userClientCached && Date.now() - userClientCachedAt < 45 * 60 * 1000) {
    return userClientCached;
  }

  const client = criaClient(SUPABASE_ANON);
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error("Auth server fallback falhou: " + error.message);
  }

  userClientCached = client;
  userClientCachedAt = Date.now();
  return client;
}

export const STORAGE_URL = SUPABASE_URL.replace(/\/$/, "") + "/storage/v1/object/public/client-uploads/";
