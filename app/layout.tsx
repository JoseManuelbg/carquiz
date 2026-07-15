import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono, Oswald } from "next/font/google";
import Link from "next/link";
import UserNav from "./ui/UserNav";
import Footer from "./ui/Footer";
import { I18nProvider } from "./ui/I18nProvider";
import { getT } from "@/lib/i18n/server";
import { SITE_DESC, SITE_NAME, SITE_URL } from "@/lib/site";
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
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Autodle — Adivina el coche por la foto",
    // Las demás páginas quedan como "Coche del día · Autodle".
    template: "%s · Autodle",
  },
  description: SITE_DESC,
  applicationName: SITE_NAME,
  keywords: [
    "autodle",
    "adivinar coches",
    "juego de coches",
    "wordle de coches",
    "quiz de coches",
    "adivina el coche",
    "coche del día",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Autodle — Adivina el coche por la foto",
    description: SITE_DESC,
  },
  twitter: {
    card: "summary_large_image",
    title: "Autodle — Adivina el coche por la foto",
    description: SITE_DESC,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { locale, t } = await getT();
  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} ${oswald.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <I18nProvider locale={locale}>
          <header className="border-b border-line bg-surface/70 backdrop-blur">
            <div className="mx-auto max-w-xl w-full flex items-center justify-between px-4 h-16">
              <Link href="/" className="flex items-center gap-2.5 group">
                <span className="checker h-7 w-7 rounded-sm shrink-0" />
                <span className="font-display text-2xl font-bold uppercase tracking-wide leading-none">
                  Auto<span className="text-accent">dle</span>
                </span>
              </Link>
              <nav className="flex items-center gap-4 text-sm">
                <Link href="/daily" className="text-muted hover:text-foreground transition-colors">
                  {t("nav.daily")}
                </Link>
                <Link href="/infinite" className="text-muted hover:text-foreground transition-colors">
                  {t("nav.infinite")}
                </Link>
                <Link href="/ranking" className="text-muted hover:text-foreground transition-colors">
                  {t("nav.ranking")}
                </Link>
                <Suspense fallback={null}>
                  <UserNav />
                </Suspense>
              </nav>
            </div>
            <div className="racing-stripe h-1" />
          </header>
          <main className="mx-auto max-w-xl w-full flex-1 px-4 py-8">{children}</main>
          <Footer />
        </I18nProvider>
      </body>
    </html>
  );
}
