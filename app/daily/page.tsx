import Game from "@/app/ui/Game";

export default function DailyPage() {
  return (
    <div className="flex flex-col items-center gap-6">
      <header className="w-full flex items-center gap-3">
        <span className="racing-stripe h-1 w-8" />
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide">
          Coche del día
        </h1>
        <span className="racing-stripe h-1 flex-1 opacity-40" />
      </header>
      <p className="self-start -mt-4 text-sm text-muted">
        Marca, modelo y año · 6 intentos · el mismo para todos
      </p>
      <Game query="mode=daily" daily />
    </div>
  );
}
