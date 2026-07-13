// Migra cars.json + las fotos de /cars a Supabase (tablas + Storage privado).
//
//   node --env-file=.env.local scripts/seed-supabase.mjs
//
// Idempotente: se puede reejecutar (upsert por id, upsert de ficheros).

import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_PHOTO_BUCKET ?? "car-photos";
if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

const MIME = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };

async function main() {
  const cars = JSON.parse(await readFile(path.join(process.cwd(), "cars.json"), "utf8"));
  console.log(`Migrando ${cars.length} coches…`);

  // 1) Coches
  const carRows = cars.map((c) => ({
    id: c.id,
    brand: c.brand,
    model: c.model,
    gen: c.gen ?? null,
    year: c.year,
    engine: c.engine ?? null,
    region: c.region,
    body_type: c.bodyType,
  }));
  const { error: carErr } = await sb.from("cars").upsert(carRows, { onConflict: "id" });
  if (carErr) throw new Error(`upsert cars: ${carErr.message}`);
  console.log(`✓ ${carRows.length} coches insertados`);

  // 2) Fotos -> Storage privado + filas car_images
  let uploaded = 0;
  const imageRows = [];

  for (const car of cars) {
    for (const img of car.images ?? []) {
      const storagePath = `cars/${img.file}`;
      const bytes = await readFile(path.join(process.cwd(), "cars", img.file));
      const ext = img.file.split(".").pop()?.toLowerCase() ?? "jpg";

      const { error: upErr } = await sb.storage
        .from(BUCKET)
        .upload(storagePath, bytes, {
          contentType: MIME[ext] ?? "image/jpeg",
          upsert: true,
        });
      if (upErr) throw new Error(`upload ${img.file}: ${upErr.message}`);
      uploaded++;

      imageRows.push({
        id: img.id,
        car_id: car.id,
        storage_path: storagePath,
        part: img.part ?? "full",
        region_box: img.region ?? null,
        credit: img.credit ?? null,
      });
      if (uploaded % 10 === 0) console.log(`  ${uploaded} fotos subidas…`);
    }
  }

  const { error: imgErr } = await sb
    .from("car_images")
    .upsert(imageRows, { onConflict: "id" });
  if (imgErr) throw new Error(`upsert car_images: ${imgErr.message}`);

  console.log(`✓ ${uploaded} fotos en el bucket "${BUCKET}" (privado)`);
  console.log(`✓ ${imageRows.length} filas en car_images`);

  const { count } = await sb.from("cars").select("*", { count: "exact", head: true });
  console.log(`\nListo. Coches en BBDD: ${count}`);
}

main().catch((e) => {
  console.error("\n✗", e.message);
  process.exit(1);
});
