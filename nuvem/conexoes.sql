-- Ecossistema · conexões (notificação com o app fechado)
-- Cole tudo isto no SQL Editor do seu projeto Supabase e clique em "Run". Pode rodar mais de uma vez.

-- 1) Aparelhos que aceitaram receber notificação
create table if not exists public.push_subs (
  endpoint   text primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  p256dh     text not null,
  auth       text not null,
  aparelho   text,
  criado_em  timestamptz not null default now()
);

-- 2) Lembretes a enviar (o próprio sistema preenche, a partir da Agenda e das Finanças)
create table if not exists public.lembretes (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id         text not null,
  quando     timestamptz not null,
  titulo     text not null,
  corpo      text,
  area       text,
  enviado_em timestamptz,
  primary key (user_id, id)
);
create index if not exists lembretes_pendentes on public.lembretes (quando) where enviado_em is null;

-- 3) Segurança: cada usuário logado só enxerga e altera as PRÓPRIAS linhas.
alter table public.push_subs enable row level security;
alter table public.lembretes enable row level security;

drop policy if exists "dono dos aparelhos" on public.push_subs;
create policy "dono dos aparelhos" on public.push_subs
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "dono dos lembretes" on public.lembretes;
create policy "dono dos lembretes" on public.lembretes
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke all on public.push_subs, public.lembretes from anon;
grant select, insert, update, delete on public.push_subs, public.lembretes to authenticated;

-- 4) Relógio: de minuto em minuto chama a função que envia os lembretes vencidos.
--    (a função não devolve dado nenhum; só dispara o que já está na hora)
create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
begin
  perform cron.unschedule('ecossistema-lembretes');
exception when others then null;
end $$;

select cron.schedule(
  'ecossistema-lembretes',
  '* * * * *',
  $cron$
  select net.http_post(
    url     := 'https://inbtimxdbfmnuztnelzm.supabase.co/functions/v1/lembretes',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body    := '{}'::jsonb
  );
  $cron$
);
