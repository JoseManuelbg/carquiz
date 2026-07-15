// Marcas / carrocerías / décadas disponibles, para el menú del modo infinito.
import { getFacets } from "@/lib/db";

export async function GET() {
  return Response.json(await getFacets());
}
