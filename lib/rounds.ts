// In-memory round store (provisional).
//
// A "round" is one server-authoritative game: it remembers which car is the
// answer and how many attempts have been used, so the answer never travels to
// the client until the game is legitimately over. This lives in process memory
// on purpose for the JSON phase — swap for Redis/DB when the backend is real.

import { randomUUID } from "node:crypto";

export interface Round {
  carId: string;
  modeId: string;
  attempts: number;
  maxAttempts: number;
  solved: boolean;
  expires: number;
}

const TTL_MS = 1000 * 60 * 60; // 1h
const store = new Map<string, Round>();

function sweep() {
  const now = Date.now();
  for (const [id, r] of store) if (r.expires < now) store.delete(id);
}

export function createRound(
  carId: string,
  modeId: string,
  maxAttempts: number
): string {
  sweep();
  const id = randomUUID();
  store.set(id, {
    carId,
    modeId,
    attempts: 0,
    maxAttempts,
    solved: false,
    expires: Date.now() + TTL_MS,
  });
  return id;
}

export function getRound(id: string): Round | undefined {
  const r = store.get(id);
  if (!r) return undefined;
  if (r.expires < Date.now()) {
    store.delete(id);
    return undefined;
  }
  return r;
}
