-- Rachas de infinito SEPARADAS POR DIFICULTAD (comparar Principiante con
-- Experto era injusto). Pegar en SQL Editor → Run.

create table if not exists public.infinite_streaks (
  user_id        uuid not null references auth.users(id) on delete cascade,
  difficulty     text not null,
  current_streak integer not null default 0,
  best_streak    integer not null default 0,
  primary key (user_id, difficulty)
);
create index if not exists infinite_streaks_board_idx
  on public.infinite_streaks (difficulty, best_streak desc);
alter table public.infinite_streaks enable row level security; -- sin policies

-- Traspaso best-effort de lo acumulado hasta ahora a "normal".
insert into public.infinite_streaks (user_id, difficulty, current_streak, best_streak)
select user_id, 'normal', 0, best_infinite_streak
from public.user_stats
where best_infinite_streak > 0
on conflict (user_id, difficulty) do nothing;

-- record_infinite ahora opera sobre la racha de ESA dificultad y devuelve
-- (racha actual, mejor) de esa dificultad.
drop function if exists public.record_infinite(uuid, boolean, int, text, text, text);
create function public.record_infinite(
  p_user uuid, p_solved boolean, p_attempts int, p_mode text, p_diff text, p_car text
) returns table (current_streak integer, best_streak integer)
language plpgsql security definer set search_path = public as $$
declare cur integer; bst integer;
begin
  insert into public.infinite_streaks (user_id, difficulty)
  values (p_user, p_diff)
  on conflict (user_id, difficulty) do nothing;

  update public.infinite_streaks set
    current_streak = case when p_solved then current_streak + 1 else 0 end
  where user_id = p_user and difficulty = p_diff
  returning current_streak into cur;

  update public.infinite_streaks set
    best_streak = greatest(best_streak, cur)
  where user_id = p_user and difficulty = p_diff
  returning best_streak into bst;

  insert into public.game_results
    (user_id, kind, mode_id, difficulty, solved, attempts, streak, car_id)
  values
    (p_user, 'infinite', p_mode, p_diff, p_solved, p_attempts, cur, p_car);

  return query select cur, bst;
end; $$;

revoke all on function public.record_infinite(uuid, boolean, int, text, text, text)
  from public, anon, authenticated;
