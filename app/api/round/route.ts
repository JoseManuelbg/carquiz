// Starts a game round and returns everything the client needs EXCEPT the answer:
// an opaque image id, the autocomplete options, and a server-side round token.
//
//   GET /api/round?mode=daily        -> today's car (deterministic)
//   GET /api/round?mode=inf-car      -> a random car for the given infinite mode

import { answerCandidates, getCars } from "@/lib/db";
import { getMode } from "@/lib/modes";
import { optionsFor } from "@/lib/game";
import { createRound } from "@/lib/rounds";
import { dailyIndex, todayKey } from "@/lib/daily";

export async function GET(req: Request) {
  const modeId = new URL(req.url).searchParams.get("mode") ?? "inf-car";
  const mode = getMode(modeId);
  if (!mode) return Response.json({ error: "unknown-mode" }, { status: 400 });

  const candidates = await answerCandidates(mode.part);
  if (candidates.length === 0) {
    // No image tagged with this part yet — the mode is defined but not playable.
    return Response.json(
      { error: "no-data", mode: mode.id, part: mode.part ?? null },
      { status: 503 }
    );
  }

  const day = mode.id === "daily" ? todayKey() : undefined;
  const answer =
    mode.id === "daily"
      ? candidates[dailyIndex(day!, candidates.length)]
      : candidates[Math.floor(Math.random() * candidates.length)];

  const image =
    answer.images.find((i) => !mode.part || i.part === mode.part) ?? answer.images[0];

  const roundId = createRound(answer.id, mode.id, mode.maxAttempts);
  const options = optionsFor(await getCars(), mode.target);

  return Response.json({
    roundId,
    day,
    mode,
    imageId: image.id,
    options,
  });
}
