// Arranca una ronda y devuelve todo lo que el cliente necesita EXCEPTO la respuesta.
//
//   GET /api/round?mode=daily
//   GET /api/round?modes=inf-car,inf-tiles&regions=EUR,JDM&difficulty=dificil

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { answerCandidates, getCars, getDailyCar } from "@/lib/db";
import { getMode, type Mode } from "@/lib/modes";
import { engineChoices, optionsFor } from "@/lib/game";
import { DAILY_DIFFICULTY, getDifficulty } from "@/lib/difficulty";
import { YEAR_RANGE } from "@/lib/reference";
import { createRound } from "@/lib/rounds";
import { todayKey } from "@/lib/daily";
import type { Car } from "@/lib/types";

const RECENT_COOKIE = "cq_recent";
const MAX_RECENT = 25;

function parseList(v: string | null): string[] {
  return (v ?? "").split(",").map((s) => s.trim()).filter(Boolean);
}

/**
 * Evita que se repitan los coches: descarta los vistos hace poco.
 * Los ids van en una cookie httpOnly (el cliente nunca los ve: si los viera,
 * podría mapear id → coche y saber la respuesta).
 * Además, si excluir dejase el pool demasiado pequeño, se ignora la exclusión.
 * Así, aunque alguien manipule la cookie, no puede forzar cuál va a tocar.
 */
function withoutRecent(candidates: Car[], recent: string[]): Car[] {
  const recentSet = new Set(recent);
  const fresh = candidates.filter((c) => !recentSet.has(c.id));
  const floor = Math.max(8, Math.ceil(candidates.length * 0.3));
  return fresh.length >= floor ? fresh : candidates;
}

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const regions = parseList(sp.get("regions"));

  const single = sp.get("mode");
  const modeIds = single ? [single] : parseList(sp.get("modes"));
  const modes = modeIds.map(getMode).filter((m): m is Mode => Boolean(m));
  if (modes.length === 0) return NextResponse.json({ error: "unknown-mode" }, { status: 400 });

  const isDaily = modes.length === 1 && modes[0].id === "daily";
  const diff = getDifficulty(isDaily ? DAILY_DIFFICULTY : sp.get("difficulty"));

  const jar = await cookies();
  const recent = parseList(jar.get(RECENT_COOKIE)?.value ?? "");

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
      return NextResponse.json({ error: "no-data", regions }, { status: 503 });
    }
    const chosen = viable[Math.floor(Math.random() * viable.length)];
    mode = chosen.mode;
    const pool = withoutRecent(chosen.cands, recent);
    answer = pool[Math.floor(Math.random() * pool.length)];
  }

  if (!answer) return NextResponse.json({ error: "no-data" }, { status: 503 });

  const image =
    answer.images.find((i) => !mode.part || i.part === mode.part) ?? answer.images[0];
  if (!image) return NextResponse.json({ error: "no-data" }, { status: 503 });

  const roundId = await createRound(answer.id, mode.id, mode.maxAttempts, diff.id);
  const cars = await getCars();

  const res = NextResponse.json({
    roundId,
    day,
    mode,
    difficulty: { id: diff.id, askYear: diff.askYear, askEngine: diff.askEngine },
    imageId: image.id,
    options: mode.typeahead ? [] : optionsFor(cars, mode.target),
    yearRange: diff.askYear ? YEAR_RANGE : undefined,
    engineOptions: diff.askEngine ? engineChoices(answer, cars) : undefined,
    reveal: mode.reveal ?? "none",
    region: image.region,
    credit: image.credit
      ? { artist: image.credit.artist, license: image.credit.license }
      : undefined,
  });

  if (!isDaily) {
    const updated = [answer.id, ...recent.filter((id) => id !== answer!.id)].slice(
      0,
      MAX_RECENT
    );
    res.cookies.set(RECENT_COOKIE, updated.join(","), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
  }

  return res;
}
