"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Lead, MetricaDia, PAISES, MOEDA, COLS, PAIS_LABEL } from "@/lib/tipos";

const ETAPAS_FUNIL = [
  "prospectado", "liberado", "opener_enviado", "followup_enviado",
  "followup2_enviado", "followup3_enviado", "respondeu", "fechado",
];
// Um lead em etapa avançada JÁ PASSOU pelas anteriores; funil acumulado.
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

    // Receita: cota única paga (valor ou preço padrão do país) + MRR
    const recUnica = leads.filter(l => l.pago).reduce((s, l) => s + (l.valor || MOEDA[l.pais || "DE"]?.unica || 0), 0);
    const mrr = assinaturas.reduce((s, l) => s + (MOEDA[l.pais || "DE"]?.mensal || 39), 0);

    const taxaResposta = tocados.length ? (responderam.length / tocados.length) * 100 : 0;
    const taxaFechamento = tocados.length ? ((fechados.length + assinaturas.length) / tocados.length) * 100 : 0;

    // Atividade semanal (últimos 7 dias vs 7 anteriores) via data_toque_*
    const toquesSemana = (de: number, ate: number) => leads.reduce((s, l) =>
      s + [l.data_toque_1, l.data_toque_2, l.data_toque_3, l.data_toque_4]
        .filter(d => entreDias(de, ate, d)).length, 0);
    const enviados7 = toquesSemana(7, 0);
    const enviados14 = toquesSemana(14, 7);
    const novos7 = leads.filter(l => dentroDe(7, l.created_at)).length;
    const novos14 = leads.filter(l => entreDias(14, 7, l.created_at)).length;

    // Opens da série (metricas_diarias, alimentada pelo cron)
    const opens7 = metricas.filter(m => dentroDe(7, m.dia + "T12:00:00Z")).reduce((s, m) => s + (m.opens || 0), 0);

    // Funil acumulado por país
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

    // Números-gatilho (Seção 9 do GTM): quando parar e repensar
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

    return { ativos, tocados, responderam, fechados, assinaturas, recUnica, mrr, taxaResposta, taxaFechamento, enviados7, enviados14, novos7, novos14, opens7, funil, alertas };
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

  return (
    <div className="dash">

      {/* KPIs: os 5-7 números da Seção 9 */}
      <div className="dash-grid">
        <div className="kpi">
          <div className="kpi-label">Receita única</div>
          <div className="kpi-value">€ {calc.recUnica.toLocaleString("de-DE")}</div>
          <div className="kpi-sub">{calc.fechados.length} fechados</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">MRR</div>
          <div className="kpi-value">€ {calc.mrr.toLocaleString("de-DE")}</div>
          <div className="kpi-sub">{calc.assinaturas.length} assinaturas ativas</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Taxa de resposta</div>
          <div className="kpi-value">{calc.taxaResposta.toFixed(1)}%</div>
          <div className="kpi-sub">{calc.responderam.length} de {calc.tocados.length} tocados</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Taxa de fechamento</div>
          <div className="kpi-value">{calc.taxaFechamento.toFixed(1)}%</div>
          <div className="kpi-sub">sobre leads tocados</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Emails · 7 dias</div>
          <div className="kpi-value">{calc.enviados7}</div>
          <div className="kpi-sub">semana anterior: {calc.enviados14} ({delta(calc.enviados7, calc.enviados14)})</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Novos leads · 7 dias</div>
          <div className="kpi-value">{calc.novos7}</div>
          <div className="kpi-sub">semana anterior: {calc.novos14} ({delta(calc.novos7, calc.novos14)})</div>
        </div>
        {calc.opens7 > 0 && (
          <div className="kpi">
            <div className="kpi-label">Opens · 7 dias</div>
            <div className="kpi-value">{calc.opens7}</div>
            <div className="kpi-sub">via Brevo</div>
          </div>
        )}
      </div>

      {/* Alertas / números-gatilho */}
      {calc.alertas.map((a, i) => (
        <div key={i} className={`alerta${a.tipo === "red" ? " alerta--red" : a.tipo === "green" ? " alerta--green" : ""}`}>
          {a.texto}
        </div>
      ))}

      {/* Funil por país com conversão etapa a etapa */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
        {PAISES.map(pais => {
          const linhas = calc.funil[pais];
          const max = Math.max(1, linhas[0]?.n || 1);
          const temLeads = linhas[0]?.n > 0;
          return (
            <div className="panel" key={pais}>
              <div className="panel-title">Funil {PAIS_LABEL[pais] || pais}</div>
              <div className="panel-sub">{temLeads ? "conversão acumulada etapa a etapa" : "sem leads ainda"}</div>
              {temLeads && linhas.map(l => (
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

      {/* Ritual de segunda-feira (20 min, doc GTM): números + UM ajuste */}
      <div className="panel">
        <div className="panel-title">Segunda-feira de manhã</div>
        <div className="panel-sub">Confira os números da semana, marque o que travou e decida UM ajuste, não cinco. Estratégia não morre por estar errada; morre por ninguém olhar pra ela.</div>
        <textarea
          className="textarea" rows={3}
          placeholder="O ajuste desta semana (um só): ex. trocar assunto do opener DE pra versão com nome da cidade"
          value={ajuste} onChange={e => setAjuste(e.target.value)}
        />
        <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center" }}>
          <button className="btn-primary" disabled={salvando} onClick={salvarAjuste}>
            {salvando ? "Salvando..." : "Salvar ajuste da semana"}
          </button>
          {salvo && <span style={{ fontSize: 12.5, color: "#16a34a", fontWeight: 600 }}>Salvo.</span>}
        </div>
      </div>

      {/* Distribuição atual por status (visão rápida) */}
      <div className="panel">
        <div className="panel-title">Distribuição por etapa</div>
        <div className="panel-sub">onde os leads estão agora, por país</div>
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
                  <td className="num" style={{ fontWeight: 700 }}>{total}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// util exportado pro shell salvar ritual
export async function salvarRitualSemana(ajuste: string) {
  const segunda = new Date();
  segunda.setDate(segunda.getDate() - ((segunda.getDay() + 6) % 7));
  const semana = segunda.toISOString().slice(0, 10);
  await supabase.from("ritual_semanal").upsert({ semana, ajuste }, { onConflict: "semana" });
}
