export type Lead = {
  id: string;
  empresa: string;
  nicho: string | null;
  contato_whatsapp: string | null;
  contato_email: string | null;
  url_antiga: string | null;
  url_nova: string | null;
  status: string;
  valor: number | null;
  pago: boolean;
  observacoes: string | null;
  pais: string | null;
  campanha: string | null;
  email_assunto: string | null;
  email_corpo: string | null;
  screenshot_url: string | null;
  token_cliente?: string | null;
  created_at?: string;
  data_toque_1?: string | null;
  data_toque_2?: string | null;
  data_toque_3?: string | null;
  data_toque_4?: string | null;
};

export type Solicitacao = {
  id: string;
  lead_id: string;
  titulo: string | null;
  descricao: string | null;
  anexos: { nome: string; url: string }[];
  status: string; // aberta | em_andamento | concluida
  resposta: string | null;
  criado_em: string;
  empresa?: string; // join
  pais?: string | null;
};

export type Onboarding = {
  id: string;
  lead_id: string;
  descricao: string | null;
  textos: string | null;
  dominio: string | null;
  registrador: string | null;
  dns_obs: string | null;
  anexos: { nome: string; url: string }[];
  idioma: string | null;
  criado_em: string;
};

export type MetricaDia = {
  dia: string;
  pais: string;
  prospectados: number;
  enviados: number;
  opens: number;
  respostas: number;
  fechados: number;
  assinaturas: number;
};

export const PAISES = ["DE", "UK", "UKH", "BR"] as const;
export type Pais = (typeof PAISES)[number];

export const PAIS_LABEL: Record<string, string> = {
  DE: "DE", UK: "UK", UKH: "UK Saúde", BR: "BR",
};

function num(v: string | undefined, fallback: number): number {
  const n = Number(v);
  return v !== undefined && v !== "" && Number.isFinite(n) ? n : fallback;
}

// Precos por pais. Ajuste via NEXT_PUBLIC_PRECO_<PAIS>_UNICA / NEXT_PUBLIC_PRECO_<PAIS>_MENSAL no .env.
export const MOEDA: Record<string, { simbolo: string; unica: number; mensal: number; locale: string }> = {
  DE: { simbolo: "€", unica: num(process.env.NEXT_PUBLIC_PRECO_DE_UNICA, 499), mensal: num(process.env.NEXT_PUBLIC_PRECO_DE_MENSAL, 39), locale: "de-DE" },
  UK: { simbolo: "£", unica: num(process.env.NEXT_PUBLIC_PRECO_UK_UNICA, 299), mensal: num(process.env.NEXT_PUBLIC_PRECO_UK_MENSAL, 29), locale: "en-GB" },
  UKH: { simbolo: "£", unica: num(process.env.NEXT_PUBLIC_PRECO_UKH_UNICA, 599), mensal: num(process.env.NEXT_PUBLIC_PRECO_UKH_MENSAL, 49), locale: "en-GB" },
  BR: { simbolo: "R$", unica: num(process.env.NEXT_PUBLIC_PRECO_BR_UNICA, 2500), mensal: num(process.env.NEXT_PUBLIC_PRECO_BR_MENSAL, 199), locale: "pt-BR" },
};

// Links de checkout (Dodo Payments, Lemon Squeezy, Stripe Payment Links etc).
// Definidos em NEXT_PUBLIC_CHECKOUT_<PAIS>_UNICA / NEXT_PUBLIC_CHECKOUT_<PAIS>_MENSAL no .env.
// Vazio = botao de pagamento nao aparece na area do cliente daquele pais.
export const CHECKOUT: Record<string, { unica: string; mensal: string }> = {
  DE: {
    unica: process.env.NEXT_PUBLIC_CHECKOUT_DE_UNICA || "",
    mensal: process.env.NEXT_PUBLIC_CHECKOUT_DE_MENSAL || "",
  },
  UK: {
    unica: process.env.NEXT_PUBLIC_CHECKOUT_UK_UNICA || "",
    mensal: process.env.NEXT_PUBLIC_CHECKOUT_UK_MENSAL || "",
  },
  UKH: {
    unica: process.env.NEXT_PUBLIC_CHECKOUT_UKH_UNICA || "",
    mensal: process.env.NEXT_PUBLIC_CHECKOUT_UKH_MENSAL || "",
  },
  BR: {
    unica: process.env.NEXT_PUBLIC_CHECKOUT_BR_UNICA || "",
    mensal: process.env.NEXT_PUBLIC_CHECKOUT_BR_MENSAL || "",
  },
};

export const COLS: { key: string; label: string; color: string }[] = [
  { key: "prospectado",       label: "PROSPECTADO", color: "#94a3b8" },
  { key: "construido",        label: "CONSTRUIDO",  color: "#8b5cf6" },
  { key: "liberado",          label: "LIBERADO",    color: "#3b82f6" },
  { key: "opener_enviado",    label: "OPENER",      color: "#f59e0b" },
  { key: "followup_enviado",  label: "FU 1",        color: "#f97316" },
  { key: "followup2_enviado", label: "FU 2",        color: "#ef4444" },
  { key: "followup3_enviado", label: "FU 3",        color: "#dc2626" },
  { key: "respondeu",         label: "RESPONDEU",   color: "#22c55e" },
  { key: "negociando",        label: "NEGOCIANDO",  color: "#0ea5e9" },
  { key: "fechado",           label: "FECHADO",     color: "#10b981" },
  { key: "assinatura_ativa",  label: "ASSINATURA",  color: "#14b8a6" },
  { key: "publicado",         label: "PUBLICADO",   color: "#059669" },
  { key: "assinatura_cancelada", label: "CANCELADA", color: "#f43f5e" },
  { key: "descartado",        label: "DESCARTADO",  color: "#cbd5e1" },
];

export function getNichoStyle(nicho: string | null) {
  const n = (nicho || "").toLowerCase();
  if (n.includes("arquiteto") || n.includes("architect") || n.includes("architektur") || n.includes("planung"))
    return { bg: "#ede9fe", color: "#7c3aed" };
  if (n.includes("constru") || n.includes("bauunternehmen") || n.includes("bau") || n.includes("engenharia") || n.includes("builder"))
    return { bg: "#dbeafe", color: "#1d4ed8" };
  if (n.includes("reforma") || n.includes("sanierung") || n.includes("pintura") || n.includes("roof"))
    return { bg: "#fef3c7", color: "#d97706" };
  if (n.includes("marceneiro") || n.includes("tischler") || n.includes("zimmerei") || n.includes("holzbau") || n.includes("join"))
    return { bg: "#ffedd5", color: "#c2410c" };
  if (n.includes("dent") || n.includes("orthodont") || n.includes("implant"))
    return { bg: "#e0f2fe", color: "#0369a1" };
  if (n.includes("aesthet") || n.includes("estetic") || n.includes("facial") || n.includes("cosmet"))
    return { bg: "#fce7f3", color: "#be185d" };
  if (n.includes("physio") || n.includes("fisio") || n.includes("chiro") || n.includes("quiro"))
    return { bg: "#dcfce7", color: "#15803d" };
  return { bg: "#f1f5f9", color: "#64748b" };
}

export function isTesteLead(l: Pick<Lead, "empresa" | "campanha" | "observacoes">): boolean {
  const campanha = (l.campanha || "").toLowerCase();
  const empresa = l.empresa.trim().toUpperCase();
  const obs = (l.observacoes || "").toLowerCase();
  return campanha.includes("stripe-test") || campanha.includes("teste") || empresa.startsWith("TESTE-") || empresa.startsWith("TESTE ") || obs.includes("stripe test");
}
