import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getProfile, getStats } from "@/lib/stats";
import UsernameForm from "./UsernameForm";

export const dynamic = "force-dynamic";

// Páginas de usuario: nada que indexar.
export const metadata = { robots: { index: false, follow: false } };

export default async function Perfil() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/perfil");

  const [profile, stats] = await Promise.all([getProfile(user.id), getStats(user.id)]);

  const played = stats?.daily_played ?? 0;
  const won = stats?.daily_won ?? 0;
  const rate = played ? Math.round((won / played) * 100) : 0;

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide">
        {profile?.username ?? "Tu perfil"}
      </h1>

      {!profile?.username && (
        <div className="panel rounded-sm p-4 flex flex-col gap-2">
          <p className="text-sm">
            Ponte un nombre para aparecer en los rankings y que tus amigos te
            encuentren.
          </p>
          <UsernameForm current={null} />
        </div>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-sm uppercase tracking-[0.2em] text-muted">
          Coche del día
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Stat label="Racha" value={stats?.daily_current_streak ?? 0} accent />
          <Stat label="Mejor racha" value={stats?.daily_best_streak ?? 0} />
          <Stat label="Jugados" value={played} />
          <Stat label="Acierto" value={`${rate}%`} />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-sm uppercase tracking-[0.2em] text-muted">
          Infinito
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Racha actual" value={stats?.current_infinite_streak ?? 0} accent />
          <Stat label="Mejor racha" value={stats?.best_infinite_streak ?? 0} />
        </div>
      </section>

      {profile?.username && (
        <div className="panel rounded-sm p-4 flex flex-col gap-2">
          <h2 className="font-display text-sm uppercase tracking-[0.2em] text-muted">
            Cambiar nombre
          </h2>
          <UsernameForm current={profile.username} />
        </div>
      )}

      <div className="flex gap-4 text-sm">
        <Link href="/amigos" className="text-accent hover:underline">
          Amigos →
        </Link>
        <Link href="/ranking" className="text-accent hover:underline">
          Ranking →
        </Link>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div className="panel rounded-sm px-3 py-3">
      <div className="font-display text-[10px] uppercase tracking-[0.2em] text-muted">
        {label}
      </div>
      <div className={`readout text-2xl font-bold ${accent ? "text-accent" : ""}`}>
        {value}
      </div>
    </div>
  );
}
