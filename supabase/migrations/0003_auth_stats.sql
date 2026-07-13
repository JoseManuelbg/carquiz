-- Revisión de datos + usuarios, stats y ranking.
-- Pegar en Supabase → SQL Editor → Run.

-- 1) Cola de revisión: los datos y fotos vienen de fuentes automáticas y pueden
--    tener errores (generación equivocada, año, motor). Se marcan a mano.
alter table public.cars add column if not exists reviewed boolean not null default false;
create index if not exists cars_reviewed_idx on public.cars (reviewed);

-- 2) Perfil de usuario (extiende auth.users de Supabase).
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text unique,
  created_at timestamptz not null default now()
);

-- 3) Resultado de cada partida (base de stats y rankings).
create table if not exists public.game_results (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  kind       text not null check (kind in ('daily','infinite')),
  day        date,                -- solo para el diario
  mode_id    text,
  difficulty text,
  solved     boolean not null,
  attempts   integer not null,
  streak     integer,             -- racha alcanzada (infinito)
  created_at timestamptz not null default now()
);
-- Un único resultado de diario por usuario y día (no se puede repetir el día).
create unique index if not exists game_results_daily_unique
  on public.game_results (user_id, day) where kind = 'daily';
create index if not exists game_results_user_idx on public.game_results (user_id);

-- 4) Stats agregadas (lo que alimenta los dos rankings).
create table if not exists public.user_stats (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  best_infinite_streak integer not null default 0,
  daily_current_streak integer not null default 0,
  daily_best_streak    integer not null default 0,
  daily_played         integer not null default 0,
  daily_won            integer not null default 0,
  updated_at           timestamptz not null default now()
);
create index if not exists user_stats_infinite_idx on public.user_stats (best_infinite_streak desc);
create index if not exists user_stats_daily_idx    on public.user_stats (daily_best_streak desc);

-- 5) Preferencias (para el recordatorio por email, más adelante).
alter table public.profiles
  add column if not exists daily_reminder boolean not null default false;

-- SEGURIDAD: RLS activado y sin policies => la clave pública no lee nada.
-- Todo pasa por el servidor con la service key (que sí valida quién eres).
alter table public.profiles     enable row level security;
alter table public.game_results enable row level security;
alter table public.user_stats   enable row level security;

-- Crear perfil automáticamente al registrarse.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  insert into public.user_stats (user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
