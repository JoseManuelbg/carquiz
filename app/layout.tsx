import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Car Quiz",
  description: "Adivina el coche por la foto.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-tile-border">
          <div className="mx-auto max-w-xl w-full flex items-center justify-between px-4 h-14">
            <div className="w-24 flex gap-3 text-xs uppercase tracking-wider text-muted">
              <Link href="/daily" className="hover:text-foreground">
                Diario
              </Link>
              <Link href="/infinite" className="hover:text-foreground">
                Infinito
              </Link>
            </div>
            <Link
              href="/"
              className="text-2xl font-extrabold uppercase tracking-[0.15em]"
            >
              Car Quiz
            </Link>
            <div className="w-24" />
          </div>
        </header>
        <main className="mx-auto max-w-xl w-full flex-1 px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
