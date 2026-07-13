import Link from "next/link";
import { countCars } from "@/lib/db";

// El contador de coches crece: refrescar cada 5 min en vez de congelarlo en el build.
export const revalidate = 300;

export default async function Home() {
  const total = await countCars();

  return (
    <div className="flex flex-col gap-10 py-8">
      <header className="flex flex-col gap-4">
        <h1 className="font-display text-6xl sm:text-7xl font-bold uppercase leading-[0.88]">
          ¿Sabes qué
          <br />
          coche es
          <span className="text-accent">?</span>
        </h1>
        <p className="text-muted max-w-sm">
          Solo tienes la foto. {total} coches, de un Focus a un Countach.
        </p>
      </header>

      <div className="flex flex-col gap-3">
        <ModeLink
          href="/daily"
          title="Coche del día"
          desc="Uno solo, el mismo para todos."
        />
        <ModeLink
          href="/infinite"
          title="Modo infinito"
          desc="Encadena aciertos. Cuanta más racha, más difícil."
        />
      </div>
    </div>
  );
}

function ModeLink({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="panel group flex items-center justify-between px-5 py-5 rounded-sm hover:border-accent transition-colors"
    >
      <span className="flex flex-col gap-0.5">
        <span className="font-display text-2xl font-bold uppercase tracking-wide">
          {title}
        </span>
        <span className="text-sm text-muted">{desc}</span>
      </span>
      <span className="text-accent text-2xl group-hover:translate-x-1 transition-transform">
        →
      </span>
    </Link>
  );
}
