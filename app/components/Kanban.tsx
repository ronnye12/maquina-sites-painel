"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Lead, COLS, getNichoStyle } from "@/lib/tipos";

export default function Kanban({ leads, onChange }: { leads: Lead[]; onChange: () => void }) {
  const [aberto, setAberto] = useState<Lead | null>(null);
  const [excluindo, setExcluindo] = useState<string | null>(null);

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

  return (
    <>
      <div className="board-scroll">
        <div className="board">
          {COLS.map(col => {
            const items = leads.filter(l => l.status === col.key);
            return (
              <div key={col.key} className="column">
                <div className="col-header">
                  <span className="col-dot" style={{ background: col.color }} />
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
                    return (
                      <div key={l.id} className="card" style={{
                        animationDelay: `${Math.min(i * 28, 320)}ms`,
                        ...(hot ? { borderLeft: `3px solid ${col.color}` } : {}),
                      }}>
                        <div className="card-top">
                          <span className="card-name">{l.empresa}</span>
                          {l.pago && <span className="badge badge--green">PAGO</span>}
                        </div>

                        <div className="tags">
                          {l.nicho && <span className="tag" style={{ background: nc.bg, color: nc.color }}>{l.nicho}</span>}
                          {l.screenshot_url && <span className="tag" style={{ background: "#dcfce7", color: "#15803d" }}>screenshot</span>}
                        </div>

                        <div className="pills">
                          {l.url_antiga && <a href={l.url_antiga} target="_blank" rel="noreferrer" className="pill">Antes</a>}
                          {l.url_nova && <a href={l.url_nova} target="_blank" rel="noreferrer" className="pill pill--dark">Depois</a>}
                          {l.contato_whatsapp && <a href={`https://wa.me/${l.contato_whatsapp}`} target="_blank" rel="noreferrer" className="pill pill--green">WA</a>}
                          <button className="pill pill--btn pill--blue" onClick={() => copiarLinkCliente(l)}>Link cliente</button>
                          {l.email_corpo && <button className="pill pill--btn" onClick={() => setAberto(l)}>Ver email</button>}
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
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div className="modal-title">{aberto.empresa}</div>
                <div className="modal-sub">{aberto.contato_email ? "Para: " + aberto.contato_email : "Email"}</div>
              </div>
              <button className="btn-ghost" onClick={() => setAberto(null)}>Fechar</button>
            </div>
            <div className="modal-body">
              <div className="pills" style={{ flexWrap: "wrap" }}>
                <span className="pill">{aberto.status}</span>
                {aberto.pais && <span className="pill">{aberto.pais}</span>}
                {aberto.campanha && <span className="pill">{aberto.campanha}</span>}
                {aberto.url_antiga && <a href={aberto.url_antiga} target="_blank" rel="noreferrer" className="pill">Antes</a>}
                {aberto.url_nova && <a href={aberto.url_nova} target="_blank" rel="noreferrer" className="pill pill--dark">Depois</a>}
                {aberto.screenshot_url && <a href={aberto.screenshot_url} target="_blank" rel="noreferrer" className="pill pill--green">Screenshot</a>}
              </div>
              {aberto.email_assunto && (
                <div>
                  <div className="label-xs">Assunto</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#0f172a" }}>{aberto.email_assunto}</div>
                </div>
              )}
              <div>
                <div className="label-xs">Corpo do email</div>
                <pre className="email-pre">{aberto.email_corpo}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
