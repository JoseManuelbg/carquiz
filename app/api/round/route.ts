// Arranca una ronda y devuelve todo lo que el cliente necesita EXCEPTO la respuesta.
//
//   GET /api/round?mode=daily
//   GET /api/round?modes=inf-car,inf-tiles&regions=EUR,JDM&difficulty=dificil

import { answerCandidates, getCars, getDailyCar } from "@/lib/db";
import { getMode, type Mode } from "@/lib/modes";
import { engineChoices, optionsFor } from "@/lib/game";
import { DAILY_DIFFICULTY, getDifficulty } from "@/lib/difficulty";
import { YEAR_RANGE } from "@/lib/reference";
import { createRound } from "@/lib/rounds";
import { todayKey } from "@/lib/daily";
import type { Car } from "@/lib/types";

function parseList(v: string | null): string[] {
  return (v ?? "").split(",").map((s) => s.trim()).filter(Boolean);
}

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const regions = parseList(sp.get("regions"));

  const single = sp.get("mode");
  const modeIds = single ? [single] : parseList(sp.get("modes"));
  const modes = modeIds.map(getMode).filter((m): m is Mode => Boolean(m));
  if (modes.length === 0) return Response.json({ error: "unknown-mode" }, { status: 400 });

  const isDaily = modes.length === 1 && modes[0].id === "daily";
  // El diario es el mismo reto para todos: nivel fijo, no elegible.
  const diff = getDifficulty(isDaily ? DAILY_DIFFICULTY : sp.get("difficulty"));

  let mode: Mode;
  let answer: Car | undefined;
  let day: string | undefined;

  if (isDaily) {
    mode = modes[0];
    day = todayKey();
    answer = await getDailyCar(day, mode.part);
  } else {
    const viable: { mode: Mode; cands: Car[] }[] = [];
    for (const m of modes) {
      const cands = await answerCandidates(m.part, regions);
      if (cands.length) viable.push({ mode: m, cands });
    }
    if (viable.length === 0) {
      return Response.json({ error: "no-data", regions }, { status: 503 });
    }
    const chosen = viable[Math.floor(Math.random() * viable.length)];
    mode = chosen.mode;
    answer = chosen.cands[Math.floor(Math.random() * chosen.cands.length)];
  }

  if (!answer) return Response.json({ error: "no-data" }, { status: 503 });

  const image =
    answer.images.find((i) => !mode.part || i.part === mode.part) ?? answer.images[0];
  if (!image) return Response.json({ error: "no-data" }, { status: 503 });

  const roundId = await createRound(answer.id, mode.id, mode.maxAttempts, diff.id);
  const cars = await getCars();

  return Response.json({
    roundId,
    day,
    mode,
    difficulty: { id: diff.id, askYear: diff.askYear, askEngine: diff.askEngine },
    imageId: image.id,
    options: mode.typeahead ? [] : optionsFor(cars, mode.target),
    yearRange: diff.askYear ? YEAR_RANGE : undefined,
    // Motorización de lista: la correcta mezclada con señuelos.
    engineOptions: diff.askEngine ? engineChoices(answer, cars) : undefined,
    reveal: mode.reveal ?? "none",
    region: image.region,
    credit: image.credit
      ? { artist: image.credit.artist, license: image.credit.license }
      : undefined,
  });
}
