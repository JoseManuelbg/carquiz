// Game mode definitions.
//
// A mode is a reusable rule set: which part of the car is shown, what the player
// must identify, and how many attempts they get. Adding a new "challenge" (e.g.
// "taillight -> brand") is just one more entry in INFINITE_MODES.

import type { Part, RevealStrategy } from "./types";

/** What the player must identify. */
export type Target = "car" | "model" | "brand" | "year";

export interface Mode {
  id: string;
  title: string;
  description: string;
  /** Image part shown to the player. Undefined = any available image. */
  part?: Part;
  target: Target;
  maxAttempts: number;
  /** Also ask for a year (adds the Año column). */
  askYear?: boolean;
  /** Autocomplete from the big reference catalog instead of the curated list. */
  typeahead?: boolean;
  /** How the photo is revealed. Defaults to "none" (full photo). */
  reveal?: RevealStrategy;
}

// The daily (Wordle-style) mode. Same car for everyone on a given day.
// `target` is intentionally kept at "car" for now; change this single line to
// make the daily easier/harder (e.g. "brand") without touching anything else.
export const DAILY_MODE: Mode = {
  id: "daily",
  title: "Coche del día",
  description: "Un coche nuevo cada día, el mismo para todo el mundo.",
  part: "full",
  target: "car",
  maxAttempts: 6,
  askYear: true,
  typeahead: true,
  reveal: "tiles",
};

// Endless modes. Each is a (part -> attribute) challenge.
export const INFINITE_MODES: Mode[] = [
  {
    id: "inf-car",
    title: "Coche completo",
    description: "Foto entera del coche. Adivina marca y modelo.",
    part: "full",
    target: "car",
    maxAttempts: 6,
    typeahead: true,
  },
  {
    id: "inf-blur",
    title: "Desenfoque",
    description: "Empieza borrosa y se aclara con cada fallo.",
    part: "full",
    target: "car",
    maxAttempts: 6,
    reveal: "blur",
    typeahead: true,
  },
  {
    id: "inf-tiles",
    title: "Por zonas",
    description: "Una rejilla tapa la foto y se destapa poco a poco.",
    part: "full",
    target: "car",
    maxAttempts: 6,
    reveal: "tiles",
    typeahead: true,
  },
  // Estos dos usan el recorte anotado en /admin (part + region_box).
  {
    id: "inf-faro-model",
    title: "Faro",
    description: "Solo el faro. Adivina el coche.",
    part: "headlight",
    target: "car",
    maxAttempts: 5,
    typeahead: true,
    reveal: "region",
  },
  {
    id: "inf-morro-year",
    title: "Morro → Año",
    description: "Solo el morro. Adivina el año.",
    part: "front",
    target: "year",
    maxAttempts: 5,
    reveal: "region",
  },
];

export const ALL_MODES: Mode[] = [DAILY_MODE, ...INFINITE_MODES];

export function getMode(id: string): Mode | undefined {
  return ALL_MODES.find((m) => m.id === id);
}
