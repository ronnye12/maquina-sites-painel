"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { CSS } from "@/lib/css";
import { Lead, Solicitacao, Onboarding, MetricaDia, PAISES, MOEDA, PAIS_LABEL, COLS, isTesteLead } from "@/lib/tipos";
import Dashboard, { salvarRitualSemana } from "./components/Dashboard";
import Kanban from "./components/Kanban";
import Clientes from "./components/Clientes";
import Solicitacoes from "./components/Solicitacoes";

type Aba = "dash" | "DE" | "UK" | "UKH" | "BR" | "clientes" | "solicitacoes" | "automacoes" | "financeiro";

type Run = { rotina: string; started_at: string | null; finished_at: string | null; status: string; itens_processados: number; falhas?: number | null; erro: string | null; cron_expr: string | null; duracao_ms?: number | null };
type Ag = { rotina: string; cron_expr: string | null; instalado: boolean; habilitado: boolean; atualizado_em: string | null };
type Estado = { rotina: string; started_at: string | null; finished_at: string | null; status: string | null; itens_processados: number | null; falhas: number | null; erro: string | null; run_cron_expr: string | null; duracao_ms: number | null; ag_cron_expr: string | null; instalado: boolean | null; habilitado: boolean | null; atualizado_em: string | null };

const STALE_MS = 48 * 3600 * 1000; // 48h sem run => tratar como obsoleta (não "Ativa")

function isStale(iso: string | null): boolean {
  if (!iso) return true;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return true;
  return Date.now() - t > STALE_MS;
}

function AutomacoesView() {
  const [runs, setRuns] = useState<Run[] | null>(null);
  const [ags, setAgs] = useState<Ag[] | null>(null);
  const [estados, setEstados] = useState<Estado[] | null>(null);
  const [erroRuns, setErroRuns] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    // Fonte verificável: v_automacao_estado quando existir, fallback v_automacao_ultima
    supabase.from("v_automacao_estado").select("*").then(({ data, error }) => {
      if (!ativo) return;
      if (!error && data) { setEstados(data as Estado[]); setRuns(data as unknown as Run[]); setAgs(data as unknown as Ag[]); return; }
      // fallback antes da migration estendida
      supabase.from("v_automacao_ultima").select("*").then(({ data: d2, error: e2 }) => {
        if (!ativo) return;
        if (e2) { setErroRuns(e2.message); setRuns([]); setAgs([]); setEstados([]); return; }
        setRuns((d2 as Run[]) || []);
        setAgs([]);
        setEstados(null);
      });
      if (error && String(error.message).includes("does not exist")) {
        // sem v_automacao_estado ainda, não é erro operacional
        setErroRuns(null);
      } else if (error) {
        setErroRuns(error.message);
      }
    });
    // também tentar ler agendamentos isoladamente para estados quando v_automacao_estado não existir
    supabase.from("automacao_agendamentos").select("*").then(({ data, error }) => {
      if (!ativo || error || !data) return;
      setAgs(data as Ag[]);
    });
    return () => { ativo = false; };
  }, []);

  const porRotina = useMemo(() => new Map((runs || []).map(r => [r.rotina, r])), [runs]);
  const porAg = useMemo(() => new Map((ags || []).map(a => [a.rotina, a])), [ags]);
  const porEstado = useMemo(() => (estados ? new Map(estados.map(e => [e.rotina, e])) : null), [estados]);

  const rotinas: { key: string; nome: string; desc: string; cron: string; detalhe: string; estadoBase: string }[] = [
    { key: "prospectar_de prospectar_uk", nome: "Prospecção diária", desc: "Busca novos leads com site ruim e email público", cron: "0 5 * * * (proposto)", detalhe: "Thomson Local / 11880 + dedupe. Estado só confirma após migration + run.", estadoBase: "Preparada" },
    { key: "qualificacao", nome: "Qualificação", desc: "Filtra lista antes de gastar crédito de imagem", cron: "sob demanda (proposto)", detalhe: "prospectar_uk_qualificado --qualificados-only. Desativado até aprovar.", estadoBase: "Preparada" },
    { key: "disparo_de disparo_uk", nome: "Envio de e-mails", desc: "Opener e cadência do funil", cron: "0 8 * * * (proposto)", detalhe: "Brevo + ensure_* + teto. FU3 permanecerá desativado até aprovação.", estadoBase: "Preparada" },
    { key: "followup_de_1 followup_uk_1 followup_de_2 followup_uk_2 followup_de_3 followup_uk_3", nome: "Acompanhamentos FU1 · FU2 · FU3", desc: "Follow-ups automáticos (FU3 desativado até aprovação)", cron: "45 9 / 15 10 / 45 10 (proposto)", detalhe: "FU1 2d, FU2 4d. FU3 existe mas ficará comentado no cron até autorizar.", estadoBase: "Preparada" },
    { key: "monitor_de monitor_uk monitor_aberturas", nome: "Monitoramento de respostas", desc: "Classifica resposta e avisa no Telegram", cron: "*/15 e */30 (proposto)", detalhe: "Gmail + Brevo opens. Desativado até instalar.", estadoBase: "Preparada" },
    { key: "digest_matinal metricas_diarias", nome: "Relatórios diários", desc: "Métricas e ritual semanal", cron: "30 6 / 45 6 (proposto)", detalhe: "metricas_diarias + digest. Métricas filtram TEST.", estadoBase: "Preparada" },
  ];

  const chip = (keys: string, estadoBase: string) => {
    const parts = keys.split(" ");
    const rs = parts.map(k => porRotina.get(k)).filter(Boolean) as Run[];
    // Fonte verificável: agendamento instalado/habilitado
    const agsDoGrupo = parts.map(k => porAg.get(k)).filter(Boolean) as Ag[];
    const temAg = agsDoGrupo.length > 0;
    const instalado = temAg && agsDoGrupo.some(a => a.instalado);
    const habilitado = temAg && agsDoGrupo.some(a => a.habilitado);
    if (erroRuns) return { bg: "#f1f5f9", fg: "#64748b", bd: "#e2e8f0", t: "Dados indisponíveis" };
    if (!runs) return { bg: "#f1f5f9", fg: "#64748b", bd: "#e2e8f0", t: "Carregando…" };
    if (rs.length === 0) {
      if (temAg && instalado && habilitado) return { bg: "#fef9c3", fg: "#92400e", bd: "#fde68a", t: "Instalada (sem execução)" };
      if (temAg && instalado && !habilitado) return { bg: "#f1f5f9", fg: "#64748b", bd: "#e2e8f0", t: "Instalada e desativada" };
      return estadoBase === "Preparada"
        ? { bg: "#fef9c3", fg: "#92400e", bd: "#fde68a", t: "Preparada" }
        : { bg: "#fef9c3", fg: "#92400e", bd: "#fde68a", t: "Não configurada" };
    }
    // erro tem prioridade, mesmo stale (mas só se houve run)
    if (rs.some(r => r.status === "erro" && !isStale(r.started_at))) return { bg: "#fef2f2", fg: "#dc2626", bd: "#fecaca", t: "Erro" };
    if (rs.some(r => r.status === "erro")) return { bg: "#fef2f2", fg: "#dc2626", bd: "#fecaca", t: "Erro (em execução anterior)" };
    // Em execução: started recente e sem finished
    if (rs.some(r => r.finished_at == null && r.started_at && !isStale(r.started_at))) return { bg: "#dbeafe", fg: "#1d4ed8", bd: "#bfdbfe", t: "Em execução" };
    // Ativa SOMENTE se comprovadamente instalado e habilitado na fonte verificável e com ok recente.
    // Uma execução manual ou fictícia NUNCA torna a rotina Ativa.
    const okRecente = rs.some(r => r.status === "ok" && !isStale(r.started_at));
    if (okRecente) {
      if (temAg && instalado && habilitado) {
        return { bg: "#dcfce7", fg: "#15803d", bd: "#bbf7d0", t: "Ativa" };
      }
      if (temAg && instalado && !habilitado) {
        return { bg: "#f1f5f9", fg: "#64748b", bd: "#e2e8f0", t: "Instalada e desativada" };
      }
      return { bg: "#fef9c3", fg: "#92400e", bd: "#fde68a", t: "Preparada (execução manual)" };
    }
    if (rs.some(r => r.status === "ok")) return { bg: "#f1f5f9", fg: "#64748b", bd: "#e2e8f0", t: "Desativada (última obsoleta)" };
    if (rs.some(r => r.status === "skip")) return { bg: "#f1f5f9", fg: "#64748b", bd: "#e2e8f0", t: "Desativada" };
    return { bg: "#f1f5f9", fg: "#64748b", bd: "#e2e8f0", t: "Desativada" };
  };

  return (
    <div className="dash">
      <div className="panel">
        <div className="panel-head">
          <div>
            <div className="panel-title">Automações</div>
            <div className="panel-sub">Estado real via maquina_sites.v_automacao_estado (agendamento instalado/habilitado + última execução). Run antiga ou manual não implica Ativa. Somente leitura.</div>
          </div>
          <span className="topbar-badge">Somente leitura</span>
        </div>
        {erroRuns && <div className="alerta" style={{ marginBottom: 12 }}>Dados indisponíveis: {erroRuns}. Verifique migration e permissões (view só para authenticated).</div>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
          {rotinas.map(r => {
            const c = chip(r.key, r.estadoBase);
            const keys = r.key.split(" ");
            const rs = keys.map(k => porRotina.get(k)).filter(Boolean) as Run[];
            const last = rs.sort((a,b) => new Date(b.started_at || 0).getTime() - new Date(a.started_at || 0).getTime())[0];
            const stale = last ? isStale(last.started_at) : false;
            return (
              <div key={r.nome} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
                  <div style={{ fontSize: 13, fontWeight: 750, color: "#0f172a", letterSpacing: "-.01em" }}>{r.nome}</div>
                  <span className="tag" style={{ background: c.bg, color: c.fg, borderColor: c.bd, fontWeight: 700, border: "1px solid " + c.bd } as React.CSSProperties}>{c.t}</span>
                </div>
                <div style={{ fontSize: 12.5, color: "#64748b", lineHeight: 1.5 }}>{r.desc}</div>
                <div style={{ fontSize: 11.5, color: "#94a3b8", lineHeight: 1.5, background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 10, padding: "8px 10px" }}>{r.detalhe}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 2, flexWrap: "wrap" }}>
                  {(() => {
                    const agsDoGrupo = r.key.split(" ").map(k => porAg.get(k)).filter(Boolean) as Ag[];
                    const ag = agsDoGrupo.sort((a,b)=> (a.cron_expr||"").localeCompare(b.cron_expr||""))[0];
                    const horario = ag?.instalado ? `Instalado: ${ag.cron_expr || r.cron}` : `Proposto: ${r.cron}`;
                    return <span className="tag tag--muted">{horario}</span>;
                  })()}
                  <span className="tag tag--muted">Última: {last?.started_at ? new Date(last.started_at).toLocaleString("pt-BR") + (stale ? " · obsoleta" : "") : "—"}</span>
                  <span className="tag tag--muted">Itens: {last ? String(last.itens_processados ?? "—") : "—"}</span>
                  {last?.status === "skip" && <span className="tag tag--muted">skip: {last?.erro ? last.erro.slice(0,60) : "desativada"}</span>}
                </div>
                {last?.erro && last.status !== "skip" && <div style={{ fontSize: 11, color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "8px 10px" }}>{last.erro.slice(0,300)}</div>}
                {last?.erro && last.status === "skip" && last.erro.length > 60 && <div style={{ fontSize: 11, color: "#64748b", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 10px" }}>{last.erro.slice(0,300)}</div>}
              </div>
            );
          })}
        </div>
      </div>
      <div className="empty-state">
        <div className="empty-state-icon">◷</div>
        <div className="empty-state-title">Telemetria: {erroRuns ? "dados indisponíveis" : runs === null ? "carregando…" : (runs.length === 0 && (ags?.length ?? 0) === 0) ? "sem dados — Preparada até migration + primeira execução" : `${runs.length} rotinas com última execução${(ags?.length ?? 0) > 0 ? ` · ${ags!.length} agendamentos registrados` : ""}`}</div>
        <div className="empty-state-sub">Fonte: maquina_sites.v_automacao_estado (migration não aplicada: fallback v_automacao_ultima). Ativa exige agendamento instalado+habilitado e execução recente. Horários propostos ≠ instalados.</div>
      </div>
    </div>
  );
}

function FinanceiroView({ leads, solicitacoes }: { leads: Lead[]; solicitacoes: Solicitacao[] }) {
  const comerciais = leads.filter(l => !isTesteLead(l));
  const testes = leads.filter(l => isTesteLead(l));
  const pagos = comerciais.filter(l => l.pago);
  const assinaturas = comerciais.filter(l => l.status === "assinatura_ativa");
  const canceladas = comerciais.filter(l => l.status === "assinatura_cancelada");
  const mrr = assinaturas.reduce((s, l) => s + (MOEDA[l.pais || "DE"]?.mensal || 39), 0);
  const receita = pagos.reduce((s, l) => s + (l.valor || MOEDA[l.pais || "DE"]?.unica || 0), 0);
  const semOnboarding = comerciais.filter(l => (l.status === "fechado" || l.status === "assinatura_ativa" || l.status === "publicado") && !l.pago).length;
  const receitaTestes = testes.filter(l => l.pago).reduce((s, l) => s + (l.valor || 0), 0);
  return (
    <div className="dash">
      <div className="dash-grid">
        <div className="kpi"><div className="kpi-label">Pagamentos únicos</div><div className="kpi-value">£/€ {receita.toLocaleString("de-DE")}</div><div className="kpi-sub">{pagos.length} pagos · cota única</div></div>
        <div className="kpi"><div className="kpi-label">Assinaturas ativas</div><div className="kpi-value">{assinaturas.length}</div><div className="kpi-sub">MRR £/€ {mrr.toLocaleString("de-DE")}/mês</div></div>
        <div className="kpi"><div className="kpi-label">Canceladas</div><div className="kpi-value">{canceladas.length}</div><div className="kpi-sub">assinatura_cancelada</div></div>
        <div className="kpi"><div className="kpi-label">Solicitações</div><div className="kpi-value">{solicitacoes.filter(s => s.status !== "concluida").length}</div><div className="kpi-sub">{solicitacoes.length} no total</div></div>
      </div>

      <div className="panel-grid2">
        <div className="panel">
          <div className="panel-title">Planos</div>
          <div className="panel-sub">Visualização profissional. Valores vêm de MOEDA por país. Sem credenciais no frontend.</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="cp-plan cp-plan--hi" style={{ padding: 16 }}>
              <div className="cp-plan-name">Cota única</div>
              <div className="cp-plan-price">£445 <small>pagamento único</small></div>
              <div className="cp-plan-desc">Site entregue. Cliente paga uma vez.</div>
            </div>
            <div className="cp-plan" style={{ padding: 16 }}>
              <div className="cp-plan-name">Assinatura</div>
              <div className="cp-plan-price">£39 <small>/mês</small></div>
              <div className="cp-plan-desc">Cancelável. 1 atualização a cada 3 meses.</div>
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: 11.5, color: "#94a3b8", background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 10, padding: "10px 12px", lineHeight: 1.5 }}>
            UK/UKH/DE têm preços por funil via env. Links de checkout só aparecem na área do cliente quando NEXT_PUBLIC_CHECKOUT_* estiver configurado.
          </div>
        </div>
        <div className="panel">
          <div className="panel-title">Status financeiro no CRM</div>
          <div className="panel-sub">Baseado em leads comerciais (testes Stripe isolados). Sem métricas inventadas.</div>
          <table className="table">
            <tbody>
              <tr><td style={{ fontWeight: 650 }}>Pagos (pago=true) · comerciais</td><td className="num">{pagos.length}</td></tr>
              <tr><td style={{ fontWeight: 650 }}>Assinatura ativa · comercial</td><td className="num">{assinaturas.length}</td></tr>
              <tr><td style={{ fontWeight: 650 }}>Publicados · comercial</td><td className="num">{comerciais.filter(l => l.status === "publicado").length}</td></tr>
              <tr><td style={{ fontWeight: 650 }}>Fechados sem pago marcado</td><td className="num">{semOnboarding}</td></tr>
              <tr><td style={{ fontWeight: 650 }}>MRR estimado · comercial</td><td className="num">€ {mrr.toLocaleString("de-DE")}</td></tr>
              {testes.length > 0 && (
                <>
                  <tr><td colSpan={2} style={{ fontSize: 11, color: "#94a3b8", paddingTop: 10, borderTop: "1px dashed #e2e8f0" }}>Registros de teste (não contam no comercial)</td></tr>
                  <tr><td style={{ fontWeight: 650, color: "#64748b" }}>Testes pagos</td><td className="num" style={{ color: "#64748b" }}>{testes.filter(l => l.pago).length}</td></tr>
                  <tr><td style={{ fontWeight: 650, color: "#64748b" }}>Valor testes</td><td className="num" style={{ color: "#64748b" }}>€/£ {receitaTestes.toLocaleString("de-DE")}</td></tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">Entrega</div>
        <div className="panel-sub">Briefing → Produção → Aprovação → Publicação. Dados comerciais (testes isolados).</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
          {[
            { k: "Briefing", v: `${comerciais.filter(l => l.status === "fechado" || l.status === "assinatura_ativa").length} cliente(s) aguardando briefing` },
            { k: "Produção", v: `${comerciais.filter(l => l.status === "construido" || l.status === "liberado").length} site(s) em produção/iscas` },
            { k: "Aprovação", v: `${comerciais.filter(l => l.status === "respondeu" || l.status === "negociando").length} em negociação` },
            { k: "Publicação", v: `${comerciais.filter(l => l.status === "publicado").length} publicado(s)` },
          ].map(s => (
            <div key={s.k} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 14, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: "#64748b" }}>{s.k}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginTop: 6, lineHeight: 1.4 }}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Painel() {
  const router = useRouter();
  const [aba, setAba] = useState<Aba>("dash");
  const [mobileOpen, setMobileOpen] = useState(false);
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

  const comerciaisHeader = useMemo(() => leads.filter(l => !isTesteLead(l)), [leads]);
  const fechados = useMemo(() => comerciaisHeader.filter(l => ["fechado", "publicado"].includes(l.status)).length, [comerciaisHeader]);
  const assinaturas = useMemo(() => comerciaisHeader.filter(l => l.status === "assinatura_ativa").length, [comerciaisHeader]);
  const mrr = useMemo(() => comerciaisHeader.filter(l => l.status === "assinatura_ativa").reduce((s, l) => s + (MOEDA[l.pais || "DE"]?.mensal || 39), 0), [comerciaisHeader]);
  const receita = useMemo(() => comerciaisHeader.filter(l => l.pago).reduce((s, l) => s + (l.valor || MOEDA[l.pais || "DE"]?.unica || 0), 0), [comerciaisHeader]);
  const testesCount = useMemo(() => leads.filter(l => isTesteLead(l)).length, [leads]);
  const abertas = useMemo(() => solicitacoes.filter(s => s.status !== "concluida").length, [solicitacoes]);
  const nPais = useCallback((p: string) => comerciaisHeader.filter(l => (l.pais || "BR") === p && l.status !== "descartado").length, [comerciaisHeader]);

  const titulo = useMemo(() => {
    if (aba === "dash") return { t: "Análise", s: "Visão geral por país, funil acumulado e números-gatilho da semana.", badge: "HQ" };
    if (aba === "clientes") return { t: "Clientes", s: "Quem pagou ou assinou, com onboarding e domínio.", badge: `${fechados + assinaturas} clientes` };
    if (aba === "solicitacoes") return { t: "Solicitações", s: "Pedidos da área do cliente. Responder aqui reflete na área /c/{token}.", badge: `${abertas} abertas` };
    if (aba === "automacoes") return { t: "Automações", s: "Estado verdadeiro de cada rotina. Sem botões fictícios.", badge: "Somente leitura" };
    if (aba === "financeiro") return { t: "Pagamentos & Entrega", s: "Cota única, assinaturas, status financeiro e fluxo de entrega.", badge: "£445 · £39/mês" };
    return { t: `Funil ${PAIS_LABEL[aba] || aba}`, s: `Kanban ${aba} · ${COLS.length} etapas · filtros por país preservados.`, badge: `${nPais(aba)} leads` };
  }, [aba, fechados, assinaturas, abertas, nPais]);

  function navTo(next: Aba) { setAba(next); setMobileOpen(false); }

  if (carregando) return (
    <><style>{CSS}</style>
    <div className="loading-screen"><div className="dots"><span /><span /><span /></div></div></>
  );

  return (
    <>
      <style>{CSS}</style>
      <div className="app-shell">
        <aside className={`sidebar${mobileOpen ? " sidebar--open" : ""}`}>
          <div className="sidebar-brand">
            <div className="sidebar-logo">MS</div>
            <div>
              <div className="sidebar-title">Máquina de Sites</div>
              <div className="sidebar-sub">Internacional · Engaje Web</div>
            </div>
          </div>
          <nav className="sidebar-nav">
            <div className="sidebar-section">Principal</div>
            <button className={`sidebar-item${aba === "dash" ? " sidebar-item--on" : ""}`} onClick={() => navTo("dash")}>
              <span className="sidebar-dot" style={{ color: "#3b82f6", background: "#3b82f6" }} />
              Análise
              <span className="sidebar-count">{comerciaisHeader.length}</span>
            </button>

            <div className="sidebar-section">Funil de vendas</div>
            {PAISES.map(p => (
              <button key={p} className={`sidebar-item${aba === p ? " sidebar-item--on" : ""}`} onClick={() => navTo(p as Aba)}>
                <span className="sidebar-dot" style={{ color: p === "DE" ? "#f59e0b" : p === "UK" ? "#3b82f6" : p === "UKH" ? "#ec4899" : "#10b981", background: p === "DE" ? "#f59e0b" : p === "UK" ? "#3b82f6" : p === "UKH" ? "#ec4899" : "#10b981" }} />
                Funil {PAIS_LABEL[p] || p}
                <span className="sidebar-count">{nPais(p)}</span>
              </button>
            ))}

            <div className="sidebar-section">Gestão</div>
            <button className={`sidebar-item${aba === "clientes" ? " sidebar-item--on" : ""}`} onClick={() => navTo("clientes")}>
              <span className="sidebar-dot" style={{ color: "#10b981", background: "#10b981" }} />
              Clientes
              <span className="sidebar-count">{fechados + assinaturas}</span>
            </button>
            <button className={`sidebar-item${aba === "solicitacoes" ? " sidebar-item--on" : ""}`} onClick={() => navTo("solicitacoes")}>
              <span className="sidebar-dot" style={{ color: "#f97316", background: "#f97316" }} />
              Solicitações
              <span className="sidebar-count" style={abertas ? { background: "rgba(249,115,22,.18)", borderColor: "rgba(249,115,22,.28)", color: "#fb923c" } : undefined}>{abertas}</span>
            </button>

            <div className="sidebar-section">Sistema</div>
            <button className={`sidebar-item${aba === "automacoes" ? " sidebar-item--on" : ""}`} onClick={() => navTo("automacoes")}>
              <span className="sidebar-dot" style={{ color: "#8b5cf6", background: "#8b5cf6" }} />
              Automações
            </button>
            <button className={`sidebar-item${aba === "financeiro" ? " sidebar-item--on" : ""}`} onClick={() => navTo("financeiro")}>
              <span className="sidebar-dot" style={{ color: "#06b6d4", background: "#06b6d4" }} />
              Pagamentos & entrega
            </button>
          </nav>
          <div className="sidebar-foot">
            <div style={{ flex: 1 }}>
              <div className="sidebar-foot-note"><b>{fechados + assinaturas}</b> fechados · <b>€ {receita.toLocaleString("de-DE")}</b> receita</div>
              <div className="sidebar-foot-note">MRR <b>€ {mrr.toLocaleString("de-DE")}</b></div>
            </div>
            <button className="btn-sidebar-ghost" onClick={sair} style={{ width: "auto", whiteSpace: "nowrap" }}>Sair</button>
          </div>
        </aside>
        <div className={`sidebar-overlay${mobileOpen ? " sidebar-overlay--on" : ""}`} onClick={() => setMobileOpen(false)} />

        <div className="main">
          <header className="topbar">
            <button className="hamburger" aria-label="Abrir menu" onClick={() => setMobileOpen(v => !v)}><span /></button>
            <div className="topbar-left">
              <div className="topbar-title">{titulo.t} <span className="topbar-badge">{titulo.badge}</span></div>
              <div className="topbar-sub">{titulo.s}</div>
            </div>
            <div className="metric-strip" style={{ marginLeft: "auto" }}>
              <div className="metric-chip"><span className="metric-chip-dot" style={{ background: "#a16207" }} /><span><div className="metric-chip-label">Receita única</div><div className="metric-chip-value">€ {receita.toLocaleString("de-DE")}</div></span></div>
              <div className="metric-chip"><span className="metric-chip-dot" style={{ background: "#0f766e" }} /><span><div className="metric-chip-label">MRR</div><div className="metric-chip-value">€ {mrr.toLocaleString("de-DE")}</div></span></div>
              <div className="metric-chip"><span className="metric-chip-dot" style={{ background: "#1d4ed8" }} /><span><div className="metric-chip-label">Fechados</div><div className="metric-chip-value">{fechados + assinaturas}</div></span></div>
              <div className="metric-chip" style={abertas ? { borderColor: "#fed7aa", background: "#fff7ed" } : undefined}><span className="metric-chip-dot" style={{ background: abertas ? "#c2410c" : "#64748b" }} /><span><div className="metric-chip-label">Solicitações</div><div className="metric-chip-value" style={abertas ? { color: "#c2410c" } : undefined}>{abertas}</div></span></div>
            </div>
            <div className="topbar-actions">
              <button className="btn-ghost" onClick={carregar}>Atualizar</button>
              <button className="btn-ghost btn-ghost--primary" onClick={() => navTo("financeiro")}>Ver pagamentos</button>
            </div>
          </header>

          <div className="content">
            {aba === "dash" && (
              <Dashboard leads={leads} metricas={metricas} ritual={ritual} onSalvarRitual={async a => { await salvarRitualSemana(a); carregar(); }} />
            )}
            {(aba === "DE" || aba === "UK" || aba === "UKH" || aba === "BR") && (
              <Kanban leads={leads.filter(l => (l.pais || "BR") === aba)} onChange={carregar} />
            )}
            {aba === "clientes" && <Clientes leads={leads} onboardings={onboardings} />}
            {aba === "solicitacoes" && <Solicitacoes solicitacoes={solicitacoes} onChange={carregar} />}
            {aba === "automacoes" && <AutomacoesView />}
            {aba === "financeiro" && <FinanceiroView leads={leads} solicitacoes={solicitacoes} />}
          </div>
        </div>
      </div>
    </>
  );
}
