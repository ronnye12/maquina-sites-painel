"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
    setLoading(false);
    if (error) { setErro("Email ou senha incorretos."); return; }
    router.replace("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={entrar} className="w-full max-w-sm bg-[#161922] border border-[#222632] rounded-2xl p-8">
        <h1 className="text-xl font-semibold mb-1">Máquina de Sites</h1>
        <p className="text-sm text-[#8b93a5] mb-6">Painel de leads e funil</p>
        <label className="block text-xs uppercase tracking-wide text-[#8b93a5] mb-1">Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
          className="w-full bg-[#0f1115] border border-[#2a2f3a] rounded-lg px-3 py-2.5 mb-4 outline-none" />
        <label className="block text-xs uppercase tracking-wide text-[#8b93a5] mb-1">Senha</label>
        <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required
          className="w-full bg-[#0f1115] border border-[#2a2f3a] rounded-lg px-3 py-2.5 mb-5 outline-none" />
        {erro && <p className="text-sm text-red-400 mb-4">{erro}</p>}
        <button type="submit" disabled={loading}
          className="w-full bg-white text-[#0f1115] font-semibold rounded-lg py-2.5 disabled:opacity-60">
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
