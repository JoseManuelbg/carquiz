import type { Metadata } from "next";
import Game from "@/app/ui/Game";

export const metadata: Metadata = {
  title: "Coche del día",
  description:
    "El reto diario de Car Quiz: adivina marca, modelo y año de un coche por su foto. Un coche nuevo cada día, el mismo para todo el mundo.",
  alternates: { canonical: "/daily" },
};

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
