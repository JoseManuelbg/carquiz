"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createCar } from "../actions";
import { REGIONS, BODY_TYPES } from "@/lib/enums";

export default function NewCar() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(formData: FormData) {
    setBusy(true);
    setError(null);
    const res = await createCar(formData);
    setBusy(false);
    if (res?.error) return setError(res.error);
    router.push(`/admin/cars/${res?.id}`);
  }

  return (
    <div className="flex flex-col gap-5">
      <Link href="/admin" className="text-xs uppercase text-muted hover:text-accent">
        ← Volver
      </Link>
      <h2 className="font-display text-2xl font-bold uppercase">Añadir coche</h2>
      <p className="text-sm text-muted -mt-3">
        Marca y modelo se escriben a mano. Se valida que no exista ya y que la
        región y la carrocería sean válidas.
      </p>

      <form action={submit} className="panel rounded-sm p-4 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Field name="brand" label="Marca" required placeholder="Ford" />
          <Field name="model" label="Modelo" required placeholder="Focus" />
          <Field name="gen" label="Generación" placeholder="Mk2" />
          <Field name="year" label="Año" type="number" required placeholder="2005" />
          <Field name="engine" label="Motorización" placeholder="1.6 TDCi" />
          <Select name="region" label="Región" options={[...REGIONS]} />
          <Select name="bodyType" label="Carrocería" options={[...BODY_TYPES]} />
        </div>

        <label className="flex flex-col gap-1">
          <span className="font-display text-[10px] uppercase tracking-[0.2em] text-muted">
            Foto (opcional)
          </span>
          <input
            type="file"
            name="photo"
            accept="image/*"
            className="text-sm text-muted file:mr-3 file:rounded-sm file:border-0 file:bg-surface file:px-3 file:py-1.5 file:text-foreground"
          />
        </label>

        {error && <p className="text-sm text-accent">{error}</p>}

        <button
          disabled={busy}
          className="self-start rounded-sm bg-accent text-white px-5 py-2 font-display text-sm font-bold uppercase tracking-widest hover:brightness-110 disabled:opacity-50"
        >
          {busy ? "Creando…" : "Crear coche"}
        </button>
      </form>
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
  placeholder,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-display text-[10px] uppercase tracking-[0.2em] text-muted">
        {label}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="rounded-sm border border-line bg-background px-3 py-2 outline-none focus:border-accent"
      />
    </label>
  );
}

function Select({
  name,
  label,
  options,
}: {
  name: string;
  label: string;
  options: string[];
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-display text-[10px] uppercase tracking-[0.2em] text-muted">
        {label}
      </span>
      <select
        name={name}
        className="rounded-sm border border-line bg-background px-3 py-2 outline-none focus:border-accent"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
