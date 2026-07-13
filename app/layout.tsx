import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono, Oswald } from "next/font/google";
import Link from "next/link";
import UserNav from "./ui/UserNav";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
// Condensada y con actitud: titulares y marcador.
const oswald = Oswald({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Car Quiz — Adivina el coche",
  description:
    "Adivina el coche por la foto. Un reto diario y un modo infinito que aprieta con cada acierto.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${oswald.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-line bg-surface/70 backdrop-blur">
          <div className="mx-auto max-w-xl w-full flex items-center justify-between px-4 h-16">
            <Link href="/" className="flex items-center gap-2.5 group">
              <span className="checker h-7 w-7 rounded-sm shrink-0" />
              <span className="font-display text-2xl font-bold uppercase tracking-wide leading-none">
                Car<span className="text-accent">Quiz</span>
              </span>
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/daily" className="text-muted hover:text-foreground transition-colors">
                Diario
              </Link>
              <Link href="/infinite" className="text-muted hover:text-foreground transition-colors">
                Infinito
              </Link>
              <Link href="/ranking" className="text-muted hover:text-foreground transition-colors">
                Ranking
              </Link>
              <Suspense fallback={null}>
                <UserNav />
              </Suspense>
            </nav>
          </div>
          <div className="racing-stripe h-1" />
        </header>
        <main className="mx-auto max-w-xl w-full flex-1 px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
