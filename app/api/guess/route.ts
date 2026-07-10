// Evaluates a guess against the round's answer. Server-authoritative: it counts
// attempts and only reveals the answer once the game is legitimately over.

import { getCarById, getCars } from "@/lib/db";
import { getMode } from "@/lib/modes";
import {
  evaluateCar,
  evaluateDaily,
  evaluateYear,
  revealAnswer,
  type Feedback,
  type GuessCar,
} from "@/lib/game";
import { resolveCar } from "@/lib/reference";
import { getRound } from "@/lib/rounds";
import { normalize } from "@/lib/normalize";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    roundId?: string;
    guess?: string;
    year?: number;
  } | null;

  if (!body?.roundId || typeof body.guess !== "string") {
    return Response.json({ error: "bad-request" }, { status: 400 });
  }

  const round = getRound(body.roundId);
  if (!round) return Response.json({ error: "expired" }, { status: 410 });

  const mode = getMode(round.modeId);
  const answer = await getCarById(round.carId);
  if (!mode || !answer) return Response.json({ error: "gone" }, { status: 410 });

  const alreadyOver = round.solved || round.attempts >= round.maxAttempts;

  let feedback: Feedback;
  if (mode.askYear) {
    feedback = evaluateDaily(answer, await resolveCar(body.guess), body.year);
  } else if (mode.target === "year") {
    feedback = evaluateYear(answer, body.guess);
  } else {
    // Prefer our curated car (full attributes); fall back to the big catalog.
    const n = normalize(body.guess);
    const cars = await getCars();
    const curated =
      cars.find((c) => normalize(`${c.brand} ${c.model}`) === n) ??
      cars.find((c) => normalize(c.model) === n);
    let g: GuessCar | undefined;
    if (curated) {
      g = {
        brand: curated.brand,
        model: curated.model,
        bodyType: curated.bodyType,
        region: curated.region,
        year: curated.year,
      };
    } else {
      const ref = await resolveCar(body.guess);
      if (ref) g = { brand: ref.brand, model: ref.model };
    }
    feedback = g
      ? evaluateCar(answer, g, mode.target)
      : { guess: body.guess, resolved: false, correct: false, cells: [] };
  }

  if (!alreadyOver && feedback.resolved) {
    round.attempts += 1;
    if (feedback.correct) round.solved = true;
  }

  const gameOver = round.solved || round.attempts >= round.maxAttempts;

  return Response.json({
    feedback,
    attempts: round.attempts,
    maxAttempts: round.maxAttempts,
    solved: round.solved,
    gameOver,
    answer: gameOver ? revealAnswer(answer) : undefined,
  });
}
