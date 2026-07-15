"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { USERNAME_RE, USERNAME_COOLDOWN_DAYS, cooldownDaysLeft } from "@/lib/username";

/** El nombre es lo que se ve en los rankings. Sin nombre, no sales. */
export async function setUsername(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "No has iniciado sesión." };

  const username = String(formData.get("username") ?? "").trim();
  if (!USERNAME_RE.test(username)) {
    return { error: "3-20 caracteres: letras, números, guion o guion bajo." };
  }

  const sb = supabaseAdmin();
  const current = await sb
    .from("profiles")
    .select("username, username_changed_at")
    .eq("id", user.id)
    .maybeSingle();

  const hadName = Boolean(current.data?.username);
  const sameName = current.data?.username === username;

  // Cooldown: solo al CAMBIAR un nombre ya existente por otro distinto.
  if (hadName && !sameName) {
    const left = cooldownDaysLeft(current.data?.username_changed_at);
    if (left > 0) {
      return {
        error: `Solo puedes cambiar el nombre cada ${USERNAME_COOLDOWN_DAYS} días. Te quedan ${left}.`,
      };
    }
  }

  if (sameName) return { ok: true };

  const { error } = await sb.from("profiles").upsert(
    {
      id: user.id,
      username,
      // El primer nombre no arranca el cooldown; los cambios sí.
      username_changed_at: hadName ? new Date().toISOString() : null,
    },
    { onConflict: "id" }
  );

  if (error) {
    return {
      error: error.code === "23505" ? "Ese nombre ya está cogido." : error.message,
    };
  }

  revalidatePath("/perfil");
  revalidatePath("/ranking");
  return { ok: true };
}

/** Enviar petición de amistad por nombre de usuario. */
export async function addFriend(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "No has iniciado sesión." };

  const sb = supabaseAdmin();
  const username = String(formData.get("username") ?? "").trim();

  const target = await sb
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (!target.data) return { error: `No existe nadie llamado "${username}".` };
  if (target.data.id === user.id) return { error: "No puedes añadirte a ti mismo." };

  const { error } = await sb
    .from("friendships")
    .upsert(
      { user_id: user.id, friend_id: target.data.id, status: "pending" },
      { onConflict: "user_id,friend_id", ignoreDuplicates: true }
    );
  if (error) return { error: error.message };

  revalidatePath("/amigos");
  return { ok: true, msg: `Petición enviada a ${username}.` };
}

/** Aceptar: se marcan aceptadas las dos direcciones. */
export async function acceptFriend(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;

  const sb = supabaseAdmin();
  const requesterId = String(formData.get("requesterId"));

  await sb
    .from("friendships")
    .update({ status: "accepted" })
    .eq("user_id", requesterId)
    .eq("friend_id", user.id);

  await sb.from("friendships").upsert(
    { user_id: user.id, friend_id: requesterId, status: "accepted" },
    { onConflict: "user_id,friend_id" }
  );

  revalidatePath("/amigos");
  revalidatePath("/ranking");
}
