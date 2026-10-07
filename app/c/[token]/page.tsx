"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { CSS } from "@/lib/css";
import { DICTS, Lang, langFromPais } from "@/lib/i18n";
import { CHECKOUT, MOEDA } from "@/lib/tipos";

type LeadPub = {
  id: string; empresa: string; pais: string | null; status: string;
  url_nova: string | null; url_antiga: string | null; screenshot_url: string | null; pago: boolean;
};
type Req = { id: string; titulo: string | null; descricao: string | null; status: string; resposta: string | null; criado_em: string };
type Anexo = { nome: string; url: string };

const PAGO_STATUS = ["fechado", "assinatura_ativa", "publicado"];

// Mensagens de indisponibilidade temporária de serviço por idioma
const MSG_INDISPONIVEL: Record<Lang, string> = {
  en: "Service temporarily unavailable. Please try again in a few moments.",
  de: "Dienst vorübergehend nicht verfügbar. Bitte versuchen Sie es in wenigen Augenblicken erneut.",
  pt: "Serviço temporariamente indisponível. Tente novamente em instantes.",
};

export default function ClientPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);

  const [lead, setLead] = useState<LeadPub | null>(null);
  const [reqs, setReqs] = useState<Req[]>([]);
  const [obJaEnviado, setObJaEnviado] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erroTipo, setErroTipo] = useState<"nenhum" | "invalido" | "indisponivel">("nenhum");
  const [lang, setLang] = useState<Lang>("en");

  // onboarding form
  const [descricao, setDescricao] = useState("");
  const [textos, setTextos] = useState("");
  const [dominio, setDominio] = useState("");
  const [registrador, setRegistrador] = useState("");
  const [dnsObs, setDnsObs] = useState("");
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [enviandoOb, setEnviandoOb] = useState(false);
  const [obOk, setObOk] = useState(false);

  // solicitacao form
  const [reqTitulo, setReqTitulo] = useState("");
  const [reqDesc, setReqDesc] = useState("");
  const [reqAnexos, setReqAnexos] = useState<Anexo[]>([]);
  const [enviandoReq, setEnviandoReq] = useState(false);
  const [reqOk, setReqOk] = useState(false);

  const [subindo, setSubindo] = useState(false);
  const fileOb = useRef<HTMLInputElement>(null);
  const fileReq = useRef<HTMLInputElement>(null);

  // cancelamento de assinatura
  const [cancelando, setCancelando] = useState(false);
  const [cancelMotivo, setCancelMotivo] = useState("");
  const [enviandoCancel, setEnviandoCancel] = useState(false);
  const [cancelOk, setCancelOk] = useState(false);

  async function enviarCancelamento() {
    setEnviandoCancel(true);
    const r = await fetch("/api/cliente", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, tipo: "cancelamento", dados: { descricao: cancelMotivo } }),
    });
    setEnviandoCancel(false);
    if (r.ok) { setCancelOk(true); setCancelando(false); }
  }

  const t = DICTS[lang];
  const pago = lead ? (lead.pago || PAGO_STATUS.includes(lead.status)) : false;
  const moeda = MOEDA[lead?.pais || "DE"] || MOEDA.DE;
  const checkout = CHECKOUT[lead?.pais || "DE"] || CHECKOUT.DE;

  const carregar = useCallback(async () => {
    try {
      const r = await fetch(`/api/cliente?token=${encodeURIComponent(token)}`);
      if (!r.ok) {
        // Distingue 404 (token inexistente) de 500 (erro de servidor)
        if (r.status === 404 || r.status === 400) {
          setErroTipo("invalido");
        } else {
          setErroTipo("indisponivel");
        }
        setCarregando(false);
        return;
      }
      const d = await r.json();
      setLead(d.lead);
      setReqs(d.solicitacoes || []);
      setLang(langFromPais(d.lead?.pais));
      if (d.onboarding) {
        setObJaEnviado(true);
        setDescricao(d.onboarding.descricao || "");
        setTextos(d.onboarding.textos || "");
        setDominio(d.onboarding.dominio || "");
        setRegistrador(d.onboarding.registrador || "");
        setDnsObs(d.onboarding.dns_obs || "");
        setAnexos(d.onboarding.anexos || []);
      }
      setErroTipo("nenhum");
      setCarregando(false);
    } catch {
      setErroTipo("indisponivel");
      setCarregando(false);
    }
  }, [token]);

  useEffect(() => { carregar(); }, [carregar]);

  async function upload(files: FileList | null, destino: "ob" | "req") {
    if (!files?.length) return;
    setSubindo(true);
    for (const f of Array.from(files).slice(0, 10)) {
      const fd = new FormData();
      fd.append("token", token);
      fd.append("file", f);
      try {
        const r = await fetch("/api/upload", { method: "POST", body: fd });
        const d = await r.json();
        if (d.ok) {
          const nx = { nome: d.nome as string, url: d.url as string };
          if (destino === "ob") setAnexos(p => [...p, nx]); else setReqAnexos(p => [...p, nx]);
        }
      } catch { /* ignora arquivo com erro */ }
    }
    setSubindo(false);
  }

  async function enviarOnboarding() {
    setEnviandoOb(true);
    const r = await fetch("/api/cliente", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, tipo: "onboarding", dados: { descricao, textos, dominio, registrador, dns_obs: dnsObs, anexos, idioma: lang } }),
    });
    setEnviandoOb(false);
    if (r.ok) { setObOk(true); setObJaEnviado(true); }
  }

  async function enviarSolicitacao() {
    if (!reqTitulo.trim() && !reqDesc.trim()) return;
    setEnviandoReq(true);
    const r = await fetch("/api/cliente", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, tipo: "solicitacao", dados: { titulo: reqTitulo, descricao: reqDesc, anexos: reqAnexos } }),
    });
    setEnviandoReq(false);
    if (r.ok) {
      setReqOk(true); setReqTitulo(""); setReqDesc(""); setReqAnexos([]);
      carregar();
      setTimeout(() => setReqOk(false), 5000);
    }
  }

  if (carregando) return (
    <><style>{CSS}</style>
    <div className="loading-screen"><div className="dots"><span /><span /><span /></div></div></>
  );

  if (erroTipo === "indisponivel") return (
    <><style>{CSS}</style>
    <div className="cp-root"><div className="cp-wrap">
      <div className="cp-brand">{DICTS[lang].brand}</div>
      <div className="alerta alerta--yellow" style={{ marginTop: 24 }}>{MSG_INDISPONIVEL[lang]}</div>
      <div style={{ marginTop: 14 }}>
        <button className="pill pill--btn" onClick={() => { setCarregando(true); carregar(); }}>
          {lang === "pt" ? "Tentar novamente" : lang === "de" ? "Erneut versuchen" : "Try again"}
        </button>
      </div>
    </div></div></>
  );

  if (erroTipo === "invalido" || !lead) return (
    <><style>{CSS}</style>
    <div className="cp-root"><div className="cp-wrap">
      <div className="cp-brand">{DICTS[lang].brand}</div>
      <div className="alerta alerta--red" style={{ marginTop: 24 }}>{DICTS[lang].invalid}</div>
    </div></div></>
  );

  const stLabel: Record<string, string> = { aberta: t.st_aberta, em_andamento: t.st_em_andamento, concluida: t.st_concluida };

  return (
    <>
      <style>{CSS}</style>
      <div className="cp-root" style={{ position: "relative" }}>
        <div className="cp-lang">
          {(["de", "en", "pt"] as Lang[]).map(l => (
            <button key={l} className={lang === l ? "on" : ""} onClick={() => setLang(l)}>{l.toUpperCase()}</button>
          ))}
        </div>

        <div className="cp-wrap">
          <div className="cp-brand">{t.brand}</div>
          <h1 className="cp-title">{lead.empresa}</h1>
          <p className="cp-sub">{t.hero_sub}</p>

          {pago && <div className="cp-ok" style={{ marginTop: 18 }}>{t.paid_badge}</div>}

          {lead.screenshot_url && (
            <a href={lead.url_nova || "#"} target="_blank" rel="noreferrer">
              {/* screenshot dinâmico externo (Supabase Storage); img simples é adequado aqui */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={lead.screenshot_url} alt={lead.empresa} className="cp-shot" />
            </a>
          )}
          {lead.url_nova && (
            <div style={{ marginTop: 14 }}>
              <a className="pill pill--dark" href={lead.url_nova} target="_blank" rel="noreferrer">{t.preview_btn}</a>
            </div>
          )}

          {/* ── Pagamento (só se ainda não pagou) ── */}
          {!pago && (
            <div className="cp-section">
              <h2 className="cp-h2">{t.pay_title}</h2>
              <p className="cp-p">{t.pay_sub}</p>
              <div className="cp-pay">
                <div className="cp-plan">
                  <span className="cp-plan-name">{t.plan_once}</span>
                  <span className="cp-plan-price">{moeda.simbolo}{moeda.unica}</span>
                  <span className="cp-plan-desc">{t.plan_once_desc}</span>
                  {checkout.unica
                    ? <a className="cp-plan-btn" href={checkout.unica} target="_blank" rel="noreferrer">{t.pay_once_btn}</a>
                    : <span className="cp-plan-desc" style={{ fontWeight: 600 }}>{t.pay_bank}</span>}
                </div>
                <div className="cp-plan cp-plan--hi">
                  <span className="cp-plan-name">{t.plan_month}</span>
                  <span className="cp-plan-price">{moeda.simbolo}{moeda.mensal}<small>{t.per_month}</small></span>
                  <span className="cp-plan-desc">{t.plan_month_desc}</span>
                  {checkout.mensal
                    ? <a className="cp-plan-btn" href={checkout.mensal} target="_blank" rel="noreferrer">{t.pay_month_btn}</a>
                    : <span className="cp-plan-desc" style={{ fontWeight: 600 }}>{t.pay_bank}</span>}
                </div>
              </div>
              {checkout.unica && <p className="cp-p" style={{ marginTop: 12, fontSize: 12 }}>{t.pay_bank}</p>}
            </div>
          )}

          {/* ── Onboarding ── */}
          <div className="cp-section">
            <h2 className="cp-h2">{t.ob_title}</h2>
            <p className="cp-p">{t.ob_sub}</p>

            {obOk && <div className="cp-ok" style={{ marginBottom: 14 }}>{t.ob_sent}</div>}

            <div className="cp-field">
              <label className="cp-label">{t.ob_desc}</label>
              <textarea className="textarea" rows={4} placeholder={t.ob_desc_ph} value={descricao} onChange={e => setDescricao(e.target.value)} />
            </div>
            <div className="cp-field">
              <label className="cp-label">{t.ob_textos}</label>
              <textarea className="textarea" rows={3} placeholder={t.ob_textos_ph} value={textos} onChange={e => setTextos(e.target.value)} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="cp-field">
                <label className="cp-label">{t.ob_dominio}</label>
                <input className="input" placeholder={t.ob_dominio_ph} value={dominio} onChange={e => setDominio(e.target.value)} />
              </div>
              <div className="cp-field">
                <label className="cp-label">{t.ob_registrador}</label>
                <input className="input" placeholder={t.ob_registrador_ph} value={registrador} onChange={e => setRegistrador(e.target.value)} />
              </div>
            </div>
            <div className="cp-field">
              <label className="cp-label">{t.ob_dns}</label>
              <textarea className="textarea" rows={2} placeholder={t.ob_dns_ph} value={dnsObs} onChange={e => setDnsObs(e.target.value)} />
            </div>

            <div className="cp-field">
              <label className="cp-label">{t.ob_anexos}</label>
              <div className="cp-file" onClick={() => fileOb.current?.click()}>
                {subindo ? t.sending : t.ob_anexos_hint}
              </div>
              <input ref={fileOb} type="file" multiple hidden accept="image/*,.pdf,.zip,.txt" onChange={e => upload(e.target.files, "ob")} />
              {anexos.length > 0 && (
                <div className="cp-anexos">
                  {anexos.map((a, i) => (
                    <a key={i} className="pill" href={a.url} target="_blank" rel="noreferrer">{a.nome}</a>
                  ))}
                </div>
              )}
            </div>

            <button className="btn-primary" disabled={enviandoOb || subindo} onClick={enviarOnboarding}>
              {enviandoOb ? t.sending : t.ob_send}
            </button>
            {obJaEnviado && !obOk && <p className="cp-p" style={{ marginTop: 10, fontSize: 12 }}>{t.ob_sent}</p>}
          </div>

          {/* ── Seu plano (pós-pagamento): transparência total + cancelar ── */}
          {pago && (
            <div className="cp-section">
              <h2 className="cp-h2">{t.plan_title}</h2>
              <div className="cp-plan" style={{ marginTop: 10 }}>
                <span className="cp-plan-name">{lead.status === "assinatura_ativa" ? t.plan_month : t.plan_once}</span>
                {lead.status === "assinatura_ativa" && (
                  <span className="cp-plan-price">{moeda.simbolo}{moeda.mensal}<small>{t.per_month}</small></span>
                )}
                <span className="cp-plan-desc">
                  {lead.status === "assinatura_ativa" ? t.plan_month_active : t.plan_once_active}
                </span>
                {lead.status === "assinatura_ativa" && !cancelOk && (
                  cancelando ? (
                    <div style={{ marginTop: 8 }}>
                      <p className="cp-p" style={{ marginBottom: 8 }}>{t.plan_cancel_q}</p>
                      <textarea className="textarea" rows={2} value={cancelMotivo} onChange={e => setCancelMotivo(e.target.value)} />
                      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        <button className="pill pill--btn pill--danger" onClick={enviarCancelamento} disabled={enviandoCancel}>
                          {enviandoCancel ? t.sending : t.plan_cancel_confirm}
                        </button>
                        <button className="pill pill--btn" onClick={() => setCancelando(false)}>{t.plan_cancel_back}</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginTop: 6 }}>
                      <button className="pill pill--btn pill--danger" onClick={() => setCancelando(true)}>{t.plan_cancel_btn}</button>
                    </div>
                  )
                )}
                {cancelOk && <div className="cp-ok" style={{ marginTop: 8 }}>{t.plan_cancel_sent}</div>}
              </div>
            </div>
          )}

          {/* ── Solicitações (área do cliente pós-pagamento) ── */}
          {pago && (
            <div className="cp-section">
              <h2 className="cp-h2">{t.req_title}</h2>
              <p className="cp-p">{t.req_sub}</p>

              {reqOk && <div className="cp-ok" style={{ marginBottom: 14 }}>{t.req_sent}</div>}

            <div className="cp-field">
              <label className="cp-label">{t.req_new}</label>
              <input className="input" placeholder={t.req_titulo_ph} value={reqTitulo} onChange={e => setReqTitulo(e.target.value)} style={{ marginBottom: 8 }} />
              <textarea className="textarea" rows={3} placeholder={t.req_desc_ph} value={reqDesc} onChange={e => setReqDesc(e.target.value)} />
              <div className="cp-file" style={{ marginTop: 8 }} onClick={() => fileReq.current?.click()}>
                {subindo ? t.sending : t.ob_anexos_hint}
              </div>
              <input ref={fileReq} type="file" multiple hidden accept="image/*,.pdf,.zip,.txt" onChange={e => upload(e.target.files, "req")} />
              {anexos.length > 0 && (
                <div className="cp-anexos">
                  {anexos.map((a, i) => (
                    <a key={i} className="pill" href={a.url} target="_blank" rel="noreferrer">{a.nome}</a>
                  ))}
                </div>
              )}
              <div style={{ marginTop: 10 }}>
                <button className="btn-primary" disabled={enviandoReq || subindo} onClick={enviarSolicitacao}>
                  {enviandoReq ? t.sending : t.req_send}
                </button>
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              {reqs.length === 0 && <div className="empty">{t.req_none}</div>}
              {reqs.map(r => (
                <div key={r.id} className="cp-req">
                  <div className="cp-req-top">
                    <span className="cp-req-title">{r.titulo || "-"}</span>
                    <span className="tag" style={{
                      background: r.status === "concluida" ? "#dcfce7" : r.status === "em_andamento" ? "#dbeafe" : "#fef3c7",
                      color: r.status === "concluida" ? "#15803d" : r.status === "em_andamento" ? "#1d4ed8" : "#b45309",
                    }}>{stLabel[r.status] || r.status}</span>
                  </div>
                  {r.descricao && <div className="cp-req-desc">{r.descricao}</div>}
                  {r.resposta && <div className="cp-req-resp">{r.resposta}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="cp-section" style={{ borderTop: "1px solid rgba(0,0,0,0.07)", paddingTop: 20 }}>
          <p className="cp-p" style={{ fontSize: 12, marginBottom: 0 }}>{t.footer}</p>
        </div>
      </div>
    </div>
  </>
  );
}
