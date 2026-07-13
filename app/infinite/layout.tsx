import type { Metadata } from "next";

// La página de infinito es un Client Component, y desde ahí no se puede exportar
// metadata: por eso va en este layout.
export const metadata: Metadata = {
  title: "Modo infinito",
  description:
    "Encadena aciertos adivinando coches por su foto. Elige modos, regiones y dificultad: cuanta más racha, más difícil se pone.",
  alternates: { canonical: "/infinite" },
};

export default function InfiniteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
