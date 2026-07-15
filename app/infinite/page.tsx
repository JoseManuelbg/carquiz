"use client";

import { useEffect, useState } from "react";
import Game from "@/app/ui/Game";
import { INFINITE_MODES } from "@/lib/modes";
import { DIFFICULTIES } from "@/lib/difficulty";
import { useT } from "@/app/ui/I18nProvider";

const REGION_IDS = ["EUR", "JDM", "USDM"];
const PLAYABLE = INFINITE_MODES.filter((m) => m.part === "full");
const COMING_SOON = INFINITE_MODES.filter((m) => m.part !== "full");

interface Facets {
  brands: { value: string; n: number }[];
  bodies: { value: string; n: number }[];
  decades: { value: number; n: number }[];
}

export default function InfinitePage() {
  const { t } = useT();
  const [modes, setModes] = useState<Set<string>>(new Set(PLAYABLE.map((m) => m.id)));
  const [regions, setRegions] = useState<Set<string>>(new Set(REGION_IDS));
  const [difficulty, setDifficulty] = useState("normal");
  const [brands, setBrands] = useState<Set<string>>(new Set());
  const [bodies, setBodies] = useState<Set<string>>(new Set());
  const [decades, setDecades] = useState<Set<string>>(new Set());
  const [facets, setFacets] = useState<Facets | null>(null);
  const [brandSearch, setBrandSearch] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    fetch("/api/facets")
      .then((r) => r.json())
      .then(setFacets)
      .catch(() => {});
  }, []);

  const toggle = (set: Set<string>, id: string) => {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  };

  const canPlay = modes.size > 0 && regions.size > 0;
  const q = new URLSearchParams();
  q.set("modes", [...modes].join(","));
  q.set("regions", [...regions].join(","));
  q.set("difficulty", difficulty);
  if (brands.size) q.set("brands", [...brands].join(","));
  if (bodies.size) q.set("bodies", [...bodies].join(","));
  if (decades.size) q.set("decades", [...decades].join(","));
  const query = q.toString();

  if (started) {
    return (
      <div className="flex flex-col items-center gap-5">
        <button
          onClick={() => setStarted(false)}
          className="self-start font-display text-xs uppercase tracking-widest text-muted hover:text-accent transition-colors"
        >
          ← {t("inf.settings")}
        </button>
        <Game key={query} query={query} />
      </div>
    );
  }

  const visibleBrands =
    facets?.brands.filter((b) =>
      b.value.toLowerCase().includes(brandSearch.toLowerCase())
    ) ?? [];

  return (
    <div className="flex flex-col gap-7 py-2">
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide">
        {t("home.infinite")}
      </h1>

      <Section title={t("inf.modes")}>
        {PLAYABLE.map((m) => (
          <Chip key={m.id} active={modes.has(m.id)} onClick={() => setModes((s) => toggle(s, m.id))}>
            {t(`mode.${m.id}`)}
          </Chip>
        ))}
        {COMING_SOON.map((m) => (
          <span
            key={m.id}
            className="rounded-sm border border-dashed border-line px-3 py-1.5 font-display text-sm uppercase tracking-wide text-muted/50"
          >
            {t(`mode.${m.id}`)} · {t("inf.soon")}
          </span>
        ))}
      </Section>

      <Section title={t("inf.difficulty")}>
        {DIFFICULTIES.map((d) => (
          <Chip
            key={d.id}
            active={difficulty === d.id}
            onClick={() => setDifficulty(d.id)}
            title={t(`diff.${d.id}.desc`)}
          >
            {t(`diff.${d.id}`)}
          </Chip>
        ))}
      </Section>

      <Section title={t("inf.region")}>
        {REGION_IDS.map((r) => (
          <Chip key={r} active={regions.has(r)} onClick={() => setRegions((s) => toggle(s, r))}>
            {t(`region.${r}`)}
          </Chip>
        ))}
      </Section>

      {facets && facets.bodies.length > 1 && (
        <Section title={t("inf.body")} hint={t("inf.emptyAll")}>
          {facets.bodies.map((b) => (
            <Chip key={b.value} active={bodies.has(b.value)} onClick={() => setBodies((s) => toggle(s, b.value))}>
              {b.value}
            </Chip>
          ))}
        </Section>
      )}

      {facets && facets.decades.length > 1 && (
        <Section title={t("inf.decade")} hint={t("inf.emptyAll")}>
          {facets.decades.map((d) => (
            <Chip
              key={d.value}
              active={decades.has(String(d.value))}
              onClick={() => setDecades((s) => toggle(s, String(d.value)))}
            >
              {d.value}s
            </Chip>
          ))}
        </Section>
      )}

      {facets && facets.brands.length > 1 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-xs uppercase tracking-[0.2em] text-muted">
              {t("inf.brand")}{" "}
              <span className="normal-case tracking-normal">· {t("inf.emptyAll")}</span>
            </h2>
            {brands.size > 0 && (
              <button
                onClick={() => setBrands(new Set())}
                className="text-xs text-accent hover:underline"
              >
                {t("inf.remove")} ({brands.size})
              </button>
            )}
          </div>
          <input
            value={brandSearch}
            onChange={(e) => setBrandSearch(e.target.value)}
            placeholder={t("inf.searchBrand")}
            className="rounded-sm border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto p-1">
            {visibleBrands.map((b) => (
              <Chip key={b.value} active={brands.has(b.value)} onClick={() => setBrands((s) => toggle(s, b.value))}>
                {b.value}
              </Chip>
            ))}
          </div>
        </section>
      )}

      <button
        disabled={!canPlay}
        onClick={() => setStarted(true)}
        className="rounded-sm bg-accent text-white py-4 font-display text-lg font-bold uppercase tracking-[0.2em] transition hover:brightness-110 active:scale-[0.99] disabled:opacity-30"
      >
        {t("inf.start")}
      </button>
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-xs uppercase tracking-[0.2em] text-muted">
        {title}
        {hint && <span className="normal-case tracking-normal"> · {hint}</span>}
      </h2>
      <div className="flex flex-wrap gap-2">{children}</div>
    </section>
  );
}

function Chip({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`rounded-sm border px-3 py-1.5 font-display text-sm uppercase tracking-wide transition ${
        active
          ? "border-accent bg-accent text-white"
          : "border-line bg-surface text-muted hover:border-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
