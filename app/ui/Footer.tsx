import Link from "next/link";

// El botón de Ko-fi solo aparece si has puesto tu usuario en la variable
// NEXT_PUBLIC_KOFI_USERNAME. Así no enlaza a una página que no existe.
const KOFI = process.env.NEXT_PUBLIC_KOFI_USERNAME;

export default function Footer() {
  return (
    <footer className="border-t border-line mt-8">
      <div className="mx-auto max-w-xl w-full flex flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-muted">
        <div className="flex items-center gap-3">
          <span>Car Quiz</span>
          <span className="opacity-40">·</span>
          <Link href="/ranking" className="hover:text-foreground transition-colors">
            Ranking
          </Link>
        </div>

        {KOFI && (
          <a
            href={`https://ko-fi.com/${KOFI}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-sm border border-line bg-surface px-3 py-1.5 font-display uppercase tracking-wide text-foreground hover:border-accent hover:text-accent transition-colors"
          >
            <span aria-hidden>☕</span> Invítame a un café
          </a>
        )}
      </div>
    </footer>
  );
}
