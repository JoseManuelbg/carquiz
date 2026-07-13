// Lógica del juego: convierte un intento en una fila de casillas de colores.
// Funciones puras, sin I/O.
//
//   verde    = exacto
//   amarillo = tibio (año dentro de tolerancia)
//   gris     = fallo

import type { Car } from "./types";
import type { Target } from "./modes";
import type { Difficulty } from "./difficulty";
import { normalize } from "./normalize";

export type CellState = "green" | "yellow" | "gray";

export interface Cell {
  key: string;
  label: string;
  value: string;
  state: CellState;
  arrow?: "up" | "down";
}

export interface Feedback {
  guess: string;
  resolved: boolean;
  correct: boolean;
  cells: Cell[];
}

/** Lo que sabemos del coche escrito. body/region/year solo si es un coche nuestro
 *  (los del catálogo grande solo traen marca + modelo). */
export interface GuessCar {
  brand: string;
  model: string;
  bodyType?: string;
  region?: string;
  year?: number;
  engine?: string;
}

const YEAR_TOL = 3;

function eq(a: string, b: string): boolean {
  return normalize(a) === normalize(b);
}

function brandCell(g: string, a: string): Cell {
  return { key: "brand", label: "Marca", value: g, state: eq(g, a) ? "green" : "gray" };
}

function modelCell(g: string, a: string): Cell {
  return { key: "model", label: "Modelo", value: g, state: eq(g, a) ? "green" : "gray" };
}

function yearCell(g: number, a: number, key = "year"): Cell {
  const d = a - g;
  const state: CellState = d === 0 ? "green" : Math.abs(d) <= YEAR_TOL ? "yellow" : "gray";
  return {
    key,
    label: "Año",
    value: String(g),
    state,
    arrow: d === 0 ? undefined : d > 0 ? "up" : "down",
  };
}

function sameCell(key: string, label: string, g: string, a: string): Cell {
  return { key, label, value: g, state: eq(g, a) ? "green" : "gray" };
}

/** Modo "morro → año": solo se pide el año. */
export function evaluateYear(answer: Car, text: string): Feedback {
  const gy = parseInt(text, 10);
  if (!Number.isFinite(gy)) return { guess: text, resolved: false, correct: false, cells: [] };
  return {
    guess: String(gy),
    resolved: true,
    correct: gy === answer.year,
    cells: [yearCell(gy, answer.year)],
  };
}

/**
 * Evaluación unificada: vale para el diario y para los modos infinitos, en
 * cualquier nivel de dificultad. El nivel decide qué campos hay que acertar;
 * los datos del coche escrito (si lo tenemos en la BBDD) se muestran de propina
 * como pistas.
 */
export function evaluateGuess(
  answer: Car,
  g: GuessCar | undefined,
  year: number | undefined,
  engine: string | undefined,
  diff: Difficulty,
  target: Target
): Feedback {
  const missingYear = diff.askYear && (year === undefined || !Number.isFinite(year));
  const missingEngine = diff.askEngine && !engine;
  if (!g || missingYear || missingEngine) {
    return {
      guess: g ? `${g.brand} ${g.model}` : "",
      resolved: false,
      correct: false,
      cells: [],
    };
  }

  const cells: Cell[] = [brandCell(g.brand, answer.brand), modelCell(g.model, answer.model)];

  if (diff.askYear && year !== undefined) {
    cells.push(yearCell(year, answer.year));
  } else if (g.year !== undefined) {
    // No se pide el año, pero si conocemos el del coche escrito lo damos de pista.
    cells.push(yearCell(g.year, answer.year));
  }

  if (diff.askEngine && engine) {
    cells.push(sameCell("engine", "Motor", engine, answer.engine ?? ""));
  }

  // Pistas extra: solo si el coche escrito está en nuestra BBDD.
  if (g.bodyType) cells.push(sameCell("body", "Carrocería", g.bodyType, answer.bodyType));
  if (g.region) cells.push(sameCell("region", "Región", g.region, answer.region));

  const carOk =
    target === "brand"
      ? eq(g.brand, answer.brand)
      : target === "model"
        ? eq(g.model, answer.model)
        : eq(g.brand, answer.brand) && eq(g.model, answer.model);

  const yearOk = !diff.askYear || year === answer.year;
  const engineOk = !diff.askEngine || eq(engine ?? "", answer.engine ?? "");

  const parts = [`${g.brand} ${g.model}`];
  if (diff.askYear && year !== undefined) parts.push(String(year));
  if (diff.askEngine && engine) parts.push(engine);

  return {
    guess: parts.join(" · "),
    resolved: true,
    correct: carOk && yearOk && engineOk,
    cells,
  };
}

/** Opciones del datalist pequeño (modos sin catálogo grande). */
export function optionsFor(cars: Car[], target: Target): string[] {
  const uniq = (xs: string[]) => [...new Set(xs)];
  switch (target) {
    case "car":
    case "model":
      return uniq(cars.map((c) => `${c.brand} ${c.model}`)).sort((a, b) => a.localeCompare(b));
    case "brand":
      return uniq(cars.map((c) => c.brand)).sort((a, b) => a.localeCompare(b));
    case "year":
      return uniq(cars.map((c) => String(c.year))).sort();
  }
}

/**
 * Motorizaciones para elegir: la correcta + señuelos de otros coches.
 * Adivinar "1.6 TDCi" a pelo sería brutal, así que se ofrece de lista.
 */
export function engineChoices(answer: Car, cars: Car[], n = 6): string[] {
  const correct = answer.engine;
  if (!correct) return [];
  const pool = [
    ...new Set(
      cars
        .map((c) => c.engine)
        .filter((e): e is string => Boolean(e) && normalize(e!) !== normalize(correct))
    ),
  ];
  // Barajado estable-ish; el orden real da igual porque se baraja al servir.
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const out = [correct, ...pool.slice(0, Math.max(0, n - 1))];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function revealAnswer(car: Car) {
  return {
    brand: car.brand,
    model: car.model,
    gen: car.gen,
    year: car.year,
    region: car.region,
    bodyType: car.bodyType,
    engine: car.engine,
  };
}
