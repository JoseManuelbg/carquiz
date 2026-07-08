"use client";

import { useState } from "react";
import Link from "next/link";
import Game from "@/app/ui/Game";
import { INFINITE_MODES } from "@/lib/modes";

export default function InfinitePage() {
  const [modeId, setModeId] = useState(INFINITE_MODES[0].id);

  return (
    <main className="flex flex-col items-center gap-6 p-6 sm:p-12">
      <Link href="/" className="self-start text-sm opacity-60 hover:opacity-100">
        ← Inicio
      </Link>
      <h1 className="text-2xl font-bold">Modo infinito</h1>

      <div className="flex flex-wrap gap-2 justify-center">
        {INFINITE_MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setModeId(m.id)}
            className={`rounded-full px-4 py-1.5 text-sm border ${
              m.id === modeId
                ? "bg-foreground text-background border-foreground"
                : "border-black/20 dark:border-white/20"
            }`}
            title={m.description}
          >
            {m.title}
          </button>
        ))}
      </div>

      {/* key forces a fresh Game (new round) when the mode changes */}
      <Game key={modeId} modeId={modeId} />
    </main>
  );
}
