// Type-ahead suggestions for the daily mode's car field, served from the big
// reference catalog. GET /api/suggest?q=gol -> { items: ["Volkswagen Golf", ...] }

import { searchCars } from "@/lib/reference";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  const items = q.trim().length >= 2 ? await searchCars(q, 20) : [];
  return Response.json({ items });
}
