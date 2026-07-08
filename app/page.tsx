import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center gap-8 p-8 sm:p-16">
      <h1 className="text-4xl font-bold">Car Quiz</h1>
      <p className="opacity-70">Adivina el coche por la foto.</p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/daily"
          className="rounded-lg bg-foreground text-background px-6 py-3 font-medium text-center"
        >
          Coche del día
        </Link>
        <Link
          href="/infinite"
          className="rounded-lg border border-foreground px-6 py-3 font-medium text-center"
        >
          Modo infinito
        </Link>
      </div>
    </main>
  );
}
