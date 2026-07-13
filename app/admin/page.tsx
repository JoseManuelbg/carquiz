import Link from "next/link";
import { getCars } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminHome({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string }>;
}) {
  const { filter, q } = await searchParams;
  const all = await getCars();

  const needle = (q ?? "").toLowerCase().trim();
  let cars = all;
  if (filter === "pending") cars = cars.filter((c) => !c.reviewed);
  if (filter === "nophoto") cars = cars.filter((c) => c.images.length === 0);
  if (needle) {
    cars = cars.filter((c) =>
      `${c.brand} ${c.model} ${c.gen ?? ""}`.toLowerCase().includes(needle)
    );
  }
  cars.sort((a, b) => `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`));

  const pending = all.filter((c) => !c.reviewed).length;
  const noPhoto = all.filter((c) => c.images.length === 0).length;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Coches" value={all.length} />
        <Stat label="Sin revisar" value={pending} accent={pending > 0} />
        <Stat label="Sin foto" value={noPhoto} accent={noPhoto > 0} />
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Tab href="/admin" active={!filter}>
          Todos
        </Tab>
        <Tab href="/admin?filter=pending" active={filter === "pending"}>
          Sin revisar
        </Tab>
        <Tab href="/admin?filter=nophoto" active={filter === "nophoto"}>
          Sin foto
        </Tab>
        <Link
          href="/admin/new"
          className="ml-auto rounded-sm bg-accent text-white px-4 py-2 font-display text-sm font-bold uppercase tracking-widest hover:brightness-110"
        >
          + Añadir coche
        </Link>
      </div>

      <form className="flex gap-2">
        {filter && <input type="hidden" name="filter" value={filter} />}
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar marca o modelo…"
          className="flex-1 rounded-sm border border-line bg-surface px-3 py-2 outline-none focus:border-accent"
        />
        <button className="rounded-sm border border-line bg-surface px-4 font-display text-sm uppercase hover:border-accent">
          Buscar
        </button>
      </form>

      <p className="text-xs text-muted">{cars.length} resultados</p>

      <ul className="flex flex-col gap-2">
        {cars.map((c) => {
          const photo = c.images.find((i) => i.part === "full") ?? c.images[0];
          const hasHeadlight = c.images.some((i) => i.part === "headlight");
          return (
            <li key={c.id}>
              <Link
                href={`/admin/cars/${c.id}`}
                className="panel rounded-sm flex items-center gap-3 p-2 hover:border-accent transition-colors"
              >
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/img/${photo.id}`}
                    alt=""
                    className="h-14 w-20 object-cover rounded-sm shrink-0"
                  />
                ) : (
                  <span className="h-14 w-20 grid place-items-center rounded-sm bg-absent text-[10px] text-muted shrink-0">
                    sin foto
                  </span>
                )}
                <span className="flex-1 min-w-0">
                  <span className="block font-display font-bold uppercase truncate">
                    {c.brand} {c.model}
                  </span>
                  <span className="block text-xs text-muted truncate">
                    {c.gen ? `${c.gen} · ` : ""}
                    {c.year} · {c.engine ?? "sin motor"} · {c.region} · {c.bodyType}
                  </span>
                </span>
                <span className="flex flex-col items-end gap-1 shrink-0">
                  {c.reviewed ? (
                    <span className="text-[10px] font-display uppercase text-correct">
                      ✓ revisado
                    </span>
                  ) : (
                    <span className="text-[10px] font-display uppercase text-accent2">
                      pendiente
                    </span>
                  )}
                  {hasHeadlight && (
                    <span className="text-[10px] font-display uppercase text-muted">
                      faro ✓
                    </span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="panel rounded-sm px-3 py-2">
      <div className="font-display text-[10px] uppercase tracking-[0.2em] text-muted">
        {label}
      </div>
      <div
        className={`readout text-2xl font-bold ${accent ? "text-accent" : ""}`}
      >
        {value}
      </div>
    </div>
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
      className={`rounded-sm border px-3 py-1.5 font-display text-sm uppercase tracking-wide ${
        active
          ? "border-accent bg-accent text-white"
          : "border-line bg-surface text-muted hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}
