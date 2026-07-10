import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center text-center gap-10 py-10">
      <div className="flex flex-col items-center gap-4">
        <div className="text-6xl">🚗</div>
        <h1 className="text-4xl font-extrabold uppercase tracking-[0.12em]">Car Quiz</h1>
        <p className="text-muted max-w-xs">
          Adivina el coche por la foto. Marca, modelo y año, con pistas verdes,
          amarillas y grises.
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link
          href="/daily"
          className="rounded-full bg-foreground text-background py-3.5 font-bold uppercase tracking-wider hover:opacity-90 transition"
        >
          Coche del día
        </Link>
        <Link
          href="/infinite"
          className="rounded-full border-2 border-foreground py-3 font-bold uppercase tracking-wider hover:bg-foreground hover:text-background transition"
        >
          Modo infinito
        </Link>
      </div>
    </div>
  );
}
