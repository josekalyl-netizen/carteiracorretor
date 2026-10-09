// Ecossistema · função "lembretes"
// Chamada de minuto em minuto pelo relógio do banco. Envia a notificação dos lembretes que já venceram.
// Segredos necessários (Edge Functions → Secrets): VAPID_PUBLIC, VAPID_PRIVATE, VAPID_SUBJECT.
// Ao criar a função no painel, deixe "Verify JWT" DESLIGADO (ela não recebe nem devolve dados de ninguém).
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const pub = Deno.env.get("VAPID_PUBLIC"), priv = Deno.env.get("VAPID_PRIVATE");
    if (!pub || !priv) return json({ ok: false, erro: "faltam os segredos VAPID" }, 500);
    webpush.setVapidDetails(Deno.env.get("VAPID_SUBJECT") || "mailto:contato@example.com", pub, priv);

    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const agora = new Date();
    const desde = new Date(agora.getTime() - 6 * 3600 * 1000).toISOString(); // atrasado demais não envia mais

    const { data: pend, error } = await sb.from("lembretes")
      .select("user_id,id,quando,titulo,corpo,area")
      .is("enviado_em", null).lte("quando", agora.toISOString()).gte("quando", desde)
      .order("quando").limit(200);
    if (error) return json({ ok: false, erro: error.message }, 500);

    let enviados = 0, falhas = 0;
    for (const l of pend || []) {
      // marca antes de enviar: se duas chamadas se cruzarem, só uma envia
      const { data: marcou } = await sb.from("lembretes").update({ enviado_em: new Date().toISOString() })
        .eq("user_id", l.user_id).eq("id", l.id).is("enviado_em", null).select("id");
      if (!marcou || !marcou.length) continue;

      const { data: subs } = await sb.from("push_subs").select("endpoint,p256dh,auth").eq("user_id", l.user_id);
      const payload = JSON.stringify({ titulo: l.titulo, corpo: l.corpo || "", area: l.area || "", id: l.id });
      for (const s of subs || []) {
        try {
          await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 3600 });
          enviados++;
        } catch (e) {
          falhas++;
          const code = (e as { statusCode?: number }).statusCode;
          if (code === 404 || code === 410) await sb.from("push_subs").delete().eq("endpoint", s.endpoint); // aparelho saiu
        }
      }
    }
    // faxina: o que passou há mais de 3 dias sai da tabela
    await sb.from("lembretes").delete().lt("quando", new Date(agora.getTime() - 3 * 86400 * 1000).toISOString());
    return json({ ok: true, vencidos: (pend || []).length, enviados, falhas });
  } catch (e) {
    return json({ ok: false, erro: String((e as Error).message || e) }, 500);
  }
});
