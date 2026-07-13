import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { friendIds, topDaily, topInfinite, type RankRow } from "@/lib/stats";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ranking",
  description:
    "Las mejores rachas de Car Quiz: modo infinito y coche del día. Compite en global o solo contra tus amigos.",
  alternates: { canonical: "/ranking" },
};

export default async function Ranking({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const { scope } = await searchParams;
  const user = await getCurrentUser();
  const friendsScope = scope === "amigos" && Boolean(user);

  // El ranking privado incluye a tus amigos y a ti.
  const ids = friendsScope && user ? [...(await friendIds(user.id)), user.id] : undefined;

  const [infinite, daily] = await Promise.all([
    topInfinite(20, ids),
    topDaily(20, ids),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide">Ranking</h1>

      {user && (
        <div className="flex gap-2">
          <Tab href="/ranking" active={!friendsScope}>
            Global
          </Tab>
          <Tab href="/ranking?scope=amigos" active={friendsScope}>
            Amigos
          </Tab>
        </div>
      )}

      <Board
        title="Mejor racha · Infinito"
        rows={infinite}
        me={user?.id}
        empty={
          friendsScope
            ? "Ni tú ni tus amigos habéis encadenado aciertos todavía."
            : "Nadie ha encadenado aciertos todavía."
        }
      />

      <Board
        title="Mejor racha · Coche del día"
        rows={daily}
        me={user?.id}
        empty="Aún no hay rachas diarias."
      />

      {!user && (
        <p className="text-sm text-muted">
          <Link href="/login?next=/ranking" className="text-accent hover:underline">
            Entra
          </Link>{" "}
          para que tus partidas cuenten y competir con amigos.
        </p>
      )}
    </div>
  );
}

function Board({
  title,
  rows,
  me,
  empty,
}: {
  title: string;
  rows: RankRow[];
  me?: string;
  empty: string;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-sm uppercase tracking-[0.2em] text-muted">
        {title}
      </h2>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        <ol className="flex flex-col gap-1">
          {rows.map((r, i) => (
            <li
              key={r.userId}
              className={`panel rounded-sm flex items-center gap-3 px-3 py-2 ${
                r.userId === me ? "border-accent" : ""
              }`}
            >
              <span className="readout w-8 text-muted">{i + 1}</span>
              <span className="flex-1 truncate">
                {r.username}
                {r.userId === me && <span className="text-accent"> · tú</span>}
                {r.extra && (
                  <span className="block text-xs text-muted">{r.extra}</span>
                )}
              </span>
              <span className="readout text-xl font-bold">{r.value}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function Tab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-sm border px-3 py-1.5 text-sm ${
        active
          ? "border-accent bg-accent text-white"
          : "border-line bg-surface text-muted hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}
