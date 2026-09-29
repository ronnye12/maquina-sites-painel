"use client";

import { Lead, Onboarding, MOEDA, isTesteLead } from "@/lib/tipos";

const STATUS_CLIENTE = ["fechado", "assinatura_ativa", "publicado", "assinatura_cancelada"];

export default function Clientes({ leads, onboardings }: { leads: Lead[]; onboardings: Onboarding[] }) {
  const comerciais = leads.filter(l => !isTesteLead(l));
  const testes = leads.filter(l => isTesteLead(l) && (STATUS_CLIENTE.includes(l.status) || l.pago));
  const clientes = comerciais.filter(l => STATUS_CLIENTE.includes(l.status) || l.pago);
  const obPorLead = new Map(onboardings.map(o => [o.lead_id, o]));

  const badge = (s: string) => {
    if (s === "assinatura_ativa") return { t: "ASSINATURA", bg: "#ccfbf1", fg: "#0f766e" };
    if (s === "assinatura_cancelada") return { t: "CANCELADA", bg: "#ffe4e6", fg: "#be123c" };
    if (s === "publicado") return { t: "PUBLICADO", bg: "#d1fae5", fg: "#047857" };
    return { t: "COTA ÚNICA", bg: "#dbeafe", fg: "#1d4ed8" };
  };

  return (
    <div className="dash">
      <div className="panel">
        <div className="panel-title">Clientes ({clientes.length})</div>
        <div className="panel-sub">clientes comerciais (testes Stripe isolados abaixo)</div>
        {clientes.length === 0 && <div className="empty">Nenhum cliente comercial ainda. O primeiro está chegando.</div>}
        {clientes.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Empresa</th><th>País</th><th>Plano</th><th>Valor</th>
                <th>Onboarding</th><th>Domínio</th><th>Links</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map(l => {
                const b = badge(l.status);
                const ob = obPorLead.get(l.id);
                const m = MOEDA[l.pais || "DE"] || MOEDA.DE;
                const valor = l.status === "assinatura_ativa"
                  ? `${m.simbolo}${m.mensal}/mês`
                  : `${m.simbolo}${l.valor || m.unica}`;
                return (
                  <tr key={l.id}>
                    <td style={{ fontWeight: 600, color: "#0f172a" }}>{l.empresa}</td>
                    <td>{l.pais || "BR"}</td>
                    <td><span className="tag" style={{ background: b.bg, color: b.fg, fontWeight: 700 }}>{b.t}</span></td>
                    <td className="num">{valor}</td>
                    <td>{ob
                      ? <span className="tag" style={{ background: "#dcfce7", color: "#15803d" }}>preenchido</span>
                      : <span className="tag tag--muted">pendente</span>}</td>
                    <td>{ob?.dominio || "-"}</td>
                    <td>
                      <span className="pills" style={{ marginTop: 0 }}>
                        {l.url_nova && <a className="pill" href={l.url_nova} target="_blank" rel="noreferrer">Site</a>}
                        {l.token_cliente && (
                          <a className="pill pill--blue" href={`/c/${l.token_cliente}`} target="_blank" rel="noreferrer">Área do cliente</a>
                        )}
                        {l.contato_email && <a className="pill" href={`mailto:${l.contato_email}`}>Email</a>}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Detalhe dos onboardings preenchidos */}
      {clientes.filter(l => obPorLead.get(l.id)).map(l => {
        const ob = obPorLead.get(l.id)!;
        return (
          <div className="panel" key={l.id}>
            <div className="panel-title">{l.empresa}: dados do cliente</div>
            <div className="panel-sub">enviado em {new Date(ob.criado_em).toLocaleDateString("pt-BR")}</div>
            <table className="table">
              <tbody>
                {ob.descricao && <tr><td style={{ width: 160, fontWeight: 600 }}>Sobre o negócio</td><td style={{ whiteSpace: "pre-wrap" }}>{ob.descricao}</td></tr>}
                {ob.textos && <tr><td style={{ fontWeight: 600 }}>Alterações</td><td style={{ whiteSpace: "pre-wrap" }}>{ob.textos}</td></tr>}
                {ob.dominio && <tr><td style={{ fontWeight: 600 }}>Domínio</td><td>{ob.dominio}</td></tr>}
                {ob.registrador && <tr><td style={{ fontWeight: 600 }}>Registrador</td><td>{ob.registrador}</td></tr>}
                {ob.dns_obs && <tr><td style={{ fontWeight: 600 }}>DNS / acesso</td><td style={{ whiteSpace: "pre-wrap" }}>{ob.dns_obs}</td></tr>}
                {ob.anexos?.length > 0 && (
                  <tr><td style={{ fontWeight: 600 }}>Anexos</td><td>
                    <span className="pills" style={{ marginTop: 0 }}>
                      {ob.anexos.map((a, i) => <a key={i} className="pill" href={a.url} target="_blank" rel="noreferrer">{a.nome}</a>)}
                    </span>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        );
      })}
      {testes.length > 0 && (
        <div className="panel" style={{ opacity: 0.9 }}>
          <div className="panel-title">Registros de teste ({testes.length})</div>
          <div className="panel-sub">não contam como clientes comerciais · mantidos apenas para auditoria</div>
          <table className="table">
            <thead><tr><th>Empresa</th><th>País</th><th>Status</th><th>Valor</th><th>Email</th></tr></thead>
            <tbody>
              {testes.map(l => (
                <tr key={l.id}>
                  <td style={{ fontWeight: 600, color: "#64748b" }}>{l.empresa}</td>
                  <td style={{ color: "#64748b" }}>{l.pais || "—"}</td>
                  <td><span className="tag tag--muted">{l.status}</span></td>
                  <td className="num" style={{ color: "#64748b" }}>{l.valor ? `£/€ ${l.valor}` : "—"}</td>
                  <td style={{ color: "#64748b", fontSize: 12 }}>{l.contato_email || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
