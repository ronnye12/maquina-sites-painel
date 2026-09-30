"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Lead } from "@/lib/tipos";

// Importa UM lead a partir de JSON (ex.: goodwells-crm-payload.json) usando a sessao autenticada
// do proprio painel (Supabase client + RLS). Nenhuma chave privilegiada no browser.
// So escreve em colunas que existem em `leads`; dados extras vao para `observacoes`.

type Payload = Record<string, unknown>;

const STATUS_VALIDOS = [
  "prospectado", "construido", "liberado", "opener_enviado", "followup_enviado", "followup2_enviado",
  "followup3_enviado", "respondeu", "negociando", "fechado", "assinatura_ativa", "publicado",
  "assinatura_cancelada", "descartado",
];

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}
function dominio(u: string | null | undefined): string {
  if (!u) return "";
  try {
    return new URL(/^https?:\/\//i.test(u) ? u : "http://" + u).hostname.toLowerCase().replace(/^www\./, "");
  } catch { return ""; }
}
function listaTxt(v: unknown): string[] {
  return Array.isArray(v) ? v.map(x => String(x).trim()).filter(Boolean) : [];
}

export function validarPayload(p: Payload, pais: string): { erros: string[]; lead?: Partial<Lead>; companyNumber: string } {
  const erros: string[] = [];
  const empresa = str(p.company_name);
  const email = str(p.email).toLowerCase();
  const urlAntiga = str(p.old_url);
  const urlNova = str(p.url_nova);
  const corpo = str(p.email_corpo);
  const assunto = str(p.email_subject);
  const companyNumber = str(p.company_number);

  if (!empresa) erros.push("company_name obrigatorio");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) erros.push("email invalido");
  if (str(p.country) && str(p.country).toUpperCase() !== pais) erros.push(`country deve ser ${pais} neste funil`);
  if (urlAntiga && !dominio(urlAntiga)) erros.push("old_url invalida");
  if (urlNova && !/^https:\/\/[^\s]+$/i.test(urlNova)) erros.push("url_nova deve ser https://");
  if (/\{\{|\}\}/.test(corpo + assunto)) erros.push("email com placeholder {{...}}");
  if (p.qa_passed === true && !urlNova) erros.push("qa_passed=true exige url_nova");
  if (erros.length) return { erros, companyNumber };

  // status: aceita so um status real do kanban; status_pipeline READY_* (pronto para envio) => "construido".
  // ("liberado" nao e usado por padrao para nao acionar disparos do servidor.)
  const pedido = str(p.status);
  const status = STATUS_VALIDOS.includes(pedido) ? pedido : "construido";

  const obs: string[] = ["[importado via JSON]"];
  const add = (k: string, v: string | undefined) => { if (v) obs.push(`${k}: ${v}`); };
  add("legal_name", str(p.legal_name));
  add("company_number", companyNumber);
  add("company_status", str(p.company_status));
  add("city", str(p.city));
  add("status_pipeline", str(p.status_pipeline));
  add("qa_passed", typeof p.qa_passed === "boolean" ? String(p.qa_passed) : "");
  add("qa_note", str(p.qa_note));
  add("screenshot_path", str(p.screenshot_path));
  const prob = listaTxt(p.problems); if (prob.length) obs.push("problems:\n- " + prob.join("\n- "));
  const serv = listaTxt(p.services); if (serv.length) obs.push("services: " + serv.join(", "));

  return {
    erros,
    companyNumber,
    lead: {
      empresa,
      contato_email: email,
      url_antiga: urlAntiga || null,
      url_nova: urlNova || null,
      email_assunto: assunto || null,
      email_corpo: corpo || null,
      screenshot_url: str(p.screenshot_url) || null,
      pais,
      status,
      pago: false,
      campanha: "import-json-uk",
      observacoes: obs.join("\n"),
    },
  };
}

export default function ImportarLead({ pais, onCriado }: { pais: string; onCriado: (l: Lead) => void }) {
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState("");
  const [msgs, setMsgs] = useState<string[]>([]);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  function fechar() { setAberto(false); setTexto(""); setMsgs([]); setOk(false); }

  async function lerArquivo(f: File | undefined) {
    if (!f) return;
    setTexto(await f.text());
    setMsgs([]); setOk(false);
  }

  async function importar() {
    setBusy(true); setMsgs([]); setOk(false);
    try {
      let p: Payload;
      try {
        const j = JSON.parse(texto);
        if (!j || typeof j !== "object" || Array.isArray(j)) throw new Error();
        p = j as Payload;
      } catch { setMsgs(["JSON invalido: esperado um objeto."]); return; }

      const v = validarPayload(p, pais);
      if (v.erros.length || !v.lead) { setMsgs(v.erros); return; }
      const novo = v.lead;

      // duplicate check (email, dominio, company_number) contra todos os leads visiveis para o usuario
      const { data: existentes, error: eSel } = await supabase
        .from("leads").select("id,empresa,contato_email,url_antiga,url_nova,observacoes");
      if (eSel) { setMsgs(["Falha ao checar duplicidade: " + eSel.message]); return; }
      const dups: string[] = [];
      const dNovo = dominio(novo.url_antiga);
      for (const l of (existentes || []) as Pick<Lead, "id" | "empresa" | "contato_email" | "url_antiga" | "url_nova" | "observacoes">[]) {
        if (novo.contato_email && (l.contato_email || "").toLowerCase() === novo.contato_email) dups.push(`${l.empresa}: mesmo email`);
        else if (dNovo && (dominio(l.url_antiga) === dNovo || dominio(l.url_nova) === dNovo)) dups.push(`${l.empresa}: mesmo dominio`);
        else if (v.companyNumber && new RegExp(`company_number:\\s*${v.companyNumber}\\b`).test(l.observacoes || "")) dups.push(`${l.empresa}: mesmo company_number`);
      }
      if (dups.length) { setMsgs(["Duplicado, nada foi criado:", ...dups]); return; }

      const { data, error } = await supabase.from("leads").insert(novo).select("*").single();
      if (error || !data) { setMsgs(["Falha ao inserir: " + (error?.message || "sem retorno") + " (RLS/colunas)"]); return; }
      setOk(true);
      setMsgs([`Lead criado: ${(data as Lead).empresa}`]);
      onCriado(data as Lead);
      fechar();
    } finally { setBusy(false); }
  }

  return (
    <>
      <button className="btn-ghost" onClick={() => setAberto(true)}>Importar JSON</button>
      {aberto && (
        <div className="overlay" onClick={fechar}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 680 }}>
            <div className="modal-head">
              <div>
                <div className="modal-title">Importar lead (JSON) · Funil {pais}</div>
                <div className="modal-sub">Cria 1 lead. Valida, checa duplicidade (email, dominio, company_number) e salva.</div>
              </div>
              <button className="btn-ghost" onClick={fechar}>Fechar</button>
            </div>
            <div className="modal-body">
              <input type="file" accept=".json,application/json" onChange={e => lerArquivo(e.target.files?.[0])} />
              <textarea className="textarea" rows={12} placeholder='Cole o JSON aqui (ex.: goodwells-crm-payload.json)' value={texto}
                onChange={e => { setTexto(e.target.value); setMsgs([]); setOk(false); }} />
              {msgs.length > 0 && (
                <div className="alerta" style={ok ? { background: "#dcfce7", color: "#166534" } : undefined}>
                  {msgs.map((m, i) => <div key={i}>{m}</div>)}
                </div>
              )}
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button className="btn-primary" disabled={busy || !texto.trim()} onClick={importar}>{busy ? "Importando…" : "Validar e importar"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
