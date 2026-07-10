"use client";

import { useState } from "react";
import Game from "@/app/ui/Game";
import { INFINITE_MODES } from "@/lib/modes";

const REGIONS = [
  { id: "EUR", label: "Europa" },
  { id: "JDM", label: "Japón" },
  { id: "USDM", label: "EE.UU." },
];

const PLAYABLE = INFINITE_MODES.filter((m) => m.part === "full");
const COMING_SOON = INFINITE_MODES.filter((m) => m.part !== "full");

export default function InfinitePage() {
  const [modes, setModes] = useState<Set<string>>(new Set(PLAYABLE.map((m) => m.id)));
  const [regions, setRegions] = useState<Set<string>>(new Set(REGIONS.map((r) => r.id)));
  const [started, setStarted] = useState(false);

  const toggle = (set: Set<string>, id: string) => {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  };

  const canPlay = modes.size > 0 && regions.size > 0;
  const query = `modes=${[...modes].join(",")}&regions=${[...regions].join(",")}`;

  if (started) {
    return (
      <div className="flex flex-col items-center gap-5">
        <button
          onClick={() => setStarted(false)}
          className="self-start text-xs uppercase tracking-wider text-muted hover:text-foreground"
        >
          ← Ajustes
        </button>
        <Game key={query} query={query} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 py-2 max-w-md mx-auto">
      <header className="text-center">
        <h1 className="text-2xl font-extrabold uppercase tracking-wider">Modo infinito</h1>
        <p className="text-sm text-muted mt-1">
          Elige modos y regiones. Con varios, cada ronda sale uno al azar.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-xs uppercase tracking-wider text-muted font-semibold">Modos</h2>
        <div className="flex flex-wrap gap-2">
          {PLAYABLE.map((m) => (
            <Chip
              key={m.id}
              active={modes.has(m.id)}
              onClick={() => setModes((s) => toggle(s, m.id))}
              title={m.description}
            >
              {m.title}
            </Chip>
          ))}
          {COMING_SOON.map((m) => (
            <span
              key={m.id}
              title="Necesita fotos de esa parte"
              className="rounded-md border-2 border-dashed border-tile-border px-3 py-1.5 text-sm text-muted/60"
            >
              {m.title} · pronto
            </span>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xs uppercase tracking-wider text-muted font-semibold">Región</h2>
        <div className="flex flex-wrap gap-2">
          {REGIONS.map((r) => (
            <Chip
              key={r.id}
              active={regions.has(r.id)}
              onClick={() => setRegions((s) => toggle(s, r.id))}
            >
              {r.label}
            </Chip>
          ))}
        </div>
      </section>

      <button
        disabled={!canPlay}
        onClick={() => setStarted(true)}
        className="rounded-full bg-foreground text-background py-3.5 font-bold uppercase tracking-wider transition hover:opacity-90 disabled:opacity-30"
      >
        Jugar
      </button>
    </div>
  );
}

function Chip({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`rounded-md border-2 px-3 py-1.5 text-sm font-semibold transition ${
        active
          ? "border-foreground bg-foreground text-background"
          : "border-tile-border text-muted hover:border-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
