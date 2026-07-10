// Core game logic: build guess feedback as a row of colored "cells".
// Pure functions, no I/O.
//
// Cell colors:
//   green  = exact match
//   yellow = warm (year within tolerance)
//   gray   = miss

import type { Car } from "./types";
import type { Target } from "./modes";
import { normalize } from "./normalize";
import type { RefCar } from "./reference";

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

/** Attributes we know about a guessed car. body/region/year are optional because
 *  a guess picked from the big catalog only carries brand + model. */
export interface GuessCar {
  brand: string;
  model: string;
  bodyType?: string;
  region?: string;
  year?: number;
}

const YEAR_TOL = 3;

function eq(a: string, b: string): boolean {
  return normalize(a) === normalize(b);
}

function brandCell(g: string, a: string): Cell {
  return { key: "brand", label: "Marca", value: g, state: eq(g, a) ? "green" : "gray" };
}

// Model is green (exact) or gray. No "warm" state — body segment has its own cell.
function modelCell(g: string, a: string): Cell {
  return { key: "model", label: "Modelo", value: g, state: eq(g, a) ? "green" : "gray" };
}

function yearCell(g: number, a: number): Cell {
  const d = a - g;
  const state: CellState = d === 0 ? "green" : Math.abs(d) <= YEAR_TOL ? "yellow" : "gray";
  return {
    key: "year",
    label: "Año",
    value: String(g),
    state,
    arrow: d === 0 ? undefined : d > 0 ? "up" : "down",
  };
}

function sameCell(key: string, label: string, g: string, a: string): Cell {
  return { key, label, value: g, state: eq(g, a) ? "green" : "gray" };
}

/** Daily: guess = a catalog car (brand+model) plus a typed year. */
export function evaluateDaily(
  answer: Car,
  ref: RefCar | undefined,
  year: number | undefined
): Feedback {
  if (!ref || year === undefined || !Number.isFinite(year)) {
    return { guess: ref ? `${ref.brand} ${ref.model}` : "", resolved: false, correct: false, cells: [] };
  }
  const cells: Cell[] = [
    brandCell(ref.brand, answer.brand),
    modelCell(ref.model, answer.model),
    yearCell(year, answer.year),
  ];
  const correct =
    eq(ref.brand, answer.brand) && eq(ref.model, answer.model) && year === answer.year;
  return { guess: `${ref.brand} ${ref.model} · ${year}`, resolved: true, correct, cells };
}

/** Infinite "year" target (e.g. morro → año). */
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

/** Infinite car/model/brand targets. Extra cells appear only when the guessed
 *  car is one we have full data on; catalog-only guesses show brand + model. */
export function evaluateCar(answer: Car, g: GuessCar, target: Target): Feedback {
  const cells: Cell[] = [brandCell(g.brand, answer.brand), modelCell(g.model, answer.model)];
  if (g.bodyType) cells.push(sameCell("body", "Carrocería", g.bodyType, answer.bodyType));
  if (g.region) cells.push(sameCell("region", "Región", g.region, answer.region));
  if (g.year !== undefined) cells.push(yearCell(g.year, answer.year));

  const correct =
    target === "brand"
      ? eq(g.brand, answer.brand)
      : target === "model"
        ? eq(g.model, answer.model)
        : eq(g.brand, answer.brand) && eq(g.model, answer.model);

  return { guess: `${g.brand} ${g.model}`, resolved: true, correct, cells };
}

/** Options for the small static datalist (only used by non-typeahead modes now). */
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

export function revealAnswer(car: Car) {
  return {
    brand: car.brand,
    model: car.model,
    gen: car.gen,
    year: car.year,
    region: car.region,
    bodyType: car.bodyType,
  };
}
