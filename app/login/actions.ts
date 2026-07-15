"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { USERNAME_RE } from "@/lib/username";

/**
 * ¿Está libre el nombre? Se comprueba en servidor porque la tabla `profiles`
 * tiene RLS y el navegador no puede consultarla.
 */
export async function isUsernameFree(
  username: string
): Promise<{ free: boolean; error?: string }> {
  const name = username.trim();
  if (!USERNAME_RE.test(name)) {
    return { free: false, error: "3-20 caracteres: letras, números, guion o _" };
  }

  const { data, error } = await supabaseAdmin()
    .from("profiles")
    .select("id")
    .eq("username", name)
    .maybeSingle();

  if (error) return { free: false, error: "No se pudo comprobar. Inténtalo otra vez." };
  return data ? { free: false, error: "Ese nombre ya está cogido." } : { free: true };
}
