// Server-authoritative game rounds, stored in Postgres.
//
// Replaces the old in-memory Map, which broke on serverless (a round created on
// one instance was invisible to the instance handling the guess).

import { supabaseAdmin } from "./supabase";

export interface Round {
  id: string;
  carId: string;
  modeId: string;
  difficulty: string;
  intensity: number;
  attempts: number;
  maxAttempts: number;
  solved: boolean;
  expiresAt: string;
}

interface RoundRow {
  id: string;
  car_id: string;
  mode_id: string;
  difficulty: string;
  intensity: number;
  attempts: number;
  max_attempts: number;
  solved: boolean;
  expires_at: string;
}

const TTL_MS = 1000 * 60 * 60; // 1h

function toRound(r: RoundRow): Round {
  return {
    id: r.id,
    carId: r.car_id,
    modeId: r.mode_id,
    difficulty: r.difficulty,
    intensity: r.intensity ?? 0,
    attempts: r.attempts,
    maxAttempts: r.max_attempts,
    solved: r.solved,
    expiresAt: r.expires_at,
  };
}

export async function createRound(
  carId: string,
  modeId: string,
  maxAttempts: number,
  difficulty: string,
  intensity: number
): Promise<string> {
  const { data, error } = await supabaseAdmin()
    .from("rounds")
    .insert({
      car_id: carId,
      mode_id: modeId,
      difficulty,
      intensity,
      max_attempts: maxAttempts,
      expires_at: new Date(Date.now() + TTL_MS).toISOString(),
    })
    .select("id")
    .single();
  if (error) throw new Error(`createRound: ${error.message}`);
  return data.id as string;
}

export async function getRound(id: string): Promise<Round | undefined> {
  const { data, error } = await supabaseAdmin()
    .from("rounds")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) return undefined; // malformed uuid, etc.
  if (!data) return undefined;
  const round = toRound(data as RoundRow);
  if (new Date(round.expiresAt).getTime() < Date.now()) return undefined;
  return round;
}

/**
 * Atomically consume one attempt. The SQL function refuses to count attempts on
 * a round that's already solved, exhausted or expired, so a double-submit can't
 * burn extra tries or cheat the counter.
 */
export async function applyAttempt(
  id: string,
  correct: boolean
): Promise<Round | undefined> {
  const { data, error } = await supabaseAdmin().rpc("apply_attempt", {
    p_round_id: id,
    p_correct: correct,
  });
  if (error) throw new Error(`applyAttempt: ${error.message}`);
  if (!data) return undefined;
  const row = (Array.isArray(data) ? data[0] : data) as RoundRow;
  return row ? toRound(row) : undefined;
}
