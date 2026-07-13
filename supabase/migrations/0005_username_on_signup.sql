-- El nombre se elige AL REGISTRARSE: viaja en los metadatos del usuario y el
-- trigger lo copia al perfil. Así nadie se queda sin nombre (y nunca hay que
-- enseñar el email como sustituto).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uname text := nullif(trim(new.raw_user_meta_data->>'username'), '');
begin
  -- Carrera: si entre la comprobación y el registro alguien pilló ese nombre,
  -- se deja vacío en vez de reventar el alta. El usuario lo pondrá en /perfil.
  if uname is not null and exists (select 1 from public.profiles where username = uname) then
    uname := null;
  end if;

  insert into public.profiles (id, username)
  values (new.id, uname)
  on conflict (id) do nothing;

  insert into public.user_stats (user_id)
  values (new.id)
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
