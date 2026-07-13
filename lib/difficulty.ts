// Niveles de dificultad. Ortogonales al modo: cualquier modo se puede jugar en
// cualquier nivel. Definen QUÉ campos hay que acertar.

export type DifficultyId = "facil" | "normal" | "dificil";

export interface Difficulty {
  id: DifficultyId;
  label: string;
  desc: string;
  askYear: boolean;
  askEngine: boolean;
}

export const DIFFICULTIES: Difficulty[] = [
  {
    id: "facil",
    label: "Principiante",
    desc: "Solo marca y modelo",
    askYear: false,
    askEngine: false,
  },
  {
    id: "normal",
    label: "Normal",
    desc: "Marca, modelo y año",
    askYear: true,
    askEngine: false,
  },
  {
    id: "dificil",
    label: "Experto",
    desc: "Marca, modelo, año y motorización",
    askYear: true,
    askEngine: true,
  },
];

/** El diario es el mismo reto para todo el mundo: nivel fijo. */
export const DAILY_DIFFICULTY: DifficultyId = "normal";

export function getDifficulty(id?: string | null): Difficulty {
  return DIFFICULTIES.find((d) => d.id === id) ?? DIFFICULTIES[1];
}
