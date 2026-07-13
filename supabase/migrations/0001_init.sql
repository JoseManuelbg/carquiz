-- Car Quiz — esquema inicial.
-- Pegar en Supabase → SQL Editor → Run.

create table if not exists public.cars (
  id          text primary key,           -- slug, p.ej. "ford-focus-mk2"
  brand       text not null,
  model       text not null,
  gen         text,
  year        integer not null,
  engine      text,
  region      text not null,              -- EUR | JDM | USDM
  body_type   text not null,              -- Hatchback | Sedan | Coupe ...
  created_at  timestamptz not null default now()
);
create index if not exists cars_region_idx on public.cars (region);

create table if not exists public.car_images (
  id           text primary key,          -- id OPACO usado en /api/img/[id]
  car_id       text not null references public.cars(id) on delete cascade,
  storage_path text not null,             -- ruta dentro del bucket privado
  part         text not null default 'full',
  region_box   jsonb,                     -- recorte {x,y,w,h} para el modo "region"
  credit       jsonb,                     -- {artist, license, source} (atribución CC)
  created_at   timestamptz not null default now()
);
create index if not exists car_images_car_idx  on public.car_images (car_id);
create index if not exists car_images_part_idx on public.car_images (part);

-- Calendario fijo: el coche de un día pasado nunca cambia aunque crezca el pool.
create table if not exists public.daily_puzzles (
  day     date primary key,
  car_id  text not null references public.cars(id)
);

-- Rondas con autoridad en servidor (sustituye al Map en memoria).
create table if not exists public.rounds (
  id           uuid primary key default gen_random_uuid(),
  car_id       text not null references public.cars(id) on delete cascade,
  mode_id      text not null,
  attempts     integer not null default 0,
  max_attempts integer not null,
  solved       boolean not null default false,
  expires_at   timestamptz not null,
  created_at   timestamptz not null default now()
);
create index if not exists rounds_expires_idx on public.rounds (expires_at);

create table if not exists public.admins (
  email text primary key
);

-- SEGURIDAD (crítico).
-- La anon key es pública: si RLS estuviese desactivado, cualquiera podría leer
-- la tabla `cars` y `rounds` vía PostgREST y ver las respuestas. Activamos RLS
-- y NO creamos ninguna policy => anon/authenticated no tienen acceso a nada.
-- Solo el servidor (service key) puede tocar estas tablas.
alter table public.cars          enable row level security;
alter table public.car_images    enable row level security;
alter table public.daily_puzzles enable row level security;
alter table public.rounds        enable row level security;
alter table public.admins        enable row level security;

-- Incremento atómico de intentos (evita carreras y trampas por doble envío).
create or replace function public.apply_attempt(p_round_id uuid, p_correct boolean)
returns public.rounds
language plpgsql
security definer
set search_path = public
as $$
declare r public.rounds;
begin
  update public.rounds
     set attempts = attempts + 1,
         solved   = solved or p_correct
   where id = p_round_id
     and solved = false
     and attempts < max_attempts
     and expires_at > now()
  returning * into r;

  -- Ronda ya terminada/caducada: devolver el estado actual sin tocar nada.
  if r.id is null then
    select * into r from public.rounds where id = p_round_id;
  end if;
  return r;
end;
$$;

revoke all on function public.apply_attempt(uuid, boolean) from public, anon, authenticated;

-- Administradores del panel.
insert into public.admins (email) values
  ('123456aloh@gmail.com'),
  ('josemanuelbabaciugheorghiu@gmail.com')
on conflict (email) do nothing;
