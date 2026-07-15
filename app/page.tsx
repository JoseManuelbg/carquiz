import Link from "next/link";
import { countCars } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { SITE_DESC, SITE_NAME, SITE_URL } from "@/lib/site";

// El contador de coches crece: refrescar cada 5 min en vez de congelarlo en el build.
export const revalidate = 300;

export default async function Home() {
  const [total, { t }] = await Promise.all([countCars(), getT()]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Game",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESC,
    inLanguage: "es",
    genre: ["Puzzle", "Trivia"],
    applicationCategory: "GameApplication",
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
  };

  return (
    <div className="flex flex-col gap-10 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="flex flex-col gap-4">
        <h1 className="font-display text-6xl sm:text-7xl font-bold uppercase leading-[0.88]">
          {t("home.title")}
        </h1>
        <p className="text-muted max-w-sm">{t("home.subtitle", { n: total })}</p>
      </header>

      <div className="flex flex-col gap-3">
        <ModeLink href="/daily" title={t("home.daily")} desc={t("home.dailyDesc")} />
        <ModeLink
          href="/infinite"
          title={t("home.infinite")}
          desc={t("home.infiniteDesc")}
        />
      </div>
    </div>
  );
}

function ModeLink({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="panel group flex items-center justify-between px-5 py-5 rounded-sm hover:border-accent transition-colors"
    >
      <span className="flex flex-col gap-0.5">
        <span className="font-display text-2xl font-bold uppercase tracking-wide">
          {title}
        </span>
        <span className="text-sm text-muted">{desc}</span>
      </span>
      <span className="text-accent text-2xl group-hover:translate-x-1 transition-transform">
        →
      </span>
    </Link>
  );
}
