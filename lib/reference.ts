// Big autocomplete catalog for the daily mode.
//
// Backed by reference/vehicles.json (built from NHTSA vPIC via
// scripts/build-reference.mjs) and merged with the curated cars.json so every
// possible answer is always typeable — even brands vPIC doesn't list (e.g. Seat).
// Server-only.

import vehicles from "@/reference/vehicles.json";
import extra from "@/reference/extra.json";
import { getCars } from "./db";
import { normalize } from "./normalize";

export interface RefCar {
  brand: string;
  model: string;
}

export const YEAR_RANGE: [number, number] = [
  vehicles.yearRange[0],
  vehicles.yearRange[1],
];

/**
 * vPIC mete códigos de camión/comercial que no son modelos de verdad
 * ("A8513", "At9513", "B6000", "'34"). Ensucian el autocompletado.
 *   - "A4", "S3", "Q7"  -> se quedan (1 dígito)
 *   - "911", "500", "206" -> se quedan (solo dígitos)
 *   - "A8513", "B700", "Cft8000" -> fuera (letras + 3 o más dígitos pegados)
 */
function isJunkModel(model: string): boolean {
  if (model.length < 2) return true;
  if (/^[^a-z0-9]/i.test(model)) return true; // empieza por ' o -
  return /^[a-z]{1,3}\d{3,}$/i.test(model);
}

// Suplemento curado (EU/JDM que vPIC cubre mal) + vPIC ya limpio.
const base = [
  ...(extra as RefCar[]),
  ...(vehicles.cars as RefCar[]).filter((c) => !isJunkModel(c.model)),
];

let merged: RefCar[] | null = null;

async function allCars(): Promise<RefCar[]> {
  if (merged) return merged;
  const curated = (await getCars()).map((c) => ({ brand: c.brand, model: c.model }));
  const seen = new Set<string>();
  const out: RefCar[] = [];
  for (const c of [...curated, ...base]) {
    const key = normalize(`${c.brand} ${c.model}`);
    if (!c.brand || !c.model || seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }

  // CRÍTICO: ordenar alfabéticamente. Si dejamos los coches del pool de
  // respuestas al principio (como venían), el autocompletado los muestra
  // siempre arriba y le canta al jugador cuál es la respuesta.
  out.sort((a, b) =>
    `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`, "es")
  );

  merged = out;
  return out;
}

/** Type-ahead: labels ("Brand Model") matching q, prefix matches first. */
export async function searchCars(q: string, limit = 20): Promise<string[]> {
  const n = normalize(q);
  if (!n) return [];
  const cars = await allCars();
  const starts: string[] = [];
  const contains: string[] = [];
  for (const c of cars) {
    const label = `${c.brand} ${c.model}`;
    const nl = normalize(label);
    if (nl.startsWith(n)) starts.push(label);
    else if (nl.includes(n)) contains.push(label);
    if (starts.length >= limit) break;
  }
  return [...starts, ...contains].slice(0, limit);
}

/** Distancia de edición acotada: si supera `max`, corta y devuelve max+1. */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      best = Math.min(best, cur[j]);
    }
    if (best > max) return max + 1; // ninguna opción puede ya bajar de max
    prev = cur;
  }
  return prev[b.length];
}

/**
 * Resuelve lo que ha escrito el jugador a un coche del catálogo.
 * Acepta texto libre y tolera erratas: primero exacto, luego "modelo" a secas,
 * y por último la coincidencia más cercana (p.ej. "ford focuss" → Ford Focus).
 */
export async function resolveCar(text: string): Promise<RefCar | undefined> {
  const n = normalize(text);
  if (!n) return undefined;
  const cars = await allCars();

  // 1) Exacto "marca modelo".
  const exact = cars.find((c) => normalize(`${c.brand} ${c.model}`) === n);
  if (exact) return exact;

  // 2) Solo el modelo ("focus" → Ford Focus), si no es ambiguo.
  const byModel = cars.filter((c) => normalize(c.model) === n);
  if (byModel.length === 1) return byModel[0];

  // 3) Tolerancia a erratas: 1 fallo si es corto, 2 si es largo.
  const max = n.length <= 6 ? 1 : 2;
  let best: RefCar | undefined;
  let bestD = max + 1;
  for (const c of cars) {
    for (const cand of [normalize(`${c.brand} ${c.model}`), normalize(c.model)]) {
      const d = editDistance(n, cand, max);
      if (d < bestD) {
        bestD = d;
        best = c;
        if (d === 0) return c;
      }
    }
  }
  return bestD <= max ? best : undefined;
}
