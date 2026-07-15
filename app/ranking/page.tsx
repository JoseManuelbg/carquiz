import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { friendIds, topDaily, topInfinite, type RankRow } from "@/lib/stats";
import { DIFFICULTIES } from "@/lib/difficulty";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ranking",
  description:
    "Las mejores rachas de Autodle: modo infinito por dificultad y coche del día. Compite en global o solo contra tus amigos.",
  alternates: { canonical: "/ranking" },
};

export default async function Ranking({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const { scope } = await searchParams;
  const { t } = await getT();
  const user = await getCurrentUser();
  const friendsScope = scope === "amigos" && Boolean(user);

  // El ranking privado incluye a tus amigos y a ti.
  const ids = friendsScope && user ? [...(await friendIds(user.id)), user.id] : undefined;

  // Una tabla de infinito por dificultad + la del coche del día.
  const [infiniteByDiff, daily] = await Promise.all([
    Promise.all(DIFFICULTIES.map((d) => topInfinite(d.id, 20, ids))),
    topDaily(20, ids),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide">
        {t("nav.ranking")}
      </h1>

      {user && (
        <div className="flex gap-2">
          <Tab href="/ranking" active={!friendsScope}>
            {t("rank.global")}
          </Tab>
          <Tab href="/ranking?scope=amigos" active={friendsScope}>
            {t("rank.friends")}
          </Tab>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <h2 className="font-display text-sm uppercase tracking-[0.2em] text-muted">
          {t("home.infinite")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {DIFFICULTIES.map((d, i) => (
            <Board
              key={d.id}
              title={t(`diff.${d.id}`)}
              rows={infiniteByDiff[i]}
              me={user?.id}
              empty="—"
            />
          ))}
        </div>
      </div>

      <Board
        title={t("home.daily")}
        rows={daily}
        me={user?.id}
        empty="—"
      />

      {!user && (
        <p className="text-sm text-muted">
          <Link href="/login?next=/ranking" className="text-accent hover:underline">
            {t("nav.login")}
          </Link>{" "}
          {t("rank.loginPrompt")}
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
