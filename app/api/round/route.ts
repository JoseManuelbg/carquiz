// Arranca una ronda y devuelve todo lo que el cliente necesita EXCEPTO la
// respuesta y la foto limpia (la imagen se pide aparte, ya tapada, por roundId).

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { answerCandidates, getCars, getDailyCar } from "@/lib/db";
import { getMode, type Mode } from "@/lib/modes";
import { engineChoices, optionsFor } from "@/lib/game";
import { DAILY_DIFFICULTY, getDifficulty } from "@/lib/difficulty";
import { YEAR_RANGE } from "@/lib/reference";
import { createRound } from "@/lib/rounds";
import { todayKey } from "@/lib/daily";
import { getCurrentUser } from "@/lib/auth";
import { getInfiniteStreak } from "@/lib/stats";
import type { Car } from "@/lib/types";

const RECENT_COOKIE = "cq_recent";
const MAX_RECENT = 25;

function parseList(v: string | null): string[] {
  return (v ?? "").split(",").map((s) => s.trim()).filter(Boolean);
}

function withoutRecent(candidates: Car[], recent: string[]): Car[] {
  const recentSet = new Set(recent);
  const fresh = candidates.filter((c) => !recentSet.has(c.id));
  const floor = Math.max(8, Math.ceil(candidates.length * 0.3));
  return fresh.length >= floor ? fresh : candidates;
}

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const filters = {
    regions: parseList(sp.get("regions")),
    brands: parseList(sp.get("brands")),
    bodies: parseList(sp.get("bodies")),
    decades: parseList(sp.get("decades")).map(Number).filter(Number.isFinite),
  };

  const single = sp.get("mode");
  const modeIds = single ? [single] : parseList(sp.get("modes"));
  const modes = modeIds.map(getMode).filter((m): m is Mode => Boolean(m));
  if (modes.length === 0) return NextResponse.json({ error: "unknown-mode" }, { status: 400 });

  const isDaily = modes.length === 1 && modes[0].id === "daily";
  const diff = getDifficulty(isDaily ? DAILY_DIFFICULTY : sp.get("difficulty"));

  // Intensidad (cuánto se tapa la foto) = racha. Para usuarios con sesión sale
  // de la BBDD (no manipulable); anónimos la mandan y da igual (no puntúan).
  let intensity = 0;
  if (!isDaily) {
    const user = await getCurrentUser();
    if (user) {
      // Racha de ESA dificultad (no manipulable).
      intensity = await getInfiniteStreak(user.id, diff.id);
    } else {
      intensity = Math.max(0, Math.min(40, Number(sp.get("streak")) || 0));
    }
  }

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
      const cands = await answerCandidates(m.part, filters);
      if (cands.length) viable.push({ mode: m, cands });
    }
    if (viable.length === 0) {
      return NextResponse.json({ error: "no-data" }, { status: 503 });
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

  const roundId = await createRound(answer.id, mode.id, mode.maxAttempts, diff.id, intensity);
  const cars = await getCars();

  // Si el modo YA pide el año como respuesta (morro → año), la dificultad no
  // debe añadir otro campo de año/motor encima: sería redundante y confuso.
  const targetIsYear = mode.target === "year";
  const askYear = diff.askYear && !targetIsYear;
  const askEngine = diff.askEngine && !targetIsYear;

  const res = NextResponse.json({
    roundId,
    day,
    mode,
    difficulty: { id: diff.id, askYear, askEngine },
    // Imagen SIEMPRE por ronda: el id real de la foto no se expone nunca.
    imageUrl: `/api/round-img/${roundId}`,
    reveal: mode.reveal ?? "none",
    options: mode.typeahead ? [] : optionsFor(cars, mode.target),
    yearRange: askYear ? YEAR_RANGE : undefined,
    engineOptions: askEngine ? engineChoices(answer, cars) : undefined,
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
