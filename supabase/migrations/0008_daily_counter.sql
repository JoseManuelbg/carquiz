-- Contador "X personas ya lo adivinaron" del coche del día.
-- Cuenta a todos: registrados (dedup por cuenta) y anónimos (dedup por cookie
-- en la app). Pegar en SQL Editor → Run.

create table if not exists public.daily_stats (
  day    date primary key,
  solved integer not null default 0
);
alter table public.daily_stats enable row level security; -- sin policies: solo servidor

-- Suma un acierto anónimo (la app evita duplicados con una cookie por navegador).
create or replace function public.bump_daily_anon(p_day date)
returns integer
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  insert into public.daily_stats (day, solved) values (p_day, 1)
  on conflict (day) do update set solved = public.daily_stats.solved + 1
  returning solved into n;
  return n;
end; $$;

-- record_daily ahora incrementa el contador cuando el usuario acierta su diario
-- por primera vez ese día (una sola vez por cuenta y día).
drop function if exists public.record_daily(uuid, date, boolean, int, text);
create function public.record_daily(
  p_user uuid, p_day date, p_solved boolean, p_attempts int, p_car text
) returns public.user_stats
language plpgsql security definer set search_path = public as $$
declare s public.user_stats;
begin
  insert into public.game_results (user_id, kind, day, solved, attempts, car_id)
  values (p_user, 'daily', p_day, p_solved, p_attempts, p_car)
  on conflict do nothing;

  select * into s from public.user_stats where user_id = p_user for update;
  if s.user_id is null then
    insert into public.user_stats (user_id) values (p_user) returning * into s;
  end if;

  if s.last_daily_day is distinct from p_day then
    -- Primer intento del día: cuenta para el contador si ha acertado.
    if p_solved then
      insert into public.daily_stats (day, solved) values (p_day, 1)
      on conflict (day) do update set solved = public.daily_stats.solved + 1;
    end if;

    update public.user_stats set
      daily_played = daily_played + 1,
      daily_won    = daily_won + (case when p_solved then 1 else 0 end),
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

revoke all on function public.bump_daily_anon(date) from public, anon, authenticated;
revoke all on function public.record_daily(uuid, date, boolean, int, text)
  from public, anon, authenticated;
