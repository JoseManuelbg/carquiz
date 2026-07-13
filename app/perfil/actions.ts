"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

/** El nombre es lo que se ve en los rankings. Sin nombre, no sales. */
export async function setUsername(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "No has iniciado sesión." };

  const username = String(formData.get("username") ?? "").trim();
  if (!/^[a-zA-Z0-9_-]{3,20}$/.test(username)) {
    return { error: "3-20 caracteres: letras, números, guion o guion bajo." };
  }

  const { error } = await supabaseAdmin()
    .from("profiles")
    .upsert({ id: user.id, username }, { onConflict: "id" });

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
