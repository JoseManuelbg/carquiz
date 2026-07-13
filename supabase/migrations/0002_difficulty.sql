-- Niveles de dificultad: la ronda recuerda qué campos había que acertar,
-- para que el servidor valide igual que cuando se creó.
--   facil   -> marca + modelo
--   normal  -> + año
--   dificil -> + motorización
alter table public.rounds
  add column if not exists difficulty text not null default 'normal';
