import Link from "next/link";
import { countCars } from "@/lib/db";

// El contador de coches crece: refrescar cada 5 min en vez de congelarlo en el build.
export const revalidate = 300;

export default async function Home() {
  const total = await countCars();
  return (
    <div className="flex flex-col gap-10 py-6">
      <header className="flex flex-col gap-4">
        <span className="self-start bg-accent text-white font-display text-xs uppercase tracking-[0.2em] px-2.5 py-1">
          Adivina el coche
        </span>
        <h1 className="font-display text-6xl sm:text-7xl font-bold uppercase leading-[0.88] tracking-tight">
          ¿Sabes qué
          <br />
          coche es
          <span className="text-accent">?</span>
        </h1>
        <p className="text-muted max-w-sm">
          Solo tienes la foto. Marca, modelo y año. Un reto diario para todos y un
          modo infinito que aprieta con cada acierto.
        </p>
      </header>

      <div className="flex flex-col gap-3">
        <Link
          href="/daily"
          className="panel group flex items-center justify-between px-5 py-5 hover:border-accent transition-colors"
        >
          <span className="flex flex-col">
            <span className="font-display text-2xl font-bold uppercase tracking-wide">
              Coche del día
            </span>
            <span className="text-sm text-muted">Uno solo. El mismo para todos.</span>
          </span>
          <span className="font-display text-accent text-2xl group-hover:translate-x-1 transition-transform">
            →
          </span>
        </Link>

        <Link
          href="/infinite"
          className="panel group flex items-center justify-between px-5 py-5 hover:border-accent transition-colors"
        >
          <span className="flex flex-col">
            <span className="font-display text-2xl font-bold uppercase tracking-wide">
              Modo infinito
            </span>
            <span className="text-sm text-muted">
              Encadena aciertos. Cuanta más racha, más difícil.
            </span>
          </span>
          <span className="font-display text-accent text-2xl group-hover:translate-x-1 transition-transform">
            →
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="racing-stripe h-1 flex-1 opacity-40" />
        <span className="readout uppercase">{total} coches</span>
        <span className="racing-stripe h-1 flex-1 opacity-40" />
      </div>
    </div>
  );
}
