"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Lead, MetricaDia, PAISES, MOEDA, COLS, PAIS_LABEL } from "@/lib/tipos";

const ETAPAS_FUNIL = [
  "prospectado", "liberado", "opener_enviado", "followup_enviado",
  "followup2_enviado", "followup3_enviado", "respondeu", "fechado",
];
const ORDEM: Record<string, number> = {
  prospectado: 0, construido: 1, liberado: 2, opener_enviado: 3,
  followup_enviado: 4, followup2_enviado: 5, followup3_enviado: 6,
  respondeu: 7, negociando: 7, fechado: 8, assinatura_ativa: 8, publicado: 8,
  assinatura_cancelada: 8, descartado: 6.5,
};
const LABEL_ETAPA: Record<string, string> = {
  prospectado: "Prospectado", liberado: "Site pronto", opener_enviado: "Opener",
  followup_enviado: "FU 1", followup2_enviado: "FU 2", followup3_enviado: "FU 3",
  respondeu: "Respondeu", fechado: "Fechado",
};

function dentroDe(dias: number, iso?: string | null) {
  if (!iso) return false;
  const d = new Date(iso).getTime();
  return Date.now() - d < dias * 86400000;
}
function entreDias(deDias: number, ateDias: number, iso?: string | null) {
  if (!iso) return false;
  const idade = (Date.now() - new Date(iso).getTime()) / 86400000;
  return idade >= ateDias && idade < deDias;
}

function SparkBars({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(1, ...values);
  return (
    <div style={{ display: "flex", alignItems: "end", gap: 4, height: 44 }}>
      {values.map((v, i) => (
        <div key={i} title={`${v}`} style={{
          flex: 1, borderRadius: 6, background: color,
          height: `${Math.max(6, (v / max) * 44)}px`, opacity: 0.9,
          transition: "height .4s ease",
        }} />
      ))}
    </div>
  );
}

export default function Dashboard({ leads, metricas, ritual, onSalvarRitual }: {
  leads: Lead[];
  metricas: MetricaDia[];
  ritual: { semana: string; ajuste: string | null } | null;
  onSalvarRitual: (ajuste: string) => Promise<void>;
}) {
  const [ajuste, setAjuste] = useState(ritual?.ajuste || "");
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  const calc = useMemo(() => {
    const ativos = leads.filter(l => l.status !== "descartado");
    const tocados = leads.filter(l => (ORDEM[l.status] ?? 0) >= 3 || l.data_toque_1);
    const responderam = leads.filter(l => ["respondeu", "negociando", "fechado", "assinatura_ativa", "publicado"].includes(l.status));
    const fechados = leads.filter(l => ["fechado", "publicado"].includes(l.status));
    const assinaturas = leads.filter(l => l.status === "assinatura_ativa");

    const recUnica = leads.filter(l => l.pago).reduce((s, l) => s + (l.valor || MOEDA[l.pais || "DE"]?.unica || 0), 0);
    const mrr = assinaturas.reduce((s, l) => s + (MOEDA[l.pais || "DE"]?.mensal || 39), 0);

    const taxaResposta = tocados.length ? (responderam.length / tocados.length) * 100 : 0;
    const taxaFechamento = tocados.length ? ((fechados.length + assinaturas.length) / tocados.length) * 100 : 0;

    const toquesSemana = (de: number, ate: number) => leads.reduce((s, l) =>
      s + [l.data_toque_1, l.data_toque_2, l.data_toque_3, l.data_toque_4]
        .filter(d => entreDias(de, ate, d)).length, 0);
    const enviados7 = toquesSemana(7, 0);
    const enviados14 = toquesSemana(14, 7);
    const novos7 = leads.filter(l => dentroDe(7, l.created_at)).length;
    const novos14 = leads.filter(l => entreDias(14, 7, l.created_at)).length;

    const opens7 = metricas.filter(m => dentroDe(7, m.dia + "T12:00:00Z")).reduce((s, m) => s + (m.opens || 0), 0);

    const funil: Record<string, { etapa: string; n: number; pct: number | null }[]> = {};
    for (const pais of PAISES) {
      const doPais = leads.filter(l => (l.pais || "BR") === pais);
      const linhas: { etapa: string; n: number; pct: number | null }[] = [];
      let anterior: number | null = null;
      for (const et of ETAPAS_FUNIL) {
        const nivel = ORDEM[et];
        const n = doPais.filter(l => (ORDEM[l.status] ?? -1) >= nivel && l.status !== "descartado").length
          + (et === "prospectado" ? doPais.filter(l => l.status === "descartado").length : 0);
        linhas.push({ etapa: et, n, pct: anterior && anterior > 0 ? (n / anterior) * 100 : null });
        anterior = n;
      }
      funil[pais] = linhas;
    }

    const alertas: { tipo: "red" | "amber" | "green"; texto: string }[] = [];
    const openers = leads.filter(l => (ORDEM[l.status] ?? 0) >= 3).length;
    if (openers >= 100 && taxaResposta < 2) {
      alertas.push({ tipo: "red", texto: `GATILHO: ${openers} leads tocados com taxa de resposta ${taxaResposta.toFixed(1)}% (abaixo de 2%). Hora de repensar assunto, remetente ou oferta antes de escalar volume.` });
    }
    if (openers >= 150 && fechados.length + assinaturas.length === 0) {
      alertas.push({ tipo: "red", texto: `GATILHO: ${openers} tocados e nenhum fechamento. O funil chega até FU3 mas não converte. Atacar preço, confiança ou prova social.` });
    }
    if (taxaResposta >= 2 && openers >= 50) {
      alertas.push({ tipo: "green", texto: `Taxa de resposta ${taxaResposta.toFixed(1)}% está saudável para cold email. Manter cadência e aumentar volume de prospecção.` });
    }
    if (enviados7 === 0) {
      alertas.push({ tipo: "amber", texto: "Nenhum toque de email nos últimos 7 dias. Verificar se os crons do funil estão ativos (de_ativo / uk_ativo)." });
    }

    // Séries para gráficos (últimos 14 dias) — só quando houver metricas reais
    const dias14: string[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      dias14.push(d.toISOString().slice(0, 10));
    }
    const porDia = new Map(metricas.map(m => [m.dia, m]));
    const serieProspectados = dias14.map(d => porDia.get(d)?.prospectados ?? 0);
    const serieEnviados = dias14.map(d => porDia.get(d)?.enviados ?? 0);
    const serieFechados = dias14.map(d => (porDia.get(d)?.fechados ?? 0) + (porDia.get(d)?.assinaturas ?? 0));
    const temSerie = metricas.length > 0 && dias14.some(d => porDia.has(d));

    // Atividades recentes (leads mais recentes / tocados)
    const recentes = [...leads].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()).slice(0, 6);
    const toquesRecentes = [...leads]
      .map(l => ({ l, d: l.data_toque_1 || l.data_toque_2 || l.data_toque_3 || l.data_toque_4 || null }))
      .filter(x => !!x.d)
      .sort((a, b) => new Date(b.d!).getTime() - new Date(a.d!).getTime())
      .slice(0, 5);

    return { ativos, tocados, responderam, fechados, assinaturas, recUnica, mrr, taxaResposta, taxaFechamento, enviados7, enviados14, novos7, novos14, opens7, funil, alertas, serieProspectados, serieEnviados, serieFechados, temSerie, dias14, recentes, toquesRecentes };
  }, [leads, metricas]);

  async function salvarAjuste() {
    setSalvando(true);
    await onSalvarRitual(ajuste);
    setSalvando(false);
    setSalvo(true);
    setTimeout(() => setSalvo(false), 3000);
  }

  const delta = (agora: number, antes: number) => {
    if (antes === 0) return agora > 0 ? "+∞" : "0";
    const d = ((agora - antes) / antes) * 100;
    return (d >= 0 ? "+" : "") + d.toFixed(0) + "%";
  };

  const CORES_PAIS: Record<string, string> = { DE: "#f59e0b", UK: "#3b82f6", UKH: "#ec4899", BR: "#10b981" };

  const temDadosComparacao = calc.enviados14 > 0 || calc.novos14 > 0;

  return (
    <div className="dash">

      {/* KPIs premium */}
      <div className="dash-grid">
        <div className="kpi">
          <div className="kpi-top"><span className="kpi-icon" style={{ background: "#fef9c3", borderColor: "#fde68a", color: "#a16207" }}>€</span>
            {temDadosComparacao && <span className={`kpi-trend ${calc.enviados7 >= calc.enviados14 ? "kpi-trend--up" : "kpi-trend--down"}`}>{delta(calc.enviados7, calc.enviados14)} 7d</span>}</div>
          <div className="kpi-label">Receita única</div>
          <div className="kpi-value">€ {calc.recUnica.toLocaleString("de-DE")}</div>
          <div className="kpi-sub">{calc.fechados.length} fechados · cota única</div>
        </div>
        <div className="kpi">
          <div className="kpi-top"><span className="kpi-icon" style={{ background: "#ccfbf1", borderColor: "#99f6e4", color: "#0f766e" }}>M</span>
            <span className="kpi-trend">{calc.assinaturas.length} ativas</span></div>
          <div className="kpi-label">MRR</div>
          <div className="kpi-value">€ {calc.mrr.toLocaleString("de-DE")}</div>
          <div className="kpi-sub">{calc.assinaturas.length} assinaturas · £39/mês</div>
        </div>
        <div className="kpi">
          <div className="kpi-top"><span className="kpi-icon" style={{ background: "#dbeafe", borderColor: "#bfdbfe", color: "#1d4ed8" }}>%</span>
            <span className={`kpi-trend ${calc.taxaResposta >= 2 ? "kpi-trend--up" : calc.taxaResposta > 0 ? "" : "kpi-trend--down"}`}>{calc.taxaResposta.toFixed(1)}%</span></div>
          <div className="kpi-label">Taxa de resposta</div>
          <div className="kpi-value">{calc.taxaResposta.toFixed(1)}%</div>
          <div className="kpi-sub">{calc.responderam.length} de {calc.tocados.length} tocados</div>
        </div>
        <div className="kpi">
          <div className="kpi-top"><span className="kpi-icon" style={{ background: "#f0fdf4", borderColor: "#bbf7d0", color: "#15803d" }}>✓</span>
            <span className="kpi-trend">{calc.taxaFechamento.toFixed(1)}% fechamento</span></div>
          <div className="kpi-label">Taxa de fechamento</div>
          <div className="kpi-value">{calc.taxaFechamento.toFixed(1)}%</div>
          <div className="kpi-sub">sobre leads tocados · {calc.fechados.length + calc.assinaturas.length} fechados</div>
        </div>
        <div className="kpi">
          <div className="kpi-top"><span className="kpi-icon" style={{ background: "#eff6ff", borderColor: "#bfdbfe", color: "#2563eb" }}>✉</span>
            {temDadosComparacao ? <span className={`kpi-trend ${calc.enviados7 >= calc.enviados14 ? "kpi-trend--up" : "kpi-trend--down"}`}>{delta(calc.enviados7, calc.enviados14)}</span> : <span className="kpi-trend">7 dias</span>}</div>
          <div className="kpi-label">Emails · 7 dias</div>
          <div className="kpi-value">{calc.enviados7}</div>
          <div className="kpi-sub">semana anterior: {calc.enviados14}{temDadosComparacao ? ` (${delta(calc.enviados7, calc.enviados14)})` : " · sem base comparável"}</div>
        </div>
        <div className="kpi">
          <div className="kpi-top"><span className="kpi-icon" style={{ background: "#fef3c7", borderColor: "#fde68a", color: "#b45309" }}>＋</span>
            {temDadosComparacao ? <span className={`kpi-trend ${calc.novos7 >= calc.novos14 ? "kpi-trend--up" : "kpi-trend--down"}`}>{delta(calc.novos7, calc.novos14)}</span> : <span className="kpi-trend">7 dias</span>}</div>
          <div className="kpi-label">Novos leads · 7 dias</div>
          <div className="kpi-value">{calc.novos7}</div>
          <div className="kpi-sub">semana anterior: {calc.novos14}{temDadosComparacao ? ` (${delta(calc.novos7, calc.novos14)})` : " · sem base comparável"}</div>
        </div>
        {calc.opens7 > 0 && (
          <div className="kpi">
            <div className="kpi-top"><span className="kpi-icon" style={{ background: "#fce7f3", borderColor: "#fbcfe8", color: "#be185d" }}>◎</span><span className="kpi-trend">via Brevo</span></div>
            <div className="kpi-label">Opens · 7 dias</div>
            <div className="kpi-value">{calc.opens7}</div>
            <div className="kpi-sub">aberturas registradas</div>
          </div>
        )}
        {calc.opens7 === 0 && (
          <div className="kpi" style={{ opacity: 0.9 }}>
            <div className="kpi-top"><span className="kpi-icon" style={{ background: "#f1f5f9", borderColor: "#e2e8f0", color: "#64748b" }}>◎</span><span className="kpi-trend">—</span></div>
            <div className="kpi-label">Opens · 7 dias</div>
            <div className="kpi-value">—</div>
            <div className="kpi-sub">sem dados de abertura nos últimos 7 dias</div>
          </div>
        )}
      </div>

      {calc.alertas.map((a, i) => (
        <div key={i} className={`alerta${a.tipo === "red" ? " alerta--red" : a.tipo === "green" ? " alerta--green" : ""}`}>
          {a.texto}
        </div>
      ))}

      {/* Evolução + Atividades recentes */}
      <div className="panel-grid2">
        <div className="panel">
          <div className="panel-head">
            <div><div className="panel-title">Evolução</div><div className="panel-sub">Vendas e prospecção nos últimos 14 dias. Comparação só quando houver dados reais.</div></div>
          </div>
          {!calc.temSerie ? (
            <div className="empty-state" style={{ padding: 18 }}>
              <div className="empty-state-icon">—</div>
              <div className="empty-state-title">Sem série temporal no backend</div>
              <div className="empty-state-sub">Preencha metricas_diarias via cron para ver prospecção, envios e fechamentos por dia. Sem dados, o gráfico permanece vazio por escolha.</div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: ".06em", textTransform: "uppercase", color: "#64748b", marginBottom: 8 }}>Prospectados por dia</div>
                <SparkBars values={calc.serieProspectados} color="#0f172a" />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94a3b8", marginTop: 6 }}><span>{calc.dias14[0]}</span><span>{calc.dias14[calc.dias14.length - 1]}</span></div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: ".06em", textTransform: "uppercase", color: "#64748b", marginBottom: 8 }}>Emails enviados por dia</div>
                <SparkBars values={calc.serieEnviados} color="#3b82f6" />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: ".06em", textTransform: "uppercase", color: "#64748b", marginBottom: 8 }}>Fechados por dia</div>
                <SparkBars values={calc.serieFechados} color="#10b981" />
              </div>
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-head">
            <div><div className="panel-title">Atividades recentes & alertas operacionais</div><div className="panel-sub">Últimos leads e toques. Sem inventar métricas.</div></div>
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: ".06em", textTransform: "uppercase", color: "#64748b", marginBottom: 8 }}>Novos prospectados</div>
              {calc.recentes.length === 0 ? <div className="empty" style={{ padding: 14 }}>Nenhum lead ainda</div> : (
                <div style={{ display: "grid", gap: 8 }}>
                  {calc.recentes.map(l => (
                    <div key={l.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 12, padding: "10px 12px" }}>
                      <div><div style={{ fontSize: 13, fontWeight: 650, color: "#0f172a" }}>{l.empresa}</div><div style={{ fontSize: 11.5, color: "#64748b" }}>{l.pais || "—"} · {l.status} · {l.created_at ? new Date(l.created_at).toLocaleDateString("pt-BR") : "—"}</div></div>
                      <span className="tag" style={{ background: l.url_nova ? "#dcfce7" : "#f1f5f9", color: l.url_nova ? "#15803d" : "#64748b", borderColor: l.url_nova ? "#bbf7d0" : "#e2e8f0" } as React.CSSProperties}>{l.url_nova ? "com prévia" : "sem prévia"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: ".06em", textTransform: "uppercase", color: "#64748b", marginBottom: 8 }}>Últimos toques (opener/FU)</div>
              {calc.toquesRecentes.length === 0 ? <div className="empty" style={{ padding: 14 }}>Nenhum envio registrado (data_toque_*)</div> : (
                <div style={{ display: "grid", gap: 8 }}>
                  {calc.toquesRecentes.map(({ l, d }) => (
                    <div key={l.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: "10px 12px" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{l.empresa}</div>
                      <div style={{ fontSize: 11.5, color: "#64748b" }}>{d ? new Date(d).toLocaleDateString("pt-BR") : "—"}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Funil por país */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
        {PAISES.map(pais => {
          const linhas = calc.funil[pais];
          const max = Math.max(1, linhas[0]?.n || 1);
          const temLeads = (linhas[0]?.n || 0) > 0;
          return (
            <div className="panel" key={pais}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 4 }}>
                <div className="panel-title" style={{ marginBottom: 0 }}>Funil {PAIS_LABEL[pais] || pais}</div>
                <span className="tag" style={{ background: temLeads ? "#eff6ff" : "#f1f5f9", color: temLeads ? "#2563eb" : "#64748b", borderColor: temLeads ? "#bfdbfe" : "#e2e8f0", fontWeight: 750 } as React.CSSProperties}>{temLeads ? `${linhas[0].n} leads` : "vazio"}</span>
              </div>
              <div className="panel-sub">{temLeads ? "Conversão acumulada etapa a etapa" : "Sem leads neste país ainda"}</div>
              {!temLeads ? (
                <div className="empty-state" style={{ padding: 16, marginTop: 8 }}>
                  <div className="empty-state-title" style={{ fontSize: 12.5 }}>Nenhum lead em {pais}</div>
                  <div className="empty-state-sub">Quando houver prospecção, o funil mostra Prospectado → Fechado com % de conversão.</div>
                </div>
              ) : linhas.map(l => (
                <div className="funnel-row" key={l.etapa}>
                  <span className="funnel-label">{LABEL_ETAPA[l.etapa]}</span>
                  <div className="funnel-bar-wrap">
                    <div className="funnel-bar" style={{ width: `${(l.n / max) * 100}%`, background: CORES_PAIS[pais] + "cc" }} />
                  </div>
                  <span className="funnel-nums">
                    {l.n}{l.pct !== null && <span className="pct"> · {l.pct.toFixed(0)}%</span>}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Ritual de segunda */}
      <div className="panel">
        <div className="panel-head">
          <div><div className="panel-title">Segunda-feira de manhã</div><div className="panel-sub">Confira os números da semana, marque o que travou e decida UM ajuste, não cinco.</div></div>
        </div>
        <textarea
          className="textarea" rows={3}
          placeholder="O ajuste desta semana (um só): ex. trocar assunto do opener DE pra versão com nome da cidade"
          value={ajuste} onChange={e => setAjuste(e.target.value)}
        />
        <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center" }}>
          <button className="btn-primary" disabled={salvando} onClick={salvarAjuste}>
            {salvando ? "Salvando..." : "Salvar ajuste da semana"}
          </button>
          {salvo && <span style={{ fontSize: 12.5, color: "#16a34a", fontWeight: 700 }}>Salvo.</span>}
        </div>
      </div>

      {/* Distribuição por etapa + resumo por país */}
      <div className="panel-grid2">
        <div className="panel">
          <div className="panel-title">Distribuição por etapa</div>
          <div className="panel-sub">onde os leads estão agora, por país</div>
          <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Etapa</th>
                {PAISES.map(p => <th key={p} style={{ textAlign: "right" }}>{PAIS_LABEL[p] || p}</th>)}
                <th style={{ textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {COLS.map(c => {
                const porPais = PAISES.map(p => leads.filter(l => (l.pais || "BR") === p && l.status === c.key).length);
                const total = porPais.reduce((a, b) => a + b, 0);
                if (total === 0) return null;
                return (
                  <tr key={c.key}>
                    <td><span className="col-dot" style={{ background: c.color, display: "inline-block", marginRight: 8 }} />{c.label}</td>
                    {porPais.map((n, i) => <td key={i} className="num">{n || "-"}</td>)}
                    <td className="num" style={{ fontWeight: 800 }}>{total}</td>
                  </tr>
                );
              })}
              {COLS.every(c => leads.filter(l => l.status === c.key).length === 0) && (
                <tr><td colSpan={PAISES.length + 2} style={{ textAlign: "center", color: "#94a3b8", padding: 18 }}>Nenhum lead em nenhuma etapa</td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
        <div className="panel">
          <div className="panel-title">Resumo por país</div>
          <div className="panel-sub">Reino Unido e Alemanha em destaque. BR incluso quando houver.</div>
          <div style={{ display: "grid", gap: 10 }}>
            {PAISES.map(p => {
              const doPais = leads.filter(l => (l.pais || "BR") === p);
              const fech = doPais.filter(l => ["fechado", "publicado", "assinatura_ativa"].includes(l.status)).length;
              const resp = doPais.filter(l => ["respondeu", "negociando"].includes(l.status)).length;
              const ativos = doPais.filter(l => l.status !== "descartado").length;
              const receitaPais = doPais.filter(l => l.pago).reduce((s, l) => s + (l.valor || MOEDA[p]?.unica || 0), 0);
              return (
                <div key={p} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 12, padding: "12px 14px" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 750, color: "#0f172a" }}>{PAIS_LABEL[p] || p}</div>
                    <div style={{ fontSize: 11.5, color: "#64748b" }}>{ativos} ativos · {resp} respondeu · {fech} fechados</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>€ {receitaPais.toLocaleString("de-DE")}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{doPais.length} total</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export async function salvarRitualSemana(ajuste: string) {
  const segunda = new Date();
  segunda.setDate(segunda.getDate() - ((segunda.getDay() + 6) % 7));
  const semana = segunda.toISOString().slice(0, 10);
  await supabase.from("ritual_semanal").upsert({ semana, ajuste }, { onConflict: "semana" });
}
