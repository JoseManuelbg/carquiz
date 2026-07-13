import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { getCars } from "@/lib/db";

export const dynamic = "force-dynamic";

interface ResultRow {
  kind: string;
  mode_id: string | null;
  difficulty: string | null;
  solved: boolean;
  attempts: number;
  user_id: string;
  created_at: string;
}

export default async function AdminStats() {
  const sb = supabaseAdmin();

  const [{ data: results }, { count: users }, cars] = await Promise.all([
    sb.from("game_results").select("*").limit(5000),
    sb.from("profiles").select("id", { count: "exact", head: true }),
    getCars(),
  ]);

  const rows = (results ?? []) as ResultRow[];
  const daily = rows.filter((r) => r.kind === "daily");
  const infinite = rows.filter((r) => r.kind === "infinite");

  const rate = (xs: ResultRow[]) =>
    xs.length ? Math.round((xs.filter((x) => x.solved).length / xs.length) * 100) : 0;

  // Cuántos usuarios distintos han jugado en los últimos 7 días.
  // La regla avisa de que Date.now() es impura en render; aquí es correcto:
  // esta página es force-dynamic (se renderiza entera en cada petición), así que
  // no hay resultado "congelado" ni re-render inesperado.
  // eslint-disable-next-line react-hooks/purity
  const weekAgo = Date.now() - 7 * 864e5;
  const activos = new Set(
    rows.filter((r) => new Date(r.created_at).getTime() > weekAgo).map((r) => r.user_id)
  ).size;

  // Reparto por modo y por dificultad (solo infinito, que es donde se elige).
  const byMode = tally(infinite.map((r) => r.mode_id ?? "?"));
  const byDiff = tally(infinite.map((r) => r.difficulty ?? "?"));

  const pendientes = cars.filter((c) => !c.reviewed).length;
  const sinFoto = cars.filter((c) => c.images.length === 0).length;
  const conFaro = cars.filter((c) => c.images.some((i) => i.part === "headlight")).length;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <h2 className="font-display text-2xl font-bold uppercase">Datos</h2>
        <Link href="/admin" className="text-xs text-muted hover:text-accent">
          ← coches
        </Link>
      </div>

      <Section title="Gente">
        <Stat label="Registrados" value={users ?? 0} />
        <Stat label="Activos (7d)" value={activos} accent />
        <Stat label="Partidas" value={rows.length} />
      </Section>

      <Section title="Dificultad real">
        <Stat label="Aciertos diario" value={`${rate(daily)}%`} />
        <Stat label="Aciertos infinito" value={`${rate(infinite)}%`} />
        <Stat
          label="Intentos medios"
          value={
            rows.length
              ? (rows.reduce((a, r) => a + r.attempts, 0) / rows.length).toFixed(1)
              : "0"
          }
        />
      </Section>

      <Section title="Catálogo">
        <Stat label="Coches" value={cars.length} />
        <Stat label="Sin revisar" value={pendientes} accent={pendientes > 0} />
        <Stat label="Sin foto" value={sinFoto} accent={sinFoto > 0} />
        <Stat label="Con faro" value={conFaro} />
      </Section>

      <div className="grid sm:grid-cols-2 gap-6">
        <Breakdown title="Modos más jugados" items={byMode} />
        <Breakdown title="Dificultad elegida" items={byDiff} />
      </div>

      {rows.length === 0 && (
        <p className="text-sm text-muted">
          Todavía no hay partidas registradas. Solo cuentan las de usuarios con sesión.
        </p>
      )}
    </div>
  );
}

function tally(xs: string[]): [string, number][] {
  const m = new Map<string, number>();
  for (const x of xs) m.set(x, (m.get(x) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="font-display text-sm uppercase tracking-[0.2em] text-muted">
        {title}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">{children}</div>
    </section>
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

function Breakdown({ title, items }: { title: string; items: [string, number][] }) {
  const total = items.reduce((a, [, n]) => a + n, 0) || 1;
  return (
    <section className="flex flex-col gap-2">
      <h3 className="font-display text-sm uppercase tracking-[0.2em] text-muted">
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted">Sin datos.</p>
      ) : (
        items.map(([k, n]) => (
          <div key={k} className="flex flex-col gap-1">
            <div className="flex justify-between text-sm">
              <span>{k}</span>
              <span className="readout text-muted">{n}</span>
            </div>
            <div className="h-1.5 bg-surface rounded-sm overflow-hidden">
              <div
                className="h-full bg-accent"
                style={{ width: `${(n / total) * 100}%` }}
              />
            </div>
          </div>
        ))
      )}
    </section>
  );
}
