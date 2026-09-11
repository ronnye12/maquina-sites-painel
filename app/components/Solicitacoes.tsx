"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Solicitacao } from "@/lib/tipos";

const ST: Record<string, { label: string; bg: string; fg: string }> = {
  aberta:       { label: "Aberta",       bg: "#fef3c7", fg: "#b45309" },
  em_andamento: { label: "Em andamento", bg: "#dbeafe", fg: "#1d4ed8" },
  concluida:    { label: "Concluída",    bg: "#dcfce7", fg: "#15803d" },
};

export default function Solicitacoes({ solicitacoes, onChange }: { solicitacoes: Solicitacao[]; onChange: () => void }) {
  const [respondendo, setRespondendo] = useState<string | null>(null);
  const [resposta, setResposta] = useState("");

  async function mudarStatus(id: string, status: string) {
    await supabase.from("solicitacoes").update({ status, atualizado_em: new Date().toISOString() }).eq("id", id);
    onChange();
  }
  async function salvarResposta(id: string) {
    await supabase.from("solicitacoes").update({ resposta, atualizado_em: new Date().toISOString() }).eq("id", id);
    setRespondendo(null); setResposta("");
    onChange();
  }

  const abertas = solicitacoes.filter(s => s.status !== "concluida");
  const concluidas = solicitacoes.filter(s => s.status === "concluida");

  const Bloco = ({ titulo, itens }: { titulo: string; itens: Solicitacao[] }) => (
    <div className="panel">
      <div className="panel-title">{titulo} ({itens.length})</div>
      {itens.length === 0 && <div className="empty">nada aqui</div>}
      {itens.map(s => {
        const st = ST[s.status] || ST.aberta;
        return (
          <div key={s.id} className="cp-req" style={{ background: "#fafaf9" }}>
            <div className="cp-req-top">
              <div>
                <span className="cp-req-title">{s.empresa || "?"}: {s.titulo || "sem título"}</span>
                <span className="tag tag--muted" style={{ marginLeft: 8 }}>{s.pais || ""}</span>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span className="tag" style={{ background: st.bg, color: st.fg, fontWeight: 700 }}>{st.label}</span>
                <select className="s-select" style={{ flex: "none", width: 130 }} value={s.status} onChange={e => mudarStatus(s.id, e.target.value)}>
                  {Object.entries(ST).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            </div>
            {s.descricao && <div className="cp-req-desc">{s.descricao}</div>}
            {s.anexos?.length > 0 && (
              <div className="cp-anexos">
                {s.anexos.map((a, i) => <a key={i} className="pill" href={a.url} target="_blank" rel="noreferrer">{a.nome}</a>)}
              </div>
            )}
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 8 }}>
              {new Date(s.criado_em).toLocaleString("pt-BR")}
            </div>
            {s.resposta && <div className="cp-req-resp">Resposta ao cliente: {s.resposta}</div>}
            {respondendo === s.id ? (
              <div style={{ marginTop: 10 }}>
                <textarea className="textarea" rows={2} placeholder="Resposta que o cliente vê na área dele..." value={resposta} onChange={e => setResposta(e.target.value)} />
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button className="btn-primary" onClick={() => salvarResposta(s.id)}>Salvar resposta</button>
                  <button className="btn-ghost" onClick={() => { setRespondendo(null); setResposta(""); }}>Cancelar</button>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 10 }}>
                <button className="pill pill--btn pill--blue" onClick={() => { setRespondendo(s.id); setResposta(s.resposta || ""); }}>
                  {s.resposta ? "Editar resposta" : "Responder"}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="dash">
      <Bloco titulo="Solicitações abertas" itens={abertas} />
      <Bloco titulo="Concluídas" itens={concluidas} />
    </div>
  );
}
