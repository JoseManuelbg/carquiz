// Data-access layer. Everything that reads car data goes through here.
//
// Provisional implementation: reads cars.json from disk at request time (so
// edits show up without a rebuild, and answers are never bundled into client
// JS). To move to a real API/DB later, reimplement these functions and nothing
// else in the app needs to change.
//
// Server-only: importing this from a Client Component would leak image filenames.

import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Car, CarImage, Part } from "./types";

async function loadCars(): Promise<Car[]> {
  const raw = await readFile(path.join(process.cwd(), "cars.json"), "utf8");
  return JSON.parse(raw) as Car[];
}

export async function getCars(): Promise<Car[]> {
  return loadCars();
}

export async function getCarById(id: string): Promise<Car | undefined> {
  return (await getCars()).find((c) => c.id === id);
}

/** Resolve an opaque image id to its car + image record (server-side only). */
export async function getImage(
  imageId: string
): Promise<{ car: Car; image: CarImage } | undefined> {
  for (const car of await getCars()) {
    const image = car.images.find((i) => i.id === imageId);
    if (image) return { car, image };
  }
  return undefined;
}

/** Cars usable as an answer: they must own a matching image and (optionally)
 *  belong to one of the given regions. Empty/undefined regions = any region. */
export async function answerCandidates(
  part?: Part,
  regions?: string[]
): Promise<Car[]> {
  const cars = await getCars();
  const regionSet = regions && regions.length ? new Set(regions) : null;
  return cars.filter((c) => {
    const hasImage = part ? c.images.some((i) => i.part === part) : c.images.length > 0;
    return hasImage && (!regionSet || regionSet.has(c.region));
  });
}
