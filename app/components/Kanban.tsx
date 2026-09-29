"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Lead, COLS, getNichoStyle, MOEDA } from "@/lib/tipos";

function diasDesde(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return null;
  return Math.max(0, Math.floor((Date.now() - d) / 86400000));
}

function tempoNaEtapa(l: Lead) {
  const base = l.created_at || l.data_toque_1 || null;
  const d = diasDesde(base);
  if (d === null) return "—";
  if (d === 0) return "hoje";
  if (d === 1) return "1 dia";
  return `${d} dias`;
}

function prioridadeVisual(status: string) {
  if (status === "respondeu" || status === "negociando") return { label: "Quente", bg: "#dcfce7", fg: "#15803d", bd: "#bbf7d0" };
  if (status === "fechado" || status === "assinatura_ativa" || status === "publicado") return { label: "Ganho", bg: "#dbeafe", fg: "#1d4ed8", bd: "#bfdbfe" };
  if (status === "opener_enviado" || status.startsWith("followup")) return { label: "Em cadência", bg: "#fef3c7", fg: "#92400e", bd: "#fde68a" };
  if (status === "descartado" || status === "assinatura_cancelada") return { label: "Fechado", bg: "#f1f5f9", fg: "#64748b", bd: "#e2e8f0" };
  return { label: "Frio", bg: "#f8fafc", fg: "#64748b", bd: "#e2e8f0" };
}

type TabDet = "dados" | "auditoria" | "oportunidades" | "previa" | "emails" | "respostas" | "proposta" | "historico";

export default function Kanban({ leads, onChange }: { leads: Lead[]; onChange: () => void }) {
  const [aberto, setAberto] = useState<Lead | null>(null);
  const [tab, setTab] = useState<TabDet>("dados");
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const [busca, setBusca] = useState("");

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter(l =>
      l.empresa.toLowerCase().includes(q) ||
      (l.nicho || "").toLowerCase().includes(q) ||
      (l.contato_email || "").toLowerCase().includes(q) ||
      (l.pais || "").toLowerCase().includes(q)
    );
  }, [leads, busca]);

  async function mover(id: string, status: string) {
    await supabase.from("leads").update({ status }).eq("id", id);
    onChange();
  }
  async function togglePago(id: string, pago: boolean) {
    await supabase.from("leads").update({ pago }).eq("id", id);
    onChange();
  }
  async function excluirLead(lead: Lead) {
    if (!confirm(`Excluir "${lead.empresa}"? Isso deleta o projeto na Vercel e o repo no GitHub.`)) return;
    setExcluindo(lead.id);
    try {
      const res = await fetch("/api/excluir-lead", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urlNova: lead.url_nova }),
      });
      const data = await res.json();
      if (!res.ok) { alert("Erro ao excluir: " + (data.erros?.join("\n") ?? "desconhecido")); return; }
      await supabase.from("leads").delete().eq("id", lead.id);
      onChange();
    } catch (e) {
      alert("Erro inesperado: " + e);
    } finally {
      setExcluindo(null);
    }
  }
  function copiarLinkCliente(l: Lead) {
    if (!l.token_cliente) { alert("Lead sem token. Rode o SQL de migração."); return; }
    const base = (process.env.NEXT_PUBLIC_PAINEL_URL || window.location.origin).replace(/\/$/, "");
    navigator.clipboard?.writeText(`${base}/c/${l.token_cliente}`);
  }
  function abrirDetalhe(l: Lead) {
    setAberto(l);
    setTab("dados");
  }

  const total = filtrados.length;

  return (
    <>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
        <div style={{ flex: 1, minWidth: 220, position: "relative" }}>
          <input
            className="input"
            placeholder="Buscar por empresa, nicho ou email…"
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>
        <span className="tag" style={{ background: total ? "#eff6ff" : "#f1f5f9", color: total ? "#2563eb" : "#64748b", borderColor: total ? "#bfdbfe" : "#e2e8f0", fontWeight: 750 } as React.CSSProperties}>
          {total} {total === 1 ? "lead" : "leads"} {busca ? "filtrados" : `no funil`}
        </span>
        <span className="tag tag--muted">Etapas: Prospectado → Fechado · {COLS.length} colunas</span>
      </div>

      <div className="board-scroll">
        <div className="board">
          {COLS.map(col => {
            const items = filtrados.filter(l => l.status === col.key);
            return (
              <div key={col.key} className="column">
                <div className="col-header">
                  <span className="col-dot" style={{ background: col.color, color: col.color }} />
                  <span className="col-label">{col.label}</span>
                  <span className="col-count" style={{
                    background: items.length ? col.color + "18" : "#f1f5f9",
                    color: items.length ? col.color : "#94a3b8",
                    border: `1px solid ${items.length ? col.color + "33" : "transparent"}`,
                  }}>{items.length}</span>
                </div>

                <div className="cards">
                  {items.map((l, i) => {
                    const nc = getNichoStyle(l.nicho);
                    const hot = l.status === "respondeu" || l.status === "negociando";
                    const pri = prioridadeVisual(l.status);
                    const semSite = !l.url_antiga;
                    return (
                      <div key={l.id} className="card" style={{
                        animationDelay: `${Math.min(i * 28, 320)}ms`,
                        borderLeft: hot ? `3px solid ${col.color}` : undefined,
                      }}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                          <span className="tag" style={{ background: pri.bg, color: pri.fg, borderColor: pri.bd, fontWeight: 700, border: "1px solid " + pri.bd } as React.CSSProperties}>{pri.label}</span>
                          <span className="tag tag--muted">{tempoNaEtapa(l)} na fila</span>
                          {semSite ? <span className="tag" style={{ background: "#fef3c7", color: "#92400e", borderColor: "#fde68a", fontWeight: 700 } as React.CSSProperties}>Sem site</span> : <span className="tag" style={{ background: "#f1f5f9", color: "#475569", borderColor: "#e2e8f0" } as React.CSSProperties}>Reformulação</span>}
                        </div>

                        <div className="card-top">
                          <span className="card-name">{l.empresa}</span>
                          {l.pago && <span className="badge badge--green">PAGO</span>}
                        </div>

                        <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 4, display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {l.nicho && <span>{l.nicho}</span>}
                          {l.pais && <span>· {l.pais}</span>}
                          {l.campanha && <span>· {l.campanha}</span>}
                        </div>

                        <div className="tags">
                          {l.nicho && <span className="tag" style={{ background: nc.bg, color: nc.color, borderColor: nc.bg, fontWeight: 650 } as React.CSSProperties}>{l.nicho}</span>}
                          {l.screenshot_url ? <span className="tag" style={{ background: "#dcfce7", color: "#15803d", borderColor: "#bbf7d0", fontWeight: 700 } as React.CSSProperties}>screenshot</span> : <span className="tag tag--muted">sem screenshot</span>}
                          {l.pago && <span className="tag" style={{ background: "#dbeafe", color: "#1d4ed8", borderColor: "#bfdbfe", fontWeight: 700 } as React.CSSProperties}>pago</span>}
                        </div>

                        <div className="pills">
                          {l.url_antiga ? <a href={l.url_antiga} target="_blank" rel="noreferrer" className="pill">Antes</a> : <span className="pill" style={{ opacity: .6 }}>Sem site atual</span>}
                          {l.url_nova ? <a href={l.url_nova} target="_blank" rel="noreferrer" className="pill pill--dark">Prévia</a> : <span className="pill" style={{ opacity: .6 }}>Sem prévia</span>}
                          {l.contato_whatsapp && <a href={`https://wa.me/${l.contato_whatsapp}`} target="_blank" rel="noreferrer" className="pill pill--green">WA</a>}
                          <button className="pill pill--btn pill--blue" onClick={() => copiarLinkCliente(l)}>Link cliente</button>
                          <button className="pill pill--btn" onClick={() => abrirDetalhe(l)}>Detalhe</button>
                        </div>

                        <div className="card-footer">
                          <select className="s-select" value={l.status} onChange={e => mover(l.id, e.target.value)}>
                            {COLS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                          </select>
                          <button className={`pill pill--btn${l.pago ? " pill--paid" : ""}`} onClick={() => togglePago(l.id, !l.pago)}>
                            {l.pago ? "Pago" : "Pago?"}
                          </button>
                          {col.key === "descartado" && (
                            <button className="pill pill--btn pill--danger" disabled={excluindo === l.id} onClick={() => excluirLead(l)}>
                              {excluindo === l.id ? "..." : "Excluir"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {items.length === 0 && <div className="empty">vazio</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {aberto && (
        <div className="overlay" onClick={() => setAberto(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 820 }}>
            <div className="modal-head" style={{ flexDirection: "column", alignItems: "stretch", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div className="modal-title">{aberto.empresa}</div>
                  <div className="modal-sub">{aberto.contato_email ? "Para: " + aberto.contato_email : "Sem email"} · {aberto.pais || "—"} · {aberto.status}</div>
                </div>
                <button className="btn-ghost" onClick={() => setAberto(null)}>Fechar</button>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {([
                  ["dados", "Dados"],
                  ["auditoria", "Auditoria"],
                  ["oportunidades", "Oportunidades"],
                  ["previa", "Prévia"],
                  ["emails", "E-mails"],
                  ["respostas", "Respostas"],
                  ["proposta", "Proposta"],
                  ["historico", "Histórico"],
                ] as const).map(([k, label]) => (
                  <button
                    key={k}
                    onClick={() => setTab(k as TabDet)}
                    className="pill pill--btn"
                    style={tab === k ? { background: "#0f172a", color: "white", borderColor: "#0f172a", fontWeight: 750 } : undefined}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-body">
              {tab === "dados" && (
                <div style={{ display: "grid", gap: 12 }}>
                  <div className="pills" style={{ flexWrap: "wrap", marginTop: 0 }}>
                    <span className="pill">{aberto.status}</span>
                    {aberto.pais && <span className="pill">{aberto.pais}</span>}
                    {aberto.campanha && <span className="pill">{aberto.campanha}</span>}
                    {aberto.nicho && <span className="pill" style={{ background: getNichoStyle(aberto.nicho).bg, color: getNichoStyle(aberto.nicho).color }}>{aberto.nicho}</span>}
                    {!aberto.url_antiga && <span className="pill" style={{ background: "#fef3c7", color: "#92400e", borderColor: "#fde68a" }}>Sem site · primeira presença</span>}
                    {aberto.url_antiga && <span className="pill">Reformulação</span>}
                  </div>

                  <table className="table">
                    <tbody>
                      <tr><td style={{ width: 160, fontWeight: 700, color: "#0f172a" }}>Empresa</td><td style={{ fontWeight: 600 }}>{aberto.empresa}</td></tr>
                      <tr><td style={{ fontWeight: 700, color: "#0f172a" }}>Email</td><td>{aberto.contato_email || <span style={{ color: "#94a3b8" }}>— sem email verificável, não construir</span>}</td></tr>
                      <tr><td style={{ fontWeight: 700, color: "#0f172a" }}>WhatsApp</td><td>{aberto.contato_whatsapp ? <a href={`https://wa.me/${aberto.contato_whatsapp}`} target="_blank" rel="noreferrer" className="pill pill--green" style={{ marginTop: 0 } as React.CSSProperties}>WA {aberto.contato_whatsapp}</a> : "—"}</td></tr>
                      <tr><td style={{ fontWeight: 700, color: "#0f172a" }}>Site atual</td><td>{aberto.url_antiga ? <a href={aberto.url_antiga} target="_blank" rel="noreferrer" className="pill" style={{ marginTop: 0 } as React.CSSProperties}>Abrir Antes</a> : <span style={{ color: "#92400e", fontWeight: 650 }}>Sem site · vender primeira presença digital</span>}</td></tr>
                      <tr><td style={{ fontWeight: 700, color: "#0f172a" }}>País / Campanha</td><td>{aberto.pais || "—"} {aberto.campanha ? `· ${aberto.campanha}` : ""}</td></tr>
                      <tr><td style={{ fontWeight: 700, color: "#0f172a" }}>Valor / Pago</td><td>{aberto.pago ? "Pago" : "Não pago"} · {aberto.valor ? `€/£ ${aberto.valor}` : `padrão ${MOEDA[aberto.pais || "DE"]?.simbolo}${MOEDA[aberto.pais || "DE"]?.unica}`}</td></tr>
                      {aberto.observacoes && <tr><td style={{ fontWeight: 700, color: "#0f172a" }}>Observações</td><td style={{ whiteSpace: "pre-wrap" }}>{aberto.observacoes}</td></tr>}
                    </tbody>
                  </table>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {aberto.url_antiga && <a href={aberto.url_antiga} target="_blank" rel="noreferrer" className="pill pill--btn">Abrir site atual</a>}
                    {aberto.url_nova && <a href={aberto.url_nova} target="_blank" rel="noreferrer" className="pill pill--dark">Abrir prévia</a>}
                    {aberto.screenshot_url && <a href={aberto.screenshot_url} target="_blank" rel="noreferrer" className="pill pill--green">Screenshot</a>}
                    <button className="pill pill--btn pill--blue" onClick={() => copiarLinkCliente(aberto)}>Copiar link cliente</button>
                  </div>
                </div>
              )}

              {tab === "auditoria" && (
                <div style={{ display: "grid", gap: 12 }}>
                  {!aberto.url_antiga ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">◯</div>
                      <div className="empty-state-title">Sem site para auditar</div>
                      <div className="empty-state-sub">Empresa sem presença digital. Não inventar auditoria. Venda é primeira presença digital profissional.</div>
                    </div>
                  ) : (
                    <>
                      <div className="alerta">Auditoria só com evidência real (screenshot, coleta do site antigo). Não inventar defeitos.</div>
                      <div style={{ display: "grid", gap: 10 }}>
                        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 14 }}>
                          <div style={{ fontSize: 12, fontWeight: 750, color: "#0f172a", marginBottom: 4 }}>Site atual</div>
                          <a href={aberto.url_antiga} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "#2563eb", wordBreak: "break-all" }}>{aberto.url_antiga}</a>
                        </div>
                        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 14 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Screenshot</div>
                          {aberto.screenshot_url ? <a href={aberto.screenshot_url} target="_blank" rel="noreferrer" className="pill">Abrir screenshot</a> : <div style={{ fontSize: 13, color: "#94a3b8" }}>Sem screenshot armazenado neste lead. Sem dado, sem seção inventada.</div>}
                        </div>
                        <div style={{ background: "white", border: "1px dashed #e2e8f0", borderRadius: 12, padding: 14, color: "#64748b", fontSize: 12.5, lineHeight: 1.6 }}>
                          Checklist real (quando houver coleta): responsivo, tipografia, imagens, hierarquia, CTA, performance. Nada inventado; sem print, exibir vazio bem desenhado.
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {tab === "oportunidades" && (
                <div style={{ display: "grid", gap: 12 }}>
                  <div className="alerta">Oportunidades só com base em auditoria real. Não inventar lista de melhorias sem evidência.</div>
                  {!aberto.url_antiga ? (
                    <div style={{ display: "grid", gap: 8 }}>
                      {[
                        "Primeira presença digital profissional (sem site hoje)",
                        "Google Business e SEO local",
                        "Captação via WhatsApp e formulário",
                        "Prova social e portfólio real",
                      ].map(t => (
                        <div key={t} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: "12px 14px", fontSize: 13, color: "#334155" }}>{t}</div>
                      ))}
                      <div style={{ fontSize: 11.5, color: "#94a3b8", background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 10, padding: "8px 10px" }}>Para reformulação, as oportunidades devem vir da auditoria do site atual. Sem auditoria, manter estado vazio.</div>
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-state-icon">◇</div>
                      <div className="empty-state-title">Sem oportunidades mapeadas neste lead</div>
                      <div className="empty-state-sub">Quando houver anotações de reforma (ex.: performance, mobile, copy), elas aparecem aqui. Sem inventar.</div>
                    </div>
                  )}
                </div>
              )}

              {tab === "previa" && (
                <div style={{ display: "grid", gap: 12 }}>
                  {!aberto.url_nova ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">⬚</div>
                      <div className="empty-state-title">Sem prévia publicada</div>
                      <div className="empty-state-sub">Quando houver isca na Vercel, o link aparece aqui com ?ref=email e beacon.</div>
                    </div>
                  ) : (
                    <>
                      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 750, color: "#0f172a", marginBottom: 6 }}>Prévia publicada</div>
                        <a href={aberto.url_nova} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "#2563eb", wordBreak: "break-all" }}>{aberto.url_nova}</a>
                        <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <a href={`${aberto.url_nova}?ref=email`} target="_blank" rel="noreferrer" className="pill pill--dark">Abrir com ?ref=email</a>
                          <button className="pill pill--btn pill--blue" onClick={() => copiarLinkCliente(aberto)}>Link cliente /c/</button>
                        </div>
                      </div>
                      <div style={{ fontSize: 11.5, color: "#94a3b8", background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: "10px 12px" }}>Toda isca leva beacon. Sem exceção.</div>
                    </>
                  )}
                </div>
              )}

              {tab === "emails" && (
                <div style={{ display: "grid", gap: 12 }}>
                  {!aberto.email_assunto && !aberto.email_corpo ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">✉</div>
                      <div className="empty-state-title">Sem email registrado neste lead</div>
                      <div className="empty-state-sub">O opener e FUs aparecem aqui quando email_corpo/email_assunto estiverem preenchidos. Sem inventar corpo.</div>
                    </div>
                  ) : (
                    <>
                      {aberto.email_assunto && (
                        <div>
                          <div className="label-xs">Assunto</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 12px" }}>{aberto.email_assunto}</div>
                        </div>
                      )}
                      <div>
                        <div className="label-xs">Corpo do email</div>
                        <pre className="email-pre">{aberto.email_corpo || "—"}</pre>
                      </div>
                      <div className="pills" style={{ flexWrap: "wrap", marginTop: 0 }}>
                        <span className="pill">{aberto.status}</span>
                        {aberto.pais && <span className="pill">{aberto.pais}</span>}
                        {aberto.campanha && <span className="pill">{aberto.campanha}</span>}
                        {aberto.url_antiga && <a href={aberto.url_antiga} target="_blank" rel="noreferrer" className="pill">Antes</a>}
                        {aberto.url_nova && <a href={aberto.url_nova} target="_blank" rel="noreferrer" className="pill pill--dark">Depois</a>}
                        {aberto.screenshot_url && <a href={aberto.screenshot_url} target="_blank" rel="noreferrer" className="pill pill--green">Screenshot</a>}
                      </div>
                    </>
                  )}
                </div>
              )}

              {tab === "respostas" && (
                <div style={{ display: "grid", gap: 10 }}>
                  <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 750, color: "#0f172a" }}>Acompanhamentos (data_toque_*)</div>
                    <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
                      {[aberto.data_toque_1, aberto.data_toque_2, aberto.data_toque_3, aberto.data_toque_4].map((d, idx) => (
                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", gap: 10, background: "white", border: "1px solid #f1f5f9", borderRadius: 10, padding: "8px 10px", fontSize: 12.5 }}>
                          <span style={{ fontWeight: 650, color: "#334155" }}>{idx === 0 ? "Opener" : `FU${idx}`}</span>
                          <span style={{ color: d ? "#0f172a" : "#94a3b8", fontWeight: d ? 600 : 500 }}>{d ? new Date(d).toLocaleString("pt-BR") : "— não enviado"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="empty-state" style={{ padding: 16 }}>
                    <div className="empty-state-title" style={{ fontSize: 12.5 }}>Respostas reais no CRM</div>
                    <div className="empty-state-sub">Quando houver resposta, o status vira respondeu/negociando e o monitor avisa no Telegram. Sem automação inventada.</div>
                  </div>
                </div>
              )}

              {tab === "proposta" && (
                <div style={{ display: "grid", gap: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div className="cp-plan cp-plan--hi" style={{ padding: 16 }}>
                      <div className="cp-plan-name">Cota única</div>
                      <div className="cp-plan-price">{MOEDA[aberto.pais || "DE"]?.simbolo}{MOEDA[aberto.pais || "DE"]?.unica} <small>único</small></div>
                      <div className="cp-plan-desc">Pagamento único. Site entregue.</div>
                    </div>
                    <div className="cp-plan" style={{ padding: 16 }}>
                      <div className="cp-plan-name">Assinatura</div>
                      <div className="cp-plan-price">{MOEDA[aberto.pais || "DE"]?.simbolo}{MOEDA[aberto.pais || "DE"]?.mensal} <small>/mês</small></div>
                      <div className="cp-plan-desc">1 atualização a cada 3 meses.</div>
                    </div>
                  </div>
                  <table className="table">
                    <tbody>
                      <tr><td style={{ width: 160, fontWeight: 700 }}>Status</td><td>{aberto.status} {aberto.pago ? "· pago" : "· não pago"}</td></tr>
                      <tr><td style={{ fontWeight: 700 }}>Valor</td><td>{aberto.valor ? `${MOEDA[aberto.pais || "DE"]?.simbolo}${aberto.valor}` : `padrão ${MOEDA[aberto.pais || "DE"]?.simbolo}${MOEDA[aberto.pais || "DE"]?.unica}`}</td></tr>
                      <tr><td style={{ fontWeight: 700 }}>Link cliente</td><td>{aberto.token_cliente ? <a href={`/c/${aberto.token_cliente}`} target="_blank" rel="noreferrer" className="pill pill--blue" style={{ marginTop: 0 } as React.CSSProperties}>/c/{aberto.token_cliente.slice(0, 8)}…</a> : "— sem token"}</td></tr>
                    </tbody>
                  </table>
                  <div style={{ fontSize: 11.5, color: "#94a3b8", background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 10, padding: "8px 10px" }}>
                    Preço nunca no corpo gerado. Bloco de pagamento é injetado pelo disparo a partir de config. Sem IBAN/sort code no modal.
                  </div>
                </div>
              )}

              {tab === "historico" && (
                <div style={{ display: "grid", gap: 10 }}>
                  {[
                    ["Criado", aberto.created_at],
                    ["Toque 1", aberto.data_toque_1],
                    ["Toque 2", aberto.data_toque_2],
                    ["Toque 3", aberto.data_toque_3],
                    ["Toque 4", aberto.data_toque_4],
                  ].map(([label, iso]) => (
                    <div key={label as string} style={{ display: "flex", justifyContent: "space-between", gap: 10, background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: "10px 12px" }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a" }}>{label as string}</span>
                      <span style={{ fontSize: 12.5, color: iso ? "#334155" : "#94a3b8", fontWeight: iso ? 600 : 500 }}>{iso ? new Date(iso as string).toLocaleString("pt-BR") : "—"}</span>
                    </div>
                  ))}
                  {aberto.observacoes && <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, fontSize: 12.5, color: "#334155", whiteSpace: "pre-wrap" }}>{aberto.observacoes}</div>}
                  {!aberto.created_at && !aberto.data_toque_1 && <div className="empty-state"><div className="empty-state-title">Sem histórico temporal</div><div className="empty-state-sub">Timestamps aparecem quando o funil tocar o lead.</div></div>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
