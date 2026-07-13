"use client";

// Reusable game loop for both daily and infinite modes.
//
// `query` is the /api/round query string (e.g. "mode=daily" or
// "modes=inf-car,inf-tiles&regions=EUR"). Infinite scales difficulty with the
// player's streak: more correct answers in a row = the photo stays hidden longer.

import { useCallback, useEffect, useRef, useState } from "react";
import type { Cell, Feedback } from "@/lib/game";
import type { Mode } from "@/lib/modes";
import type { Credit, Region, RevealStrategy } from "@/lib/types";
import RevealImage from "./RevealImage";

interface RoundData {
  roundId: string;
  day?: string;
  mode: Mode;
  difficulty: { id: string; askYear: boolean; askEngine: boolean };
  imageId: string;
  options: string[];
  yearRange?: [number, number];
  engineOptions?: string[];
  reveal: RevealStrategy;
  region?: Region;
  credit?: Credit;
}

interface RevealedAnswer {
  brand: string;
  model: string;
  gen?: string;
  year: number;
  region: string;
  bodyType: string;
}

interface GuessResponse {
  feedback: Feedback;
  attempts: number;
  maxAttempts: number;
  solved: boolean;
  gameOver: boolean;
  answer?: RevealedAnswer;
  /** Solo si hay sesión: racha/récord calculados en servidor. */
  stats?: { streak: number; best: number; dailyStreak: number };
}

type Status = "loading" | "playing" | "won" | "lost" | "nodata" | "error";

const dailyKey = (day: string) => `carquiz:daily:${day}`;
const bestKey = (q: string) => `carquiz:best:${q}`;

export default function Game({ query, daily = false }: { query: string; daily?: boolean }) {
  const [status, setStatus] = useState<Status>("loading");
  const [round, setRound] = useState<RoundData | null>(null);
  const [guesses, setGuesses] = useState<Feedback[]>([]);
  const [answer, setAnswer] = useState<RevealedAnswer | undefined>(undefined);
  const [text, setText] = useState("");
  const [year, setYear] = useState("");
  const [engine, setEngine] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const askYear = round?.difficulty.askYear ?? false;
  const askEngine = round?.difficulty.askEngine ?? false;
  const typeahead = round?.mode.typeahead ?? false;
  const maxAttempts = round?.mode.maxAttempts ?? 0;

  // Empieza por un await a propósito: así no hay setState síncrono dentro del
  // efecto (provocaría renders en cascada).
  const loadRound = useCallback(async () => {
    try {
      const res = await fetch(`/api/round?${query}`, { cache: "no-store" });
      if (res.status === 503) return setStatus("nodata");
      if (!res.ok) return setStatus("error");
      const data: RoundData = await res.json();

      // El récord vive en localStorage (solo existe en el navegador).
      if (!daily) setBest(Number(localStorage.getItem(bestKey(query)) ?? 0));

      if (daily && data.day) {
        const saved = localStorage.getItem(dailyKey(data.day));
        if (saved) {
          const parsed = JSON.parse(saved);
          setRound(data);
          setGuesses(parsed.guesses);
          setAnswer(parsed.answer);
          setStatus(parsed.status);
          return;
        }
      }
      setRound(data);
      setStatus("playing");
    } catch {
      setStatus("error");
    }
  }, [query, daily]);

  /** "Siguiente coche": limpia la mesa y pide otra ronda. */
  const nextRound = useCallback(() => {
    setStatus("loading");
    setGuesses([]);
    setAnswer(undefined);
    setText("");
    setYear("");
    setEngine("");
    setSuggestions([]);
    setNote(null);
    loadRound();
  }, [loadRound]);

  useEffect(() => {
    // La regla no puede ver que loadRound empieza por un `await`: sus setState
    // ocurren tras la petición, no de forma síncrona. Es la carga inicial de la
    // ronda, que es justo para lo que sirve un efecto.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRound();
  }, [loadRound]);

  function onTextChange(v: string) {
    setText(v);
    if (!typeahead) return;
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(async () => {
      if (v.trim().length < 2) return setSuggestions([]);
      try {
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(v)}`);
        const data: { items: string[] } = await res.json();
        setSuggestions(data.items);
      } catch {
        /* ignore */
      }
    }, 150);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!round || status !== "playing") return;
    const guess = text.trim();
    if (!guess) return;
    if (askYear && !year.trim()) return setNote("Pon también un año.");
    if (askEngine && !engine) return setNote("Elige una motorización.");

    const res = await fetch("/api/guess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roundId: round.roundId,
        guess,
        year: askYear ? Number(year) : undefined,
        engine: askEngine ? engine : undefined,
      }),
    });
    if (!res.ok) return setNote("La ronda ha caducado. Empieza otra.");
    const data: GuessResponse = await res.json();

    if (!data.feedback.resolved) {
      setNote(`No reconozco «${guess}». Elígelo de la lista.`);
      return;
    }
    setNote(null);
    setText("");
    setYear("");
    setEngine("");
    setSuggestions([]);

    const next = [...guesses, data.feedback];
    setGuesses(next);

    if (data.gameOver) {
      const finalStatus: "won" | "lost" = data.solved ? "won" : "lost";
      setAnswer(data.answer);
      setStatus(finalStatus);

      if (daily && round.day) {
        localStorage.setItem(
          dailyKey(round.day),
          JSON.stringify({ status: finalStatus, guesses: next, answer: data.answer })
        );
      } else if (!daily) {
        if (data.stats) {
          // Con sesión manda el servidor.
          setStreak(data.stats.streak);
          setBest(data.stats.best);
        } else if (data.solved) {
          const s = streak + 1;
          setStreak(s);
          if (s > best) {
            setBest(s);
            localStorage.setItem(bestKey(query), String(s));
          }
        } else {
          setStreak(0);
        }
      }
    }
  }

  if (status === "loading")
    return <p className="text-muted py-16 text-sm">Cargando…</p>;
  if (status === "error")
    return <p className="text-accent py-16 text-sm">Algo ha fallado. Recarga la página.</p>;
  if (status === "nodata")
    return (
      <p className="text-muted py-16 text-center text-sm">
        No hay fotos para esa combinación de modos y regiones todavía.
      </p>
    );
  if (!round) return null;

  const used = guesses.filter((g) => g.resolved).length;
  const playing = status === "playing";
  const level = !playing
    ? 1
    : daily
      ? maxAttempts
        ? used / maxAttempts
        : 1
      : used / (maxAttempts + streak);

  return (
    <div className="flex flex-col gap-5 w-full max-w-lg">
      {/* Marcador tipo salpicadero */}
      <div className="panel flex items-stretch divide-x divide-line rounded-sm">
        <div className="flex-1 px-4 py-2.5">
          <div className="font-display text-[10px] uppercase tracking-[0.2em] text-muted">
            Intento
          </div>
          <div className="readout text-xl font-bold">
            {String(used).padStart(2, "0")}
            <span className="text-muted">/{String(maxAttempts).padStart(2, "0")}</span>
          </div>
        </div>
        {!daily && (
          <>
            <div className="flex-1 px-4 py-2.5">
              <div className="font-display text-[10px] uppercase tracking-[0.2em] text-muted">
                Racha
              </div>
              <div className="readout text-xl font-bold text-accent">
                {String(streak).padStart(2, "0")}
              </div>
            </div>
            <div className="flex-1 px-4 py-2.5">
              <div className="font-display text-[10px] uppercase tracking-[0.2em] text-muted">
                Récord
              </div>
              <div className="readout text-xl font-bold">
                {String(best).padStart(2, "0")}
              </div>
            </div>
          </>
        )}
      </div>

      <RevealImage
        src={`/api/img/${round.imageId}`}
        strategy={round.reveal}
        region={round.region}
        level={level}
        intensity={daily ? 0 : streak}
        gameOver={!playing}
      />

      {round.credit && (
        <p className="-mt-3 text-[11px] text-muted/70">
          Foto: {round.credit.artist} · {round.credit.license} · Wikimedia Commons
        </p>
      )}

      {playing && (
        <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
          <input
            list="guess-opts"
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder="Marca y modelo…"
            autoComplete="off"
            className="flex-1 min-w-48 rounded-sm border border-line bg-surface px-3 py-2.5 outline-none focus:border-accent transition-colors placeholder:text-muted"
          />
          <datalist id="guess-opts">
            {(typeahead ? suggestions : round.options).map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>

          {askYear && (
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="Año"
              min={round.yearRange?.[0]}
              max={round.yearRange?.[1]}
              className="w-24 rounded-sm border border-line bg-surface px-3 py-2.5 outline-none focus:border-accent transition-colors placeholder:text-muted readout"
            />
          )}

          {askEngine && round.engineOptions && (
            <select
              value={engine}
              onChange={(e) => setEngine(e.target.value)}
              className="rounded-sm border border-line bg-surface px-3 py-2.5 outline-none focus:border-accent transition-colors"
            >
              <option value="">Motorización…</option>
              {round.engineOptions.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          )}

          <button
            type="submit"
            className="rounded-sm bg-accent text-white px-6 py-2.5 font-display text-sm font-bold uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition"
          >
            Probar
          </button>
        </form>
      )}

      {note && <p className="text-sm text-accent">{note}</p>}

      <ul className="flex flex-col gap-2">
        {guesses.map((g, i) => (
          <li key={i} className="flex flex-wrap items-stretch gap-1.5">
            {g.cells.map((c) => (
              <CellBox key={c.key} cell={c} />
            ))}
          </li>
        ))}
      </ul>

      {(status === "won" || status === "lost") && answer && (
        <div className="panel rounded-sm py-6 text-center flex flex-col gap-1 relative overflow-hidden">
          <span
            className={`absolute inset-x-0 top-0 h-1 ${
              status === "won" ? "checker" : "racing-stripe"
            }`}
          />
          <p
            className={`font-display text-sm font-bold uppercase tracking-[0.2em] ${
              status === "won" ? "text-correct" : "text-accent"
            }`}
          >
            {status === "won" ? "¡Correcto!" : "Se acabó"}
          </p>
          <p className="font-display text-3xl font-bold uppercase tracking-wide">
            {answer.brand} {answer.model}
            {answer.gen ? ` · ${answer.gen}` : ""}
          </p>
          <p className="text-sm text-muted">
            {answer.year} · {answer.bodyType} · {answer.region}
          </p>
        </div>
      )}

      {!daily && !playing && (
        <button
          onClick={nextRound}
          className="self-center rounded-sm border border-line bg-surface px-6 py-2.5 font-display text-sm font-bold uppercase tracking-widest hover:border-accent hover:text-accent transition"
        >
          Siguiente coche →
        </button>
      )}
    </div>
  );
}

function CellBox({ cell }: { cell: Cell }) {
  const bg =
    cell.state === "green" ? "bg-correct" : cell.state === "yellow" ? "bg-present" : "bg-absent";
  const arrow = cell.arrow === "up" ? " ↑" : cell.arrow === "down" ? " ↓" : "";
  return (
    <span
      className={`flex flex-col items-center justify-center gap-0.5 rounded-sm px-3 py-2 min-w-20 text-white ${bg}`}
    >
      <span className="font-display text-[9px] uppercase tracking-[0.15em] opacity-75">
        {cell.label}
      </span>
      <span className="font-display font-bold text-base uppercase tracking-wide">
        {cell.value}
        {arrow}
      </span>
    </span>
  );
}
