// Quién es el usuario y si puede entrar al panel.
// La comprobación de admin se hace SIEMPRE en servidor contra la tabla `admins`.

import { createSupabaseServer } from "./supabase/server";
import { supabaseAdmin } from "./supabase";

export async function getCurrentUser() {
  const sb = await createSupabaseServer();
  const { data } = await sb.auth.getUser();
  return data.user ?? null;
}

export async function isAdminEmail(email?: string | null): Promise<boolean> {
  if (!email) return false;
  const { data } = await supabaseAdmin()
    .from("admins")
    .select("email")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  return Boolean(data);
}

/** Lanza si el usuario actual no es admin. Usar en cada Server Action del panel. */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !(await isAdminEmail(user.email))) {
    throw new Error("No autorizado");
  }
  return user;
}
