// Evalúa un intento contra la respuesta de la ronda. Autoridad en servidor: los
// intentos se consumen de forma atómica en la BBDD y la respuesta solo se revela
// cuando la partida ha terminado de verdad.

import { getCarById, getCars } from "@/lib/db";
import { getMode } from "@/lib/modes";
import { getDifficulty } from "@/lib/difficulty";
import {
  evaluateGuess,
  evaluateYear,
  revealAnswer,
  type Feedback,
  type GuessCar,
} from "@/lib/game";
import { resolveCar } from "@/lib/reference";
import { applyAttempt, getRound } from "@/lib/rounds";
import { normalize } from "@/lib/normalize";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { bumpDailyAnon, recordDaily, recordInfinite } from "@/lib/stats";
import { todayKey } from "@/lib/daily";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    roundId?: string;
    guess?: string;
    year?: number;
    engine?: string;
  } | null;

  if (!body?.roundId || typeof body.guess !== "string") {
    return Response.json({ error: "bad-request" }, { status: 400 });
  }

  let round = await getRound(body.roundId);
  if (!round) return Response.json({ error: "expired" }, { status: 410 });

  const mode = getMode(round.modeId);
  const answer = await getCarById(round.carId);
  if (!mode || !answer) return Response.json({ error: "gone" }, { status: 410 });

  // El nivel se lee de la ronda, no del cliente: no se puede bajar la dificultad
  // a mitad de partida para que te la den por buena.
  const diff = getDifficulty(round.difficulty);
  const alreadyOver = round.solved || round.attempts >= round.maxAttempts;

  let feedback: Feedback;
  if (mode.target === "year") {
    feedback = evaluateYear(answer, body.guess);
  } else {
    // Texto libre: resolvemos tolerando erratas ("ford focuss" → Ford Focus).
    const ref = await resolveCar(body.guess);

    let g: GuessCar | undefined;
    if (ref) {
      // Si el coche resuelto es uno de los nuestros, usamos todos sus atributos
      // (así se siguen dando las pistas de carrocería/región/año).
      const cars = await getCars();
      const key = normalize(`${ref.brand} ${ref.model}`);
      const curated = cars.find((c) => normalize(`${c.brand} ${c.model}`) === key);

      g = curated
        ? {
            brand: curated.brand,
            model: curated.model,
            bodyType: curated.bodyType,
            region: curated.region,
            year: curated.year,
            engine: curated.engine,
          }
        : { brand: ref.brand, model: ref.model };
    }

    feedback = evaluateGuess(answer, g, body.year, body.engine, diff, mode.target);
  }

  if (!alreadyOver && feedback.resolved) {
    round = (await applyAttempt(round.id, feedback.correct)) ?? round;
  }

  const gameOver = round.solved || round.attempts >= round.maxAttempts;
  const isDaily = round.modeId === "daily";
  const today = todayKey();

  // Si hay sesión, la partida cuenta para stats y rankings. La racha (por
  // dificultad) la calcula el servidor: si la mandara el cliente, cualquiera
  // pondría racha de 999.
  let infStats: { streak: number; best: number } | null = null;
  let bumpedAnonDaily = false;
  if (gameOver) {
    const user = await getCurrentUser();
    if (user) {
      if (isDaily) {
        // recordDaily incrementa también el contador del día (en SQL).
        await recordDaily(user.id, today, round.solved, round.attempts, round.carId);
      } else {
        infStats = await recordInfinite(
          user.id,
          round.solved,
          round.attempts,
          round.modeId,
          round.difficulty,
          round.carId
        );
      }
    } else if (isDaily && round.solved) {
      // Anónimos: cuentan una vez por navegador (dedup por cookie).
      const jar = await cookies();
      if (jar.get("cq_dsolved")?.value !== today) {
        await bumpDailyAnon(today);
        bumpedAnonDaily = true;
      }
    }
  }

  const res = NextResponse.json({
    feedback,
    attempts: round.attempts,
    maxAttempts: round.maxAttempts,
    solved: round.solved,
    gameOver,
    answer: gameOver ? revealAnswer(answer) : undefined,
    stats: infStats ?? undefined,
  });

  if (bumpedAnonDaily) {
    res.cookies.set("cq_dsolved", today, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 36,
    });
  }
  return res;
}
