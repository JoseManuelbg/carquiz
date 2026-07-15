-- Cuándo se cambió el nombre por última vez (para el cooldown).
-- El primer nombre (de null a algo) es gratis; cambiarlo tiene espera.
alter table public.profiles
  add column if not exists username_changed_at timestamptz;
