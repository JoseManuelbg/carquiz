// Serves a car photo by its opaque image id, streaming it from the PRIVATE
// Supabase Storage bucket. The client never sees the storage path or filename,
// which would spoil the answer.

import { getImage } from "@/lib/db";
import { supabaseAdmin, PHOTO_BUCKET } from "@/lib/supabase";
import { getCurrentUser, isAdminEmail } from "@/lib/auth";

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // El juego sirve las fotos por ronda (/api/round-img) ya tapadas. Este
  // endpoint devuelve la foto LIMPIA por id real, así que es solo para el panel:
  // se restringe a administradores para no abrir una vía de trampa.
  const user = await getCurrentUser();
  if (!user || !(await isAdminEmail(user.email))) {
    return new Response("Not found", { status: 404 });
  }

  const { id } = await params;
  const found = await getImage(id);
  if (!found) return new Response("Not found", { status: 404 });

  const { data, error } = await supabaseAdmin()
    .storage.from(PHOTO_BUCKET)
    .download(found.image.storagePath);
  if (error || !data) return new Response("Not found", { status: 404 });

  const ext = found.image.storagePath.split(".").pop()?.toLowerCase() ?? "jpg";
  const bytes = new Uint8Array(await data.arrayBuffer());

  return new Response(bytes, {
    headers: {
      "Content-Type": data.type || MIME[ext] || "image/jpeg",
      // Opaque id is stable per image, so caching is safe.
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
