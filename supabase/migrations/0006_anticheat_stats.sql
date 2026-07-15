-- Anti-trampas + datos para stats detalladas. Pegar en SQL Editor → Run.

-- 1) La ronda recuerda su "intensidad" (derivada de la racha) para que el
--    servidor sepa cuánto tapar la foto sin fiarse del cliente.
alter table public.rounds
  add column if not exists intensity int not null default 0;

-- 2) Cada partida guarda QUÉ coche era: base para "coches adivinados",
--    "marcas más adivinadas" y "más fallados".
alter table public.game_results
  add column if not exists car_id text references public.cars(id);
create index if not exists game_results_car_idx on public.game_results (car_id);

-- 3) Las funciones de registro reciben ahora el coche.
drop function if exists public.record_daily(uuid, date, boolean, int);
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

drop function if exists public.record_infinite(uuid, boolean, int, text, text);
create function public.record_infinite(
  p_user uuid, p_solved boolean, p_attempts int, p_mode text, p_diff text, p_car text
) returns public.user_stats
language plpgsql security definer set search_path = public as $$
declare s public.user_stats;
begin
  select * into s from public.user_stats where user_id = p_user for update;
  if s.user_id is null then
    insert into public.user_stats (user_id) values (p_user) returning * into s;
  end if;

  update public.user_stats set
    current_infinite_streak = case when p_solved then s.current_infinite_streak + 1 else 0 end,
    updated_at = now()
  where user_id = p_user
  returning * into s;

  update public.user_stats
    set best_infinite_streak = greatest(best_infinite_streak, current_infinite_streak)
  where user_id = p_user
  returning * into s;

  insert into public.game_results
    (user_id, kind, mode_id, difficulty, solved, attempts, streak, car_id)
  values
    (p_user, 'infinite', p_mode, p_diff, p_solved, p_attempts, s.current_infinite_streak, p_car);
  return s;
end; $$;

revoke all on function public.record_daily(uuid, date, boolean, int, text)
  from public, anon, authenticated;
revoke all on function public.record_infinite(uuid, boolean, int, text, text, text)
  from public, anon, authenticated;
