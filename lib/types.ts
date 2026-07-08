// Domain types for the car-guessing game.
// This is the single source of truth for the data shape. Today it is backed by
// cars.json; when the backend moves to an API/DB, only lib/db.ts changes.

export type Part =
  | "full"
  | "front" // "morro"
  | "rear"
  | "headlight" // "faro"
  | "taillight"
  | "interior"
  | "wheel"
  | "badge";

export interface CarImage {
  /** Opaque id exposed to the client (used in /api/img/[id]). Never reveals the answer. */
  id: string;
  /** Real filename on disk under /cars. Server-only, never sent to the client. */
  file: string;
  part: Part;
}

export interface Car {
  id: string;
  brand: string;
  model: string;
  gen?: string;
  year: number;
  engine?: string;
  /** EUR | JDM | USDM ... */
  region: string;
  /** Hatchback | Sedan | SUV | Coupe ... */
  bodyType: string;
  images: CarImage[];
}
