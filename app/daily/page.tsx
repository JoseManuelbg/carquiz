import Link from "next/link";
import Game from "@/app/ui/Game";

export default function DailyPage() {
  return (
    <main className="flex flex-col items-center gap-6 p-6 sm:p-12">
      <Link href="/" className="self-start text-sm opacity-60 hover:opacity-100">
        ← Inicio
      </Link>
      <h1 className="text-2xl font-bold">Coche del día</h1>
      <Game modeId="daily" daily />
    </main>
  );
}
