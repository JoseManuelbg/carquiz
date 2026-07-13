"use client";

// Dibuja una caja sobre la foto para marcar el faro (o el morro).
// Las coordenadas se guardan normalizadas 0..1, así valen para cualquier tamaño.

import { useRef, useState } from "react";
import { savePartBox } from "../actions";
import type { Region } from "@/lib/types";

interface Props {
  carId: string;
  imageId: string;
  part: "headlight" | "front";
  initial?: Region;
}

export default function BoxAnnotator({ carId, imageId, part, initial }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<Region | null>(initial ?? null);
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const label = part === "headlight" ? "faro" : "morro";

  function pos(e: React.MouseEvent) {
    const r = ref.current!.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
      y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
    };
  }

  function onDown(e: React.MouseEvent) {
    const p = pos(e);
    setDrag(p);
    setBox({ x: p.x, y: p.y, w: 0, h: 0 });
  }

  function onMove(e: React.MouseEvent) {
    if (!drag) return;
    const p = pos(e);
    setBox({
      x: Math.min(drag.x, p.x),
      y: Math.min(drag.y, p.y),
      w: Math.abs(p.x - drag.x),
      h: Math.abs(p.y - drag.y),
    });
  }

  async function save() {
    if (!box || box.w < 0.02 || box.h < 0.02) {
      return setMsg("Dibuja una caja más grande.");
    }
    setBusy(true);
    setMsg(null);
    const fd = new FormData();
    fd.set("carId", carId);
    fd.set("sourceImageId", imageId);
    fd.set("part", part);
    fd.set("x", String(box.x));
    fd.set("y", String(box.y));
    fd.set("w", String(box.w));
    fd.set("h", String(box.h));
    const res = await savePartBox(fd);
    setBusy(false);
    setMsg(res?.error ? res.error : `Guardado: ${label} marcado ✓`);
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted">
        Arrastra sobre la foto para encuadrar el <strong>{label}</strong>.
      </p>
      <div
        ref={ref}
        onMouseDown={onDown}
        onMouseMove={onMove}
        onMouseUp={() => setDrag(null)}
        onMouseLeave={() => setDrag(null)}
        className="relative select-none cursor-crosshair rounded-sm overflow-hidden border border-line"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/img/${imageId}`}
          alt=""
          draggable={false}
          className="w-full block pointer-events-none"
        />
        {box && (
          <div
            className="absolute border-2 border-accent bg-accent/20 pointer-events-none"
            style={{
              left: `${box.x * 100}%`,
              top: `${box.y * 100}%`,
              width: `${box.w * 100}%`,
              height: `${box.h * 100}%`,
            }}
          />
        )}
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={busy}
          className="rounded-sm bg-accent text-white px-4 py-2 font-display text-sm font-bold uppercase tracking-widest hover:brightness-110 disabled:opacity-50"
        >
          Guardar {label}
        </button>
        {msg && <span className="text-xs text-muted">{msg}</span>}
      </div>
    </div>
  );
}
