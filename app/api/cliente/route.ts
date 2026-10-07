import { serverSupabase } from "@/lib/serverSupabase";

const MARCA = process.env.NEXT_PUBLIC_MARCA || "Web Agency";

async function tgAlert(texto: string) {
  const tok = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!tok || !chat) return;
  try {
    await fetch(`https://api.telegram.org/bot${tok}/sendMessage`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text: texto }),
    });
  } catch { /* best-effort */ }
}

// GET /api/cliente?token=xxx  -> lead + onboarding + solicitacoes
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token || token.trim().length < 8) {
    return Response.json(
      { erro: "token_invalido", msg: "Token ausente ou com menos de 8 caracteres" },
      { status: 400 }
    );
  }

  const tokenLimpo = token.trim();

  try {
    const sb = await serverSupabase();
    const { data: leads, error } = await sb
      .from("leads")
      .select("id, empresa, pais, status, url_nova, url_antiga, screenshot_url, pago")
      .eq("token_cliente", tokenLimpo)
      .limit(1);

    if (error) {
      console.error("[api/cliente GET] Erro ao consultar leads:", error.message, error.details || "");
      throw error;
    }

    const lead = leads?.[0];
    if (!lead) {
      return Response.json(
        { erro: "nao_encontrado", msg: "Link invalido ou lead nao encontrado" },
        { status: 404 }
      );
    }

    const [{ data: ob }, { data: reqs }] = await Promise.all([
      sb.from("onboarding").select("*").eq("lead_id", lead.id).limit(1),
      sb.from("solicitacoes").select("*").eq("lead_id", lead.id).order("criado_em", { ascending: false }),
    ]);

    return Response.json({ lead, onboarding: ob?.[0] || null, solicitacoes: reqs || [] });
  } catch (e: unknown) {
    const errMsg = e instanceof Error ? e.message : String(e);
    console.error("[api/cliente GET] Excecao interna:", errMsg);
    return Response.json(
      { erro: "interno", msg: "Falha interna do servidor ao carregar dados do cliente" },
      { status: 500 }
    );
  }
}

// POST /api/cliente  { token, tipo: "onboarding"|"solicitacao", dados: {...} }
export async function POST(request: Request) {
  let body: { token?: string; tipo?: string; dados?: Record<string, unknown> };
  try { body = await request.json(); } catch {
    return Response.json({ erro: "json_invalido" }, { status: 400 });
  }
  const { token, tipo, dados } = body;
  if (!token || token.trim().length < 8 || !tipo || !dados) {
    return Response.json({ erro: "campos_obrigatorios" }, { status: 400 });
  }

  const tokenLimpo = token.trim();

  try {
    const sb = await serverSupabase();
    const { data: leads, error: leadErr } = await sb
      .from("leads")
      .select("id, pais")
      .eq("token_cliente", tokenLimpo)
      .limit(1);

    if (leadErr) {
      console.error("[api/cliente POST] Erro ao verificar token:", leadErr.message);
      throw leadErr;
    }

    const lead = leads?.[0];
    if (!lead) {
      return Response.json({ erro: "nao_encontrado" }, { status: 404 });
    }

    if (tipo === "onboarding") {
      const registro = {
        lead_id: lead.id,
        descricao: String(dados.descricao || "").slice(0, 8000) || null,
        textos: String(dados.textos || "").slice(0, 8000) || null,
        dominio: String(dados.dominio || "").slice(0, 300) || null,
        registrador: String(dados.registrador || "").slice(0, 300) || null,
        dns_obs: String(dados.dns_obs || "").slice(0, 4000) || null,
        anexos: Array.isArray(dados.anexos) ? dados.anexos.slice(0, 20) : [],
        idioma: String(dados.idioma || "").slice(0, 5) || null,
        atualizado_em: new Date().toISOString(),
      };
      const { error } = await sb.from("onboarding").upsert(registro, { onConflict: "lead_id" });
      if (error) {
        console.error("[api/cliente POST] Erro no onboarding:", error.message);
        throw error;
      }
      return Response.json({ ok: true });
    }

    if (tipo === "solicitacao" || tipo === "cancelamento") {
      const cancel = tipo === "cancelamento";
      const titulo = cancel ? "CANCELAMENTO DE ASSINATURA" : String(dados.titulo || "").slice(0, 300);
      const descricao = String(dados.descricao || "").slice(0, 8000);
      if (!titulo && !descricao) return Response.json({ erro: "vazio" }, { status: 400 });
      const { data: empresas } = await sb.from("leads").select("empresa").eq("id", lead.id).limit(1);
      const empresa = empresas?.[0]?.empresa || "?";
      const { error } = await sb.from("solicitacoes").insert({
        lead_id: lead.id,
        titulo: titulo || null,
        descricao: descricao || null,
        anexos: Array.isArray(dados.anexos) ? dados.anexos.slice(0, 20) : [],
        status: "aberta",
      });
      if (error) {
        console.error("[api/cliente POST] Erro na solicitacao:", error.message);
        throw error;
      }
      await tgAlert(cancel
        ? `${MARCA}: pedido de CANCELAMENTO\n${empresa}\nMotivo: ${descricao || "nao informado"}\nCancele no painel do seu provedor de pagamento e responda o cliente.`
        : `${MARCA}: nova solicitacao de alteracao\n${empresa}\n${titulo}`);
      return Response.json({ ok: true });
    }

    return Response.json({ erro: "tipo_invalido" }, { status: 400 });
  } catch (e: unknown) {
    const errMsg = e instanceof Error ? e.message : String(e);
    console.error("[api/cliente POST] Excecao interna:", errMsg);
    return Response.json({ erro: "interno" }, { status: 500 });
  }
}
