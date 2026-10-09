// Ecossistema · função "ia"
// Ponte segura para a inteligência artificial: a chave fica guardada aqui no Supabase, nunca no site.
// Só responde a quem está logado no sistema.
// Segredo necessário (Edge Functions → Secrets): GEMINI_API_KEY. Opcional: GEMINI_MODEL.
// Ao criar a função no painel, deixe "Verify JWT" DESLIGADO (a conferência do login é feita aqui dentro).
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { ...cors, "Content-Type": "application/json" } });

const SISTEMA = [
  'Você é o assistente pessoal do dono de um sistema chamado "Ecossistema", que tem três áreas:',
  "Carteira Ativa (trabalho: carteira de corretores de seguros que ele supervisiona), Compromissos (agenda pessoal) e Minhas Finanças (finanças pessoais).",
  "Responda sempre em português do Brasil, direto e curto, em texto simples (sem markdown, sem asteriscos).",
  "Use SOMENTE os dados do contexto enviado; se a resposta não estiver lá, diga que não tem essa informação.",
  "Nunca invente valores, datas ou nomes. Não dê recomendação de investimento.",
  "Você não executa ações no sistema: quando sugerir algo, diga em qual área ele faz isso.",
].join("\n");

async function chamarGemini(modelo: string, chave: string, corpo: unknown) {
  return await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + modelo + ":generateContent", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": chave },
    body: JSON.stringify(corpo),
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ ok: false, erro: "use POST" }, 405);
  try {
    // 1) confere o login
    const auth = req.headers.get("Authorization") || "";
    const u = await fetch(Deno.env.get("SUPABASE_URL") + "/auth/v1/user", {
      headers: { Authorization: auth, apikey: Deno.env.get("SUPABASE_ANON_KEY") || "" },
    });
    if (!u.ok) return json({ ok: false, erro: "login" }, 401);

    const chave = Deno.env.get("GEMINI_API_KEY");
    if (!chave) return json({ ok: false, erro: "falta o segredo GEMINI_API_KEY" }, 500);

    const b = await req.json().catch(() => ({}));
    if (b && b.teste) return json({ ok: true, pronto: true });
    const pergunta = String(b.pergunta || "").slice(0, 2000);
    const contexto = String(b.contexto || "").slice(0, 60000);
    const historico = Array.isArray(b.historico) ? b.historico.slice(-8) : [];
    if (!pergunta.trim()) return json({ ok: false, erro: "pergunta vazia" }, 400);

    const contents = [];
    for (const h of historico) {
      if (!h || !h.texto) continue;
      contents.push({ role: h.de === "ia" ? "model" : "user", parts: [{ text: String(h.texto).slice(0, 4000) }] });
    }
    contents.push({ role: "user", parts: [{ text: "CONTEXTO DE HOJE (dados do sistema):\n" + contexto + "\n\nPERGUNTA:\n" + pergunta }] });
    const corpo = {
      systemInstruction: { parts: [{ text: SISTEMA }] },
      contents,
      generationConfig: { temperature: 0.4, maxOutputTokens: 900 },
    };

    const modelos = [Deno.env.get("GEMINI_MODEL") || "gemini-flash-latest", "gemini-2.5-flash", "gemini-2.0-flash"];
    let r: Response | null = null, det = "";
    for (const m of modelos) {
      r = await chamarGemini(m, chave, corpo);
      if (r.ok) break;
      det = await r.text();
      if (r.status !== 404 && r.status !== 400) break; // só tenta outro modelo se este não existir
    }
    if (!r || !r.ok) {
      const st = r ? r.status : 0;
      return json({ ok: false, erro: st === 429 ? "limite" : "ia", status: st, detalhe: det.slice(0, 300) }, 502);
    }
    const j = await r.json();
    const texto = ((j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || [])
      .map((p: { text?: string }) => p.text || "").join("").trim();
    if (!texto) return json({ ok: false, erro: "vazio" }, 502);
    return json({ ok: true, texto });
  } catch (e) {
    return json({ ok: false, erro: String((e as Error).message || e) }, 500);
  }
});
