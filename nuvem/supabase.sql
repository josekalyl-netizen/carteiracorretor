-- Carteira de Corretores · W3G — estrutura da nuvem (Supabase)
-- Cole tudo isto no SQL Editor do seu projeto e clique em "Run". Pode rodar mais de uma vez.

-- 1) A carteira: uma linha por usuário, com todos os dados em "data"
create table if not exists public.carteira (
  user_id    uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data       jsonb not null,
  rev        bigint not null default 1,          -- número da versão (evita um aparelho sobrescrever o outro)
  updated_at timestamptz not null default now()
);

-- 2) Cópias diárias: uma por dia, para poder voltar atrás
create table if not exists public.carteira_snapshots (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  dia        date not null,
  data       jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, dia)
);

-- 3) Segurança: cada usuário logado só enxerga e altera as PRÓPRIAS linhas.
--    Sem login, ninguém lê nada.
alter table public.carteira           enable row level security;
alter table public.carteira_snapshots enable row level security;

drop policy if exists "dono da carteira" on public.carteira;
create policy "dono da carteira" on public.carteira
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "dono das copias" on public.carteira_snapshots;
create policy "dono das copias" on public.carteira_snapshots
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke all on public.carteira, public.carteira_snapshots from anon;
grant select, insert, update, delete on public.carteira, public.carteira_snapshots to authenticated;
