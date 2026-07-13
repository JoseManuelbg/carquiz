// Data-access layer — now backed by Postgres (Supabase).
//
// Keeps the exact same interface it had when this read cars.json, so nothing
// above it changed. Server-only.

import { supabaseAdmin } from "./supabase";
import { dailyIndex } from "./daily";
import type { Car, CarImage, Credit, Part, Region } from "./types";

interface ImageRow {
  id: string;
  storage_path: string;
  part: Part;
  region_box: Region | null;
  credit: Credit | null;
}

interface CarRow {
  id: string;
  brand: string;
  model: string;
  gen: string | null;
  year: number;
  engine: string | null;
  region: string;
  body_type: string;
  car_images: ImageRow[] | null;
}

const SELECT = "id,brand,model,gen,year,engine,region,body_type,car_images(*)";

function toCar(row: CarRow): Car {
  return {
    id: row.id,
    brand: row.brand,
    model: row.model,
    gen: row.gen ?? undefined,
    year: row.year,
    engine: row.engine ?? undefined,
    region: row.region,
    bodyType: row.body_type,
    images: (row.car_images ?? []).map(
      (i): CarImage => ({
        id: i.id,
        storagePath: i.storage_path,
        part: i.part,
        region: i.region_box ?? undefined,
        credit: i.credit ?? undefined,
      })
    ),
  };
}

export async function getCars(): Promise<Car[]> {
  const { data, error } = await supabaseAdmin().from("cars").select(SELECT);
  if (error) throw new Error(`getCars: ${error.message}`);
  return (data as unknown as CarRow[]).map(toCar);
}

/** Cuántos coches jugables hay (para mostrarlo en la home). */
export async function countCars(): Promise<number> {
  const { count, error } = await supabaseAdmin()
    .from("cars")
    .select("id", { count: "exact", head: true });
  if (error) return 0;
  return count ?? 0;
}

export async function getCarById(id: string): Promise<Car | undefined> {
  const { data, error } = await supabaseAdmin()
    .from("cars")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getCarById: ${error.message}`);
  return data ? toCar(data as unknown as CarRow) : undefined;
}

/** Resolve an opaque image id to its car + image (server-side only). */
export async function getImage(
  imageId: string
): Promise<{ car: Car; image: CarImage } | undefined> {
  const { data, error } = await supabaseAdmin()
    .from("car_images")
    .select("id,cars(*)")
    .eq("id", imageId)
    .maybeSingle();
  if (error) throw new Error(`getImage: ${error.message}`);
  if (!data) return undefined;

  // Fetch the full car (with all its images) so we can return the image record.
  const car = await getCarById((data as unknown as { cars: { id: string } }).cars.id);
  const image = car?.images.find((i) => i.id === imageId);
  return car && image ? { car, image } : undefined;
}

/** Cars usable as an answer: must own a matching image and (optionally) a region. */
export async function answerCandidates(
  part?: Part,
  regions?: string[]
): Promise<Car[]> {
  let q = supabaseAdmin().from("cars").select(SELECT);
  if (regions && regions.length) q = q.in("region", regions);

  const { data, error } = await q;
  if (error) throw new Error(`answerCandidates: ${error.message}`);

  return (data as unknown as CarRow[])
    .map(toCar)
    .filter((c) =>
      part ? c.images.some((i) => i.part === part) : c.images.length > 0
    );
}

/**
 * The car for a given day. Uses a fixed schedule table so that past days never
 * change when the pool grows. Auto-fills a day the first time it's requested,
 * preferring cars that haven't been used yet.
 */
export async function getDailyCar(day: string, part?: Part): Promise<Car | undefined> {
  const sb = supabaseAdmin();

  const existing = await sb
    .from("daily_puzzles")
    .select("car_id")
    .eq("day", day)
    .maybeSingle();
  if (existing.error) throw new Error(`getDailyCar: ${existing.error.message}`);
  if (existing.data) return getCarById(existing.data.car_id as string);

  const candidates = await answerCandidates(part);
  if (candidates.length === 0) return undefined;

  const used = await sb.from("daily_puzzles").select("car_id");
  if (used.error) throw new Error(`getDailyCar: ${used.error.message}`);
  const usedIds = new Set((used.data ?? []).map((r) => r.car_id as string));

  // Don't repeat until the pool is exhausted.
  let pool = candidates.filter((c) => !usedIds.has(c.id));
  if (pool.length === 0) pool = candidates;
  pool.sort((a, b) => a.id.localeCompare(b.id)); // stable order

  // Deterministic pick: concurrent requests for the same day choose the same car.
  const pick = pool[dailyIndex(day, pool.length)];

  const ins = await sb
    .from("daily_puzzles")
    .upsert({ day, car_id: pick.id }, { onConflict: "day", ignoreDuplicates: true });
  if (ins.error) throw new Error(`getDailyCar: ${ins.error.message}`);

  // Re-read: another request may have won the race.
  const settled = await sb
    .from("daily_puzzles")
    .select("car_id")
    .eq("day", day)
    .maybeSingle();
  const carId = (settled.data?.car_id as string) ?? pick.id;
  return getCarById(carId);
}
