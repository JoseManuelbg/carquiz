"use client";

// Reusable game loop for both daily and infinite modes.
// UI is intentionally minimal — the point here is working functionality.

import { useCallback, useEffect, useState } from "react";
import type { Feedback } from "@/lib/game";
import type { Mode } from "@/lib/modes";

interface RoundData {
  roundId: string;
  day?: string;
  mode: Mode;
  imageId: string;
  options: string[];
}

interface GuessResponse {
  feedback: Feedback;
  attempts: number;
  maxAttempts: number;
  solved: boolean;
  gameOver: boolean;
  answer?: {
    brand: string;
    model: string;
    gen?: string;
    year: number;
    region: string;
    bodyType: string;
  };
}

type Status = "loading" | "playing" | "won" | "lost" | "nodata" | "error";

interface SavedDaily {
  day: string;
  status: "won" | "lost";
  guesses: Feedback[];
  answer: GuessResponse["answer"];
}

function dailyKey(day: string) {
  return `carquiz:daily:${day}`;
}

export default function Game({
  modeId,
  daily = false,
}: {
  modeId: string;
  daily?: boolean;
}) {
  const [status, setStatus] = useState<Status>("loading");
  const [round, setRound] = useState<RoundData | null>(null);
  const [guesses, setGuesses] = useState<Feedback[]>([]);
  const [answer, setAnswer] = useState<GuessResponse["answer"]>(undefined);
  const [text, setText] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const maxAttempts = round?.mode.maxAttempts ?? 0;

  const startRound = useCallback(async () => {
    setStatus("loading");
    setGuesses([]);
    setAnswer(undefined);
    setText("");
    setNote(null);
    try {
      const res = await fetch(`/api/round?mode=${encodeURIComponent(modeId)}`, {
        cache: "no-store",
      });
      if (res.status === 503) {
        setStatus("nodata");
        return;
      }
      if (!res.ok) {
        setStatus("error");
        return;
      }
      const data: RoundData = await res.json();

      // Daily: if already played today, restore the saved result.
      if (daily && data.day) {
        const saved = localStorage.getItem(dailyKey(data.day));
        if (saved) {
          const parsed: SavedDaily = JSON.parse(saved);
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
  }, [modeId, daily]);

  useEffect(() => {
    startRound();
  }, [startRound]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!round || status !== "playing") return;
    const guess = text.trim();
    if (!guess) return;

    const res = await fetch("/api/guess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roundId: round.roundId, guess }),
    });
    if (!res.ok) {
      setNote("La ronda ha caducado. Empieza otra.");
      return;
    }
    const data: GuessResponse = await res.json();

    if (!data.feedback.resolved) {
      setNote(`No reconozco «${guess}». Elige uno de la lista.`);
      return;
    }
    setNote(null);
    setText("");

    const nextGuesses = [...guesses, data.feedback];
    setGuesses(nextGuesses);

    if (data.gameOver) {
      const finalStatus: Status = data.solved ? "won" : "lost";
      setAnswer(data.answer);
      setStatus(finalStatus);
      if (daily && round.day) {
        const saved: SavedDaily = {
          day: round.day,
          status: finalStatus === "won" ? "won" : "lost",
          guesses: nextGuesses,
          answer: data.answer,
        };
        localStorage.setItem(dailyKey(round.day), JSON.stringify(saved));
      }
    }
  }

  if (status === "loading") return <p className="opacity-60">Cargando…</p>;
  if (status === "error")
    return <p className="text-red-500">Algo ha fallado. Recarga la página.</p>;
  if (status === "nodata")
    return (
      <p className="text-amber-600">
        Este modo aún no tiene fotos suficientes en la base de datos.
      </p>
    );
  if (!round) return null;

  const attemptsUsed = guesses.filter((g) => g.resolved).length;
  const attemptsLeft = maxAttempts - attemptsUsed;
  const playing = status === "playing";

  return (
    <div className="flex flex-col gap-4 w-full max-w-md">
      <div className="text-sm opacity-70">
        {round.mode.title} · Intentos: {attemptsUsed}/{maxAttempts}
      </div>

      <img
        src={`/api/img/${round.imageId}`}
        alt="Adivina el coche"
        className="w-full rounded-lg border border-black/10 dark:border-white/10 object-cover"
      />

      {playing && (
        <form onSubmit={submit} className="flex gap-2">
          <input
            list="car-options"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholder(round.mode.target)}
            autoComplete="off"
            className="flex-1 rounded-md border border-black/20 dark:border-white/20 bg-transparent px-3 py-2"
          />
          <datalist id="car-options">
            {round.options.map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
          <button
            type="submit"
            className="rounded-md bg-foreground text-background px-4 py-2 font-medium"
          >
            Probar
          </button>
        </form>
      )}

      {note && <p className="text-sm text-amber-600">{note}</p>}

      <ul className="flex flex-col gap-2">
        {guesses.map((g, i) => (
          <li
            key={i}
            className="rounded-md border border-black/10 dark:border-white/10 px-3 py-2 text-sm"
          >
            <span className="font-medium">{g.guess}</span>{" "}
            {g.correct && <span className="text-green-600">✓ correcto</span>}
            {!g.correct && g.attrs && (
              <span className="ml-2 flex flex-wrap gap-2 mt-1">
                <Chip ok={g.attrs.brand === "same"} label="Marca" />
                <Chip ok={g.attrs.bodyType === "same"} label="Carrocería" />
                <Chip ok={g.attrs.region === "same"} label="Región" />
                <YearChip cmp={g.attrs.year} />
              </span>
            )}
            {!g.correct && g.yearHint && g.yearHint !== "equal" && (
              <span className="ml-2">
                {g.yearHint === "higher" ? "el año real es MAYOR ↑" : "el año real es MENOR ↓"}
              </span>
            )}
          </li>
        ))}
      </ul>

      {status === "won" && (
        <p className="text-green-600 font-semibold">
          ¡Acertaste! Era {answer?.brand} {answer?.model}
          {answer?.gen ? ` (${answer.gen})` : ""} · {answer?.year}
        </p>
      )}
      {status === "lost" && (
        <p className="text-red-500 font-semibold">
          Se acabaron los intentos. Era {answer?.brand} {answer?.model}
          {answer?.gen ? ` (${answer.gen})` : ""} · {answer?.year}
        </p>
      )}

      {playing && <p className="text-xs opacity-50">Te quedan {attemptsLeft} intentos.</p>}

      {!daily && !playing && (
        <button
          onClick={startRound}
          className="rounded-md border border-foreground px-4 py-2 font-medium"
        >
          Siguiente coche →
        </button>
      )}
    </div>
  );
}

function placeholder(target: Mode["target"]): string {
  switch (target) {
    case "year":
      return "Escribe un año…";
    case "brand":
      return "Escribe una marca…";
    case "model":
      return "Escribe el modelo…";
    default:
      return "Escribe marca y modelo…";
  }
}

function Chip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-xs ${
        ok ? "bg-green-600/20 text-green-700" : "bg-black/10 dark:bg-white/10 opacity-60"
      }`}
    >
      {label} {ok ? "✓" : "✗"}
    </span>
  );
}

function YearChip({ cmp }: { cmp: "equal" | "higher" | "lower" }) {
  const txt = cmp === "equal" ? "Año ✓" : cmp === "higher" ? "Año ↑" : "Año ↓";
  return (
    <span className="rounded px-1.5 py-0.5 text-xs bg-black/10 dark:bg-white/10">
      {txt}
    </span>
  );
}
