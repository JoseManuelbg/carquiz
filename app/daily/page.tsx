import Game from "@/app/ui/Game";

export default function DailyPage() {
  return (
    <div className="flex flex-col items-center gap-6">
      <h1 className="self-start font-display text-3xl font-bold uppercase tracking-wide">
        Coche del día
      </h1>
      <Game query="mode=daily" daily />
    </div>
  );
}
