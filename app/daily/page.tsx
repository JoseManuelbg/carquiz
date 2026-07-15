import type { Metadata } from "next";
import Game from "@/app/ui/Game";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Coche del día",
  description:
    "El reto diario de Car Quiz: adivina marca, modelo y año de un coche por su foto. Un coche nuevo cada día, el mismo para todo el mundo.",
  alternates: { canonical: "/daily" },
};

export default async function DailyPage() {
  const { t } = await getT();
  return (
    <div className="flex flex-col items-center gap-6">
      <h1 className="self-start font-display text-3xl font-bold uppercase tracking-wide">
        {t("home.daily")}
      </h1>
      <Game query="mode=daily" daily />
    </div>
  );
}
