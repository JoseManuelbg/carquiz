// Cálculo (puro) de cuánto se revela la foto. Vive en el servidor: el cliente
// ya no decide nada, solo muestra la imagen que le llega tapada.

import type { RevealStrategy } from "./types";

export const OVERLAY_COLOR = "#15171a"; // color del panel (tapa las tiles)

export type RevealPlan =
  | { kind: "full" }
  | { kind: "blur"; sigma: number }
  | { kind: "tiles"; grid: number; hidden: number[] } // índices de casillas tapadas
  | { kind: "region" };

/** Orden pseudoaleatorio pero determinista en el que se destapan las tiles. */
export function tileOrder(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i).sort(
    (a, b) => (((a + 1) * 2654435761) % 2147483647) - (((b + 1) * 2654435761) % 2147483647)
  );
}

export function revealPlan(
  reveal: RevealStrategy,
  attempts: number,
  maxAttempts: number,
  intensity: number,
  gameOver: boolean
): RevealPlan {
  if (reveal === "none" || gameOver) return { kind: "full" };

  // Más intentos gastados = más visible. Más racha (intensity) = más tapado.
  const level = Math.max(0, Math.min(1, attempts / (maxAttempts + intensity)));

  if (reveal === "region") return { kind: "region" };

  if (reveal === "blur") {
    // Desenfoque suave (antes era exagerado). sigma de sharp, no px.
    const sigma = Math.max(0.4, (1 - level) * 12 + 1);
    return { kind: "blur", sigma };
  }

  // tiles: rejilla que se afina con la racha (4→8).
  const grid = Math.min(4 + Math.floor(intensity / 2), 8);
  const total = grid * grid;
  const revealed = Math.round(total * (0.12 + 0.88 * level));
  const order = tileOrder(total);
  const hidden = order.slice(revealed); // las que aún NO se ven
  return { kind: "tiles", grid, hidden };
}
