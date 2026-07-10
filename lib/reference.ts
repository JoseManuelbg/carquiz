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

// Curated supplement (EU/JDM models vPIC under-represents) merged with vPIC.
const base = [...(extra as RefCar[]), ...(vehicles.cars as RefCar[])];

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

/** Resolve a typed "Brand Model" to its brand/model, or undefined if unknown. */
export async function resolveCar(text: string): Promise<RefCar | undefined> {
  const n = normalize(text);
  return (await allCars()).find((c) => normalize(`${c.brand} ${c.model}`) === n);
}
