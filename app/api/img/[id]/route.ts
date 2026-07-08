// Serves a car photo by its opaque image id, reading the real file from /cars.
// The real filename (which would spoil the answer) never reaches the client.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { getImage } from "@/lib/db";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const found = await getImage(id);
  if (!found) return new Response("Not found", { status: 404 });

  const bytes = await readFile(path.join(process.cwd(), "cars", found.image.file));
  const type = MIME[path.extname(found.image.file).toLowerCase()] ?? "image/jpeg";

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": type,
      // Opaque id is stable per image, so caching is safe and desirable.
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
