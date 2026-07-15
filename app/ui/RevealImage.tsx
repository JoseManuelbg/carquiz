"use client";

// Muestra la foto que llega del servidor (ya tapada si toca). Aquí NO se tapa
// nada: la imagen ya viene desenfocada / con casillas en negro / recortada.
//
// Blindaje ligero (encima del tapado del servidor): bloquea menú contextual,
// arrastrar, seleccionar y la "pulsación larga → guardar/mirar imagen" de móvil.
// Al cambiar la foto (más destapada) hace un fundido suave.

import { useState } from "react";

const noSave = {
  WebkitTouchCallout: "none",
  WebkitUserSelect: "none",
  userSelect: "none",
} as const;

export default function RevealImage({ src }: { src: string }) {
  const [base, setBase] = useState(src);
  const [prevSrc, setPrevSrc] = useState(src);
  const [next, setNext] = useState<string | null>(null);
  const [fade, setFade] = useState(false);

  // Patrón permitido de "ajustar estado al cambiar una prop" (sin efecto): si
  // llega una foto nueva, se prepara la capa de fundido.
  if (src !== prevSrc) {
    setPrevSrc(src);
    if (src !== base) setNext(src);
  }

  return (
    <div
      className="panel w-full rounded-sm overflow-hidden relative select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      <img
        src={base}
        alt="Adivina el coche"
        draggable={false}
        style={noSave}
        className="w-full block pointer-events-none"
      />
      {next && (
        <img
          src={next}
          alt=""
          draggable={false}
          style={{ ...noSave, opacity: fade ? 1 : 0, transition: "opacity 350ms ease" }}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          onLoad={() => {
            requestAnimationFrame(() => setFade(true));
            setTimeout(() => {
              setBase(next);
              setNext(null);
              setFade(false);
            }, 400);
          }}
        />
      )}
    </div>
  );
}
