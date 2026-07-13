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

/** Normalized bounding box (0..1) used to crop a part out of the full photo. */
export interface Region {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** How the photo is revealed to the player. See app/ui/RevealImage.tsx. */
export type RevealStrategy = "none" | "blur" | "tiles" | "region";

/** Photo attribution (required for Creative Commons / Wikimedia images). */
export interface Credit {
  artist?: string;
  license?: string;
  source?: string;
}

export interface CarImage {
  /** Opaque id exposed to the client (used in /api/img/[id]). Never reveals the answer. */
  id: string;
  /** Path inside the private Supabase Storage bucket. Server-only — never sent to the client. */
  storagePath: string;
  part: Part;
  /** Optional crop rectangle, e.g. the headlight, used by the "region" reveal. */
  region?: Region;
  /** Where the photo came from (for attribution). */
  credit?: Credit;
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
