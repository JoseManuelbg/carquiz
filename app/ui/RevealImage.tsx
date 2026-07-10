"use client";

// Progressive / partial image reveal. All strategies work on a single full photo.
//
//   none    -> whole photo
//   blur    -> starts blurred, sharpens as `level` rises
//   tiles   -> a grid of panels that flip away (3D) as `level` rises
//   region  -> shows ONLY a cropped rectangle (e.g. the headlight)
//
// `level` is 0..1 (how revealed). `intensity` (>=0, from the streak) makes the
// challenge harder: a finer tile grid and stronger blur. `gameOver` shows all.

import { useMemo } from "react";
import type { Region, RevealStrategy } from "@/lib/types";

export type { Region, RevealStrategy };

function pseudoOrder(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i).sort(
    (a, b) => (((a + 1) * 2654435761) % 2147483647) - (((b + 1) * 2654435761) % 2147483647)
  );
}

export default function RevealImage({
  src,
  strategy = "none",
  level,
  intensity = 0,
  region,
  gameOver = false,
}: {
  src: string;
  strategy?: RevealStrategy;
  level: number;
  intensity?: number;
  region?: Region;
  gameOver?: boolean;
}) {
  // Harder with streak: finer grid (4→8) and stronger blur.
  const grid = Math.min(4 + Math.floor(intensity / 2), 8);
  const maxBlur = Math.min(22 + intensity * 5, 64);
  const total = grid * grid;
  const order = useMemo(() => pseudoOrder(total), [total]);

  const r = gameOver ? 1 : Math.max(0, Math.min(1, level));
  const frame = "w-full rounded-md border-2 border-tile-border overflow-hidden bg-background";

  if (strategy === "region" && region && !gameOver) {
    const w = Math.min(0.999, region.w);
    const h = Math.min(0.999, region.h);
    return (
      <div
        className={`${frame} aspect-video bg-no-repeat`}
        style={{
          backgroundImage: `url(${src})`,
          backgroundSize: `${100 / w}% ${100 / h}%`,
          backgroundPosition: `${(region.x / (1 - w)) * 100}% ${(region.y / (1 - h)) * 100}%`,
        }}
        aria-label="Parte del coche"
      />
    );
  }

  const blur = strategy === "blur" ? Math.round((1 - r) * maxBlur) : 0;
  const revealed = Math.round(total * (0.1 + 0.9 * r));

  return (
    <div className={`relative ${frame}`}>
      <img
        src={src}
        alt="Adivina el coche"
        className="w-full block"
        style={blur ? { filter: `blur(${blur}px)`, transform: "scale(1.06)" } : undefined}
      />
      {strategy === "tiles" && (
        <div
          className="absolute inset-0 grid"
          style={{
            gridTemplateColumns: `repeat(${grid}, 1fr)`,
            gridTemplateRows: `repeat(${grid}, 1fr)`,
            perspective: "1000px",
          }}
        >
          {Array.from({ length: total }, (_, i) => {
            const pos = order.indexOf(i);
            const open = gameOver || pos < revealed;
            return (
              <div
                key={i}
                className="bg-background border border-tile-border"
                style={{
                  transition: "transform 0.5s ease, opacity 0.4s ease",
                  transitionDelay: `${pos * 16}ms`,
                  transform: open ? "rotateY(90deg)" : "rotateY(0deg)",
                  opacity: open ? 0 : 1,
                  transformOrigin: "center",
                  backfaceVisibility: "hidden",
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
