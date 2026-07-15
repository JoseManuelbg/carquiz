import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import LanguageSwitcher from "./LanguageSwitcher";

const KOFI = process.env.NEXT_PUBLIC_KOFI_USERNAME;

export default async function Footer() {
  const { t } = await getT();
  return (
    <footer className="border-t border-line mt-8">
      <div className="mx-auto max-w-xl w-full flex flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-muted">
        <div className="flex items-center gap-3">
          <span>Car Quiz</span>
          <span className="opacity-40">·</span>
          <Link href="/ranking" className="hover:text-foreground transition-colors">
            {t("nav.ranking")}
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {KOFI && (
            <a
              href={`https://ko-fi.com/${KOFI}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-sm border border-line bg-surface px-3 py-1.5 font-display uppercase tracking-wide text-foreground hover:border-accent hover:text-accent transition-colors"
            >
              <span aria-hidden>☕</span> {t("footer.donate")}
            </a>
          )}
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  );
}
