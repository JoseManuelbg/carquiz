// Evaluates a guess against the round's answer. Server-authoritative: it counts
// attempts and only reveals the answer once the game is legitimately over.

import { getCarById, getCars } from "@/lib/db";
import { getMode } from "@/lib/modes";
import { evaluate, revealAnswer } from "@/lib/game";
import { getRound } from "@/lib/rounds";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    roundId?: string;
    guess?: string;
  } | null;

  if (!body?.roundId || typeof body.guess !== "string") {
    return Response.json({ error: "bad-request" }, { status: 400 });
  }

  const round = getRound(body.roundId);
  if (!round) return Response.json({ error: "expired" }, { status: 410 });

  const mode = getMode(round.modeId);
  const answer = await getCarById(round.carId);
  if (!mode || !answer) {
    return Response.json({ error: "gone" }, { status: 410 });
  }

  const alreadyOver = round.solved || round.attempts >= round.maxAttempts;
  const feedback = evaluate(answer, await getCars(), mode, body.guess);

  // Only count attempts that actually resolved to a known value, and only while
  // the game is still live.
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
