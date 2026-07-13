"use client";

import { useState } from "react";
import Game from "@/app/ui/Game";
import { INFINITE_MODES } from "@/lib/modes";
import { DIFFICULTIES } from "@/lib/difficulty";

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
  const [difficulty, setDifficulty] = useState("normal");
  const [started, setStarted] = useState(false);

  const toggle = (set: Set<string>, id: string) => {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  };

  const canPlay = modes.size > 0 && regions.size > 0;
  const query = `modes=${[...modes].join(",")}&regions=${[...regions].join(
    ","
  )}&difficulty=${difficulty}`;

  if (started) {
    return (
      <div className="flex flex-col items-center gap-5">
        <button
          onClick={() => setStarted(false)}
          className="self-start font-display text-xs uppercase tracking-widest text-muted hover:text-accent transition-colors"
        >
          ← Ajustes
        </button>
        <Game key={query} query={query} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 py-2">
      <header className="flex items-center gap-3">
        <span className="racing-stripe h-1 w-8" />
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide">
          Modo infinito
        </h1>
        <span className="racing-stripe h-1 flex-1 opacity-40" />
      </header>
      <p className="-mt-6 text-sm text-muted">
        Elige modos y regiones. Con varios, cada ronda sale uno al azar.
      </p>

      <Section title="Modos">
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
            title="Necesita anotar la zona en /admin"
            className="rounded-sm border border-dashed border-line px-3 py-1.5 font-display text-sm uppercase tracking-wide text-muted/50"
          >
            {m.title} · pronto
          </span>
        ))}
      </Section>

      <Section title="Región">
        {REGIONS.map((r) => (
          <Chip
            key={r.id}
            active={regions.has(r.id)}
            onClick={() => setRegions((s) => toggle(s, r.id))}
          >
            {r.label}
          </Chip>
        ))}
      </Section>

      <Section title="Dificultad">
        {DIFFICULTIES.map((d) => (
          <Chip
            key={d.id}
            active={difficulty === d.id}
            onClick={() => setDifficulty(d.id)}
            title={d.desc}
          >
            {d.label}
          </Chip>
        ))}
      </Section>
      <p className="-mt-6 text-xs text-muted">
        {DIFFICULTIES.find((d) => d.id === difficulty)?.desc}
      </p>

      <button
        disabled={!canPlay}
        onClick={() => setStarted(true)}
        className="rounded-sm bg-accent text-white py-4 font-display text-lg font-bold uppercase tracking-[0.2em] transition hover:brightness-110 active:scale-[0.99] disabled:opacity-30"
      >
        Arrancar
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-xs uppercase tracking-[0.2em] text-muted">
        {title}
      </h2>
      <div className="flex flex-wrap gap-2">{children}</div>
    </section>
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
      className={`rounded-sm border px-3 py-1.5 font-display text-sm uppercase tracking-wide transition ${
        active
          ? "border-accent bg-accent text-white"
          : "border-line bg-surface text-muted hover:border-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
