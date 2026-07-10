// Starts a game round and returns everything the client needs EXCEPT the answer.
//
//   GET /api/round?mode=daily                     -> today's car (deterministic)
//   GET /api/round?modes=inf-car,inf-tiles&regions=EUR,JDM
//        -> picks a random viable mode + random car within the region filter
//
// A mode is "viable" only if it has at least one candidate car given the region
// filter, so selecting a mode with no photos never yields a dead round.

import { answerCandidates, getCars } from "@/lib/db";
import { getMode, type Mode } from "@/lib/modes";
import { optionsFor } from "@/lib/game";
import { YEAR_RANGE } from "@/lib/reference";
import { createRound } from "@/lib/rounds";
import { dailyIndex, todayKey } from "@/lib/daily";
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

  // Keep only modes that actually have candidates under the region filter.
  const viable: { mode: Mode; cands: Car[] }[] = [];
  for (const mode of modes) {
    const cands = await answerCandidates(mode.part, regions);
    if (cands.length) viable.push({ mode, cands });
  }
  if (viable.length === 0) {
    return Response.json({ error: "no-data", regions }, { status: 503 });
  }

  const chosen = viable[Math.floor(Math.random() * viable.length)];
  const mode = chosen.mode;
  const candidates = chosen.cands;

  const day = mode.id === "daily" ? todayKey() : undefined;
  const answer =
    mode.id === "daily"
      ? candidates[dailyIndex(day!, candidates.length)]
      : candidates[Math.floor(Math.random() * candidates.length)];

  const image =
    answer.images.find((i) => !mode.part || i.part === mode.part) ?? answer.images[0];

  const roundId = createRound(answer.id, mode.id, mode.maxAttempts);

  return Response.json({
    roundId,
    day,
    mode,
    imageId: image.id,
    options: mode.typeahead ? [] : optionsFor(await getCars(), mode.target),
    yearRange: mode.askYear ? YEAR_RANGE : undefined,
    reveal: mode.reveal ?? "none",
    region: image.region,
    credit: image.credit
      ? { artist: image.credit.artist, license: image.credit.license }
      : undefined,
  });
}
