"use client";

// Banner de anuncios (AdSense). Discreto y opcional:
//  - Si NEXT_PUBLIC_ADSENSE_CLIENT no está puesto, NO renderiza nada (ni hueco).
//  - Nunca va sobre la foto: eso estropearía el juego (y AdSense penaliza los
//    anuncios que interfieren con el contenido).

import { useEffect } from "react";

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export default function AdSlot({ slot }: { slot?: string }) {
  const enabled = Boolean(CLIENT && slot);

  useEffect(() => {
    if (!enabled) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* el bloqueador de anuncios lo impide: da igual */
    }
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="mx-auto max-w-xl w-full px-4 py-3">
      <ins
        className="adsbygoogle block"
        style={{ display: "block" }}
        data-ad-client={CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
