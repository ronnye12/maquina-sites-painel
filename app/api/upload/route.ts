import { serverSupabase, STORAGE_URL } from "@/lib/serverSupabase";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const OK_TYPES = /^(image\/|application\/pdf|application\/zip|text\/plain)/;

// POST /api/upload  multipart: token, file
export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const token = String(form.get("token") || "");
    const file = form.get("file");
    if (!token || token.length < 8 || !(file instanceof File)) {
      return Response.json({ erro: "campos" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) return Response.json({ erro: "grande" }, { status: 413 });
    if (!OK_TYPES.test(file.type || "")) return Response.json({ erro: "tipo" }, { status: 415 });

    const sb = await serverSupabase();
    const { data: leads } = await sb.from("leads").select("id").eq("token_cliente", token).limit(1);
    if (!leads?.[0]) return Response.json({ erro: "nao_encontrado" }, { status: 404 });

    const limpo = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
    const caminho = `${leads[0].id}/${Date.now()}-${limpo}`;
    const buf = Buffer.from(await file.arrayBuffer());

    const { error } = await sb.storage.from("client-uploads").upload(caminho, buf, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
    if (error) throw error;

    return Response.json({ ok: true, nome: file.name, url: STORAGE_URL + caminho });
  } catch (e) {
    console.error(e);
    return Response.json({ erro: "interno" }, { status: 500 });
  }
}
