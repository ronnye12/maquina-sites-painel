import { NextRequest, NextResponse } from "next/server";

const VERCEL_TOKEN = process.env.VERCEL_TOKEN!;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID!;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const GITHUB_ORG = process.env.GITHUB_ORG!;

function extrairNome(urlNova: string): string | null {
  try {
    const hostname = new URL(urlNova).hostname;
    if (hostname.endsWith(".vercel.app")) return hostname.replace(".vercel.app", "");
  } catch {}
  return null;
}

export async function POST(req: NextRequest) {
  const { urlNova } = await req.json();

  if (!urlNova) return NextResponse.json({ ok: true, msg: "sem urlNova" });

  const nome = extrairNome(urlNova);
  if (!nome) return NextResponse.json({ ok: true, msg: "url nao eh vercel.app" });

  const erros: string[] = [];

  // Deletar projeto na Vercel
  const vRes = await fetch(
    `https://api.vercel.com/v9/projects/${nome}?teamId=${VERCEL_TEAM_ID}`,
    { method: "DELETE", headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } }
  ).catch((e) => { erros.push(`Vercel fetch: ${e}`); return null; });

  if (vRes && !vRes.ok && vRes.status !== 404) {
    erros.push(`Vercel ${vRes.status}: ${await vRes.text()}`);
  }

  // Deletar repo no GitHub
  const gRes = await fetch(
    `https://api.github.com/repos/${GITHUB_ORG}/${nome}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  ).catch((e) => { erros.push(`GitHub fetch: ${e}`); return null; });

  if (gRes && !gRes.ok && gRes.status !== 404) {
    erros.push(`GitHub ${gRes.status}: ${await gRes.text()}`);
  }

  if (erros.length > 0) return NextResponse.json({ ok: false, erros }, { status: 500 });

  return NextResponse.json({ ok: true, nome });
}
