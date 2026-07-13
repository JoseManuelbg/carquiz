-- Amigos, ranking privado y registro de partidas con autoridad en servidor.
-- Pegar en Supabase → SQL Editor → Run.

-- La racha de infinito pasa a vivir en el servidor: si la llevara el navegador,
-- cualquiera podría mandar "he hecho racha de 900" y reventar el ranking.
alter table public.user_stats
  add column if not exists current_infinite_streak integer not null default 0,
  add column if not exists last_daily_day date;

-- Amigos: petición (pending) → aceptada (accepted). Una fila por dirección.
create table if not exists public.friendships (
  user_id    uuid not null references auth.users(id) on delete cascade,
  friend_id  uuid not null references auth.users(id) on delete cascade,
  status     text not null default 'pending' check (status in ('pending','accepted')),
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);
create index if not exists friendships_friend_idx on public.friendships (friend_id);
alter table public.friendships enable row level security;

-- ---------------------------------------------------------------------------
-- Registro del COCHE DEL DÍA. Solo cuenta el primer resultado de cada día.
create or replace function public.record_daily(
  p_user uuid, p_day date, p_solved boolean, p_attempts int
) returns public.user_stats
language plpgsql security definer set search_path = public as $$
declare s public.user_stats;
begin
  -- El índice único (user_id, day) impide repetir el día.
  insert into public.game_results (user_id, kind, day, solved, attempts)
  values (p_user, 'daily', p_day, p_solved, p_attempts)
  on conflict do nothing;

  select * into s from public.user_stats where user_id = p_user for update;
  if s.user_id is null then
    insert into public.user_stats (user_id) values (p_user) returning * into s;
  end if;

  -- Si ya se había jugado hoy, no se toca nada.
  if s.last_daily_day is distinct from p_day then
    update public.user_stats set
      daily_played = daily_played + 1,
      daily_won    = daily_won + (case when p_solved then 1 else 0 end),
      -- La racha diaria solo continúa si ayer también se acertó.
      daily_current_streak = case
        when not p_solved then 0
        when s.last_daily_day = p_day - 1 then s.daily_current_streak + 1
        else 1
      end,
      last_daily_day = p_day,
      updated_at = now()
    where user_id = p_user
    returning * into s;

    update public.user_stats
      set daily_best_streak = greatest(daily_best_streak, daily_current_streak)
    where user_id = p_user
    returning * into s;
  end if;

  return s;
end; $$;

-- ---------------------------------------------------------------------------
-- Registro del MODO INFINITO. Acierto suma racha; fallo la reinicia.
create or replace function public.record_infinite(
  p_user uuid, p_solved boolean, p_attempts int, p_mode text, p_diff text
) returns public.user_stats
language plpgsql security definer set search_path = public as $$
declare s public.user_stats;
begin
  select * into s from public.user_stats where user_id = p_user for update;
  if s.user_id is null then
    insert into public.user_stats (user_id) values (p_user) returning * into s;
  end if;

  update public.user_stats set
    current_infinite_streak = case
      when p_solved then s.current_infinite_streak + 1 else 0 end,
    updated_at = now()
  where user_id = p_user
  returning * into s;

  update public.user_stats
    set best_infinite_streak = greatest(best_infinite_streak, current_infinite_streak)
  where user_id = p_user
  returning * into s;

  insert into public.game_results
    (user_id, kind, mode_id, difficulty, solved, attempts, streak)
  values
    (p_user, 'infinite', p_mode, p_diff, p_solved, p_attempts, s.current_infinite_streak);

  return s;
end; $$;

revoke all on function public.record_daily(uuid, date, boolean, int)
  from public, anon, authenticated;
revoke all on function public.record_infinite(uuid, boolean, int, text, text)
  from public, anon, authenticated;
