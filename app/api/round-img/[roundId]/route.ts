// Sirve la foto de una ronda YA TAPADA por el servidor (desenfoque / tiles en
// negro / recorte), según el estado de esa ronda. El navegador nunca recibe la
// imagen limpia mientras la partida esté en juego: no hay forma de sacarla con
// zoom, pulsación larga ni herramientas.
//
// Clave anti-trampa: el id real de la imagen NUNCA se expone; el cliente solo
// conoce el id de la RONDA, y sin él (o con la ronda no terminada) no hay foto
// limpia posible.

import sharp from "sharp";
import { getCarById } from "@/lib/db";
import { getMode } from "@/lib/modes";
import { getRound } from "@/lib/rounds";
import { supabaseAdmin, PHOTO_BUCKET } from "@/lib/supabase";
import { revealPlan, OVERLAY_COLOR } from "@/lib/reveal";

const MAX_W = 1100;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ roundId: string }> }
) {
  const { roundId } = await params;
  const round = await getRound(roundId);
  if (!round) return new Response("Not found", { status: 404 });

  const [car, mode] = await Promise.all([getCarById(round.carId), getMode(round.modeId)]);
  if (!car || !mode) return new Response("Not found", { status: 404 });

  const image =
    car.images.find((i) => !mode.part || i.part === mode.part) ?? car.images[0];
  if (!image) return new Response("Not found", { status: 404 });

  const dl = await supabaseAdmin().storage.from(PHOTO_BUCKET).download(image.storagePath);
  if (dl.error || !dl.data) return new Response("Not found", { status: 404 });
  const input = Buffer.from(await dl.data.arrayBuffer());

  const gameOver = round.solved || round.attempts >= round.maxAttempts;
  const plan = revealPlan(
    mode.reveal ?? "none",
    round.attempts,
    round.maxAttempts,
    round.intensity,
    gameOver
  );

  // Materializamos ya el redimensionado: metadata() sobre el pipeline daría el
  // tamaño ORIGINAL, no el de después del resize (y la capa de tiles no encajaría).
  const resized = await sharp(input)
    .rotate()
    .resize({ width: MAX_W, withoutEnlargement: true })
    .toBuffer({ resolveWithObject: true });
  const w = resized.info.width;
  const h = resized.info.height;
  let img = sharp(resized.data);

  if (plan.kind === "blur") {
    img = img.blur(plan.sigma);
  } else if (plan.kind === "region" && image.region) {
    const r = image.region;
    const left = Math.round(Math.max(0, Math.min(1, r.x)) * w);
    const top = Math.round(Math.max(0, Math.min(1, r.y)) * h);
    const cw = Math.max(1, Math.min(w - left, Math.round(r.w * w)));
    const ch = Math.max(1, Math.min(h - top, Math.round(r.h * h)));
    img = img.extract({ left, top, width: cw, height: ch });
  } else if (plan.kind === "tiles") {
    const g = plan.grid;
    const rects = plan.hidden
      .map((idx) => {
        const cx = (idx % g) * (w / g);
        const cy = Math.floor(idx / g) * (h / g);
        return `<rect x="${cx.toFixed(2)}" y="${cy.toFixed(2)}" width="${(w / g).toFixed(
          2
        )}" height="${(h / g).toFixed(2)}" fill="${OVERLAY_COLOR}" />`;
      })
      .join("");
    const overlay = Buffer.from(
      `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`
    );
    img = img.composite([{ input: overlay, top: 0, left: 0 }]);
  }

  const out = await img.jpeg({ quality: 82 }).toBuffer();

  return new Response(new Uint8Array(out), {
    headers: {
      "Content-Type": "image/jpeg",
      // Nunca cachear estados intermedios: parte del blindaje.
      "Cache-Control": "private, no-store",
    },
  });
}
