// Cuántas personas han adivinado el coche del día de hoy.
import { getDailySolved } from "@/lib/stats";
import { todayKey } from "@/lib/daily";

export async function GET() {
  return Response.json({ solved: await getDailySolved(todayKey()) });
}
