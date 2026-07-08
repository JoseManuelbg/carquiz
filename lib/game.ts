// Core game logic: build the autocomplete option list and evaluate a guess.
// Pure functions, no I/O — easy to reason about and unit-test later.

import type { Car } from "./types";
import type { Mode, Target } from "./modes";
import { normalize } from "./normalize";

export type YearCmp = "equal" | "higher" | "lower";
export type SameCmp = "same" | "different";

export interface Feedback {
  /** Canonical label of what we matched, or the raw text if unrecognized. */
  guess: string;
  /** Whether the typed text matched a known value in the dataset. */
  resolved: boolean;
  correct: boolean;
  /** Attribute comparison (target "car" / "model" / "brand"). */
  attrs?: {
    brand: SameCmp;
    bodyType: SameCmp;
    region: SameCmp;
    /** Relative to the answer: "higher" => the answer's year is higher (go up). */
    year: YearCmp;
  };
  /** Numeric hint (target "year"). */
  yearHint?: YearCmp;
}

function unique(xs: string[]): string[] {
  return [...new Set(xs)];
}

/** Labels shown in the autocomplete datalist, derived from the dataset. */
export function optionsFor(cars: Car[], target: Target): string[] {
  switch (target) {
    case "car":
    case "model":
      return unique(cars.map((c) => `${c.brand} ${c.model}`)).sort((a, b) =>
        a.localeCompare(b)
      );
    case "brand":
      return unique(cars.map((c) => c.brand)).sort((a, b) => a.localeCompare(b));
    case "year":
      return unique(cars.map((c) => String(c.year))).sort();
  }
}

function findCarByText(cars: Car[], text: string): Car | undefined {
  const n = normalize(text);
  return (
    cars.find((c) => normalize(`${c.brand} ${c.model}`) === n) ??
    cars.find((c) => normalize(c.model) === n)
  );
}

/** Evaluate a raw guess string against the answer for the given mode. */
export function evaluate(
  answer: Car,
  cars: Car[],
  mode: Mode,
  text: string
): Feedback {
  if (mode.target === "year") {
    const gy = parseInt(text, 10);
    if (!Number.isFinite(gy)) return { guess: text, resolved: false, correct: false };
    return {
      guess: String(gy),
      resolved: true,
      correct: gy === answer.year,
      yearHint: gy === answer.year ? "equal" : answer.year > gy ? "higher" : "lower",
    };
  }

  if (mode.target === "brand") {
    const n = normalize(text);
    const g = cars.find((c) => normalize(c.brand) === n);
    return {
      guess: g?.brand ?? text,
      resolved: Boolean(g),
      correct: Boolean(g) && g!.brand === answer.brand,
    };
  }

  // target "car" or "model"
  const g = findCarByText(cars, text);
  if (!g) return { guess: text, resolved: false, correct: false };
  const correct =
    mode.target === "model"
      ? normalize(g.model) === normalize(answer.model)
      : g.brand === answer.brand && g.model === answer.model;

  return {
    guess: `${g.brand} ${g.model}`,
    resolved: true,
    correct,
    attrs: {
      brand: g.brand === answer.brand ? "same" : "different",
      bodyType: g.bodyType === answer.bodyType ? "same" : "different",
      region: g.region === answer.region ? "same" : "different",
      year:
        g.year === answer.year ? "equal" : answer.year > g.year ? "higher" : "lower",
    },
  };
}

/** Minimal, safe representation of the answer revealed at game end. */
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
