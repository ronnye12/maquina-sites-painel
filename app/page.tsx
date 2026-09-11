"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { CSS } from "@/lib/css";
import { Lead, Solicitacao, Onboarding, MetricaDia, PAISES, MOEDA, PAIS_LABEL } from "@/lib/tipos";
import Dashboard, { salvarRitualSemana } from "./components/Dashboard";
import Kanban from "./components/Kanban";
import Clientes from "./components/Clientes";
import Solicitacoes from "./components/Solicitacoes";

type Aba = "dash" | "DE" | "UK" | "UKH" | "BR" | "clientes" | "solicitacoes";

export default function Painel() {
  const router = useRouter();
  const [aba, setAba] = useState<Aba>("dash");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [onboardings, setOnboardings] = useState<Onboarding[]>([]);
  const [metricas, setMetricas] = useState<MetricaDia[]>([]);
  const [ritual, setRitual] = useState<{ semana: string; ajuste: string | null } | null>(null);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    const [l, s, o, m, r] = await Promise.all([
      supabase.from("leads").select("*").order("created_at", { ascending: false }),
      supabase.from("solicitacoes").select("*").order("criado_em", { ascending: false }),
      supabase.from("onboarding").select("*"),
      supabase.from("metricas_diarias").select("*").order("dia", { ascending: false }).limit(120),
      supabase.from("ritual_semanal").select("*").order("semana", { ascending: false }).limit(1),
    ]);
    const leadsData = (l.data as Lead[]) || [];
    setLeads(leadsData);
    const porId = new Map(leadsData.map(x => [x.id, x]));
    setSolicitacoes(((s.data as Solicitacao[]) || []).map(x => ({
      ...x,
      empresa: porId.get(x.lead_id)?.empresa,
      pais: porId.get(x.lead_id)?.pais,
    })));
    setOnboardings((o.data as Onboarding[]) || []);
    setMetricas((m.data as MetricaDia[]) || []);
    setRitual((r.data?.[0] as { semana: string; ajuste: string | null }) || null);
    setCarregando(false);
  }, []);

  useEffect(() => {
    let ativo = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!ativo) return;
      if (!data.session) { router.replace("/login"); return; }
      carregar();
    });
    return () => { ativo = false; };
  }, [router, carregar]);

  async function sair() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  // métricas do header (globais)
  const fechados = leads.filter(l => ["fechado", "publicado"].includes(l.status)).length;
  const assinaturas = leads.filter(l => l.status === "assinatura_ativa").length;
  const mrr = leads.filter(l => l.status === "assinatura_ativa")
    .reduce((s, l) => s + (MOEDA[l.pais || "DE"]?.mensal || 39), 0);
  const receita = leads.filter(l => l.pago)
    .reduce((s, l) => s + (l.valor || MOEDA[l.pais || "DE"]?.unica || 0), 0);
  const abertas = solicitacoes.filter(s => s.status !== "concluida").length;

  const nPais = (p: string) => leads.filter(l => (l.pais || "BR") === p && l.status !== "descartado").length;

  if (carregando) return (
    <><style>{CSS}</style>
    <div className="loading-screen"><div className="dots"><span /><span /><span /></div></div></>
  );

  return (
    <>
      <style>{CSS}</style>
      <div className="root">
        <header className="header">
          <div className="header-brand">
            <span className="header-title">Maquina de Sites</span>
            <span className="header-badge">HQ</span>
          </div>
          <div className="metrics">
            {([
              { label: "Receita única", val: `€ ${receita.toLocaleString("de-DE")}`, bg: "#fef9c3", fg: "#a16207" },
              { label: "MRR", val: `€ ${mrr.toLocaleString("de-DE")}`, bg: "#ccfbf1", fg: "#0f766e" },
              { label: "Fechados", val: String(fechados + assinaturas), bg: "#dbeafe", fg: "#1d4ed8" },
              { label: "Solicitações", val: String(abertas), bg: abertas ? "#ffedd5" : "#f1f5f9", fg: abertas ? "#c2410c" : "#334155" },
            ] as const).map(m => (
              <div className="metric" key={m.label} style={{ background: m.bg }}>
                <span className="metric-label">{m.label}</span>
                <span className="metric-value" style={{ color: m.fg }}>{m.val}</span>
              </div>
            ))}
          </div>
          <div className="header-actions">
            <button className="btn-ghost" onClick={carregar}>Atualizar</button>
            <button className="btn-ghost" onClick={sair}>Sair</button>
          </div>
        </header>

        <nav className="nav-tabs">
          <button className={`nav-tab${aba === "dash" ? " nav-tab--on" : ""}`} onClick={() => setAba("dash")}>
            Análise
          </button>
          {PAISES.map(p => (
            <button key={p} className={`nav-tab${aba === p ? " nav-tab--on" : ""}`} onClick={() => setAba(p)}>
              Funil {PAIS_LABEL[p] || p}<span className="n">{nPais(p)}</span>
            </button>
          ))}
          <button className={`nav-tab${aba === "clientes" ? " nav-tab--on" : ""}`} onClick={() => setAba("clientes")}>
            Clientes<span className="n">{fechados + assinaturas}</span>
          </button>
          <button className={`nav-tab${aba === "solicitacoes" ? " nav-tab--on" : ""}`} onClick={() => setAba("solicitacoes")}>
            Solicitações{abertas > 0 && <span className="n" style={{ background: "#ffedd5", color: "#c2410c" }}>{abertas}</span>}
          </button>
        </nav>

        {aba === "dash" && (
          <Dashboard
            leads={leads} metricas={metricas} ritual={ritual}
            onSalvarRitual={async a => { await salvarRitualSemana(a); carregar(); }}
          />
        )}
        {(aba === "DE" || aba === "UK" || aba === "UKH" || aba === "BR") && (
          <Kanban leads={leads.filter(l => (l.pais || "BR") === aba)} onChange={carregar} />
        )}
        {aba === "clientes" && <Clientes leads={leads} onboardings={onboardings} />}
        {aba === "solicitacoes" && <Solicitacoes solicitacoes={solicitacoes} onChange={carregar} />}
      </div>
    </>
  );
}
