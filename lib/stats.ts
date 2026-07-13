// Stats, rankings y amigos. Todo pasa por el servidor con la service key:
// el cliente nunca escribe su propia racha (si no, el ranking sería una broma).

import { supabaseAdmin } from "./supabase";

export interface UserStats {
  user_id: string;
  best_infinite_streak: number;
  current_infinite_streak: number;
  daily_current_streak: number;
  daily_best_streak: number;
  daily_played: number;
  daily_won: number;
}

export interface RankRow {
  userId: string;
  username: string;
  value: number;
  extra?: string;
}

export async function recordDaily(
  userId: string,
  day: string,
  solved: boolean,
  attempts: number
): Promise<UserStats | null> {
  const { data, error } = await supabaseAdmin().rpc("record_daily", {
    p_user: userId,
    p_day: day,
    p_solved: solved,
    p_attempts: attempts,
  });
  if (error) throw new Error(`recordDaily: ${error.message}`);
  return (Array.isArray(data) ? data[0] : data) ?? null;
}

export async function recordInfinite(
  userId: string,
  solved: boolean,
  attempts: number,
  modeId: string,
  difficulty: string
): Promise<UserStats | null> {
  const { data, error } = await supabaseAdmin().rpc("record_infinite", {
    p_user: userId,
    p_solved: solved,
    p_attempts: attempts,
    p_mode: modeId,
    p_diff: difficulty,
  });
  if (error) throw new Error(`recordInfinite: ${error.message}`);
  return (Array.isArray(data) ? data[0] : data) ?? null;
}

export async function getStats(userId: string): Promise<UserStats | null> {
  const { data } = await supabaseAdmin()
    .from("user_stats")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as UserStats) ?? null;
}

export async function getProfile(userId: string) {
  const { data } = await supabaseAdmin()
    .from("profiles")
    .select("id,username,daily_reminder")
    .eq("id", userId)
    .maybeSingle();
  return data as { id: string; username: string | null; daily_reminder: boolean } | null;
}

/** Nombres de usuario por id. */
async function usernames(ids: string[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const { data } = await supabaseAdmin()
    .from("profiles")
    .select("id,username")
    .in("id", ids);
  const m = new Map<string, string>();
  for (const p of data ?? []) {
    if (p.username) m.set(p.id as string, p.username as string);
  }
  return m;
}

/**
 * Los rankings solo muestran a quien tiene nombre puesto.
 *
 * Ojo: `user_stats` y `profiles` cuelgan las dos de auth.users, pero NO hay
 * relación directa entre ellas, así que PostgREST no puede hacer el embed
 * (`profiles!inner(...)` falla). Se unen aquí, en dos consultas.
 */
async function ranking(
  column: "best_infinite_streak" | "daily_best_streak",
  limit: number,
  userIds?: string[]
): Promise<RankRow[]> {
  let q = supabaseAdmin()
    .from("user_stats")
    .select("user_id, best_infinite_streak, daily_best_streak, daily_won, daily_played")
    .gt(column, 0)
    .order(column, { ascending: false })
    .limit(limit);

  if (userIds) q = q.in("user_id", userIds);

  const { data, error } = await q;
  if (error) throw new Error(`ranking: ${error.message}`);

  const rows = (data ?? []) as unknown as (Record<string, number> & {
    user_id: string;
  })[];
  const names = await usernames(rows.map((r) => r.user_id));

  return rows
    .filter((r) => names.has(r.user_id))
    .map((r) => ({
      userId: r.user_id,
      username: names.get(r.user_id)!,
      value: Number(r[column]),
      extra:
        column === "daily_best_streak"
          ? `${r.daily_won}/${r.daily_played} aciertos`
          : undefined,
    }));
}

export const topInfinite = (limit = 20, ids?: string[]) =>
  ranking("best_infinite_streak", limit, ids);

export const topDaily = (limit = 20, ids?: string[]) =>
  ranking("daily_best_streak", limit, ids);

// --- Amigos ---------------------------------------------------------------

export async function friendIds(userId: string): Promise<string[]> {
  const { data } = await supabaseAdmin()
    .from("friendships")
    .select("friend_id")
    .eq("user_id", userId)
    .eq("status", "accepted");
  return (data ?? []).map((r) => r.friend_id as string);
}

/** Peticiones de amistad recibidas. (Mismo motivo que en ranking: sin embed.) */
export async function pendingRequests(
  userId: string
): Promise<{ userId: string; username: string }[]> {
  const { data } = await supabaseAdmin()
    .from("friendships")
    .select("user_id")
    .eq("friend_id", userId)
    .eq("status", "pending");

  const ids = (data ?? []).map((r) => r.user_id as string);
  const names = await usernames(ids);
  return ids
    .filter((id) => names.has(id))
    .map((id) => ({ userId: id, username: names.get(id)! }));
}

export async function listFriends(userId: string) {
  const ids = await friendIds(userId);
  if (ids.length === 0) return [];
  const { data } = await supabaseAdmin()
    .from("profiles")
    .select("id,username")
    .in("id", ids);
  return (data ?? []) as { id: string; username: string | null }[];
}
