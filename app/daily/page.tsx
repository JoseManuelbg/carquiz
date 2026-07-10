import Game from "@/app/ui/Game";

export default function DailyPage() {
  return (
    <div className="flex flex-col items-center gap-6">
      <header className="text-center">
        <h1 className="text-2xl font-extrabold uppercase tracking-wider">Coche del día</h1>
        <p className="text-sm text-muted mt-1">Marca, modelo y año · 6 intentos</p>
      </header>
      <Game query="mode=daily" daily />
    </div>
  );
}
