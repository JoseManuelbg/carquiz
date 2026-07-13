import Link from "next/link";
import { notFound } from "next/navigation";
import { getCarById } from "@/lib/db";
import { REGIONS, BODY_TYPES } from "@/lib/enums";
import { saveCar, deleteCar } from "../../actions";
import BoxAnnotator from "../../ui/BoxAnnotator";
import PhotoUpload from "../../ui/PhotoUpload";

export const dynamic = "force-dynamic";

export default async function EditCar({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const car = await getCarById(id);
  if (!car) notFound();

  const full = car.images.find((i) => i.part === "full") ?? car.images[0];
  const headlight = car.images.find((i) => i.part === "headlight");
  const front = car.images.find((i) => i.part === "front");

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin" className="text-xs uppercase text-muted hover:text-accent">
        ← Volver
      </Link>

      <h2 className="font-display text-2xl font-bold uppercase">
        {car.brand} {car.model}
      </h2>

      {/* Datos */}
      <form action={saveCar} className="panel rounded-sm p-4 flex flex-col gap-3">
        <input type="hidden" name="id" value={car.id} />
        <div className="grid grid-cols-2 gap-3">
          <Field name="brand" label="Marca" defaultValue={car.brand} required />
          <Field name="model" label="Modelo" defaultValue={car.model} required />
          <Field name="gen" label="Generación" defaultValue={car.gen ?? ""} />
          <Field
            name="year"
            label="Año"
            type="number"
            defaultValue={String(car.year)}
            required
          />
          <Field
            name="engine"
            label="Motorización"
            defaultValue={car.engine ?? ""}
            placeholder="p.ej. 1.6 TDCi"
          />
          <Select name="region" label="Región" options={[...REGIONS]} value={car.region} />
          <Select
            name="bodyType"
            label="Carrocería"
            options={[...BODY_TYPES]}
            value={car.bodyType}
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="reviewed"
            defaultChecked={car.reviewed}
            className="accent-accent"
          />
          Datos y foto verificados
        </label>

        <button className="self-start rounded-sm bg-accent text-white px-5 py-2 font-display text-sm font-bold uppercase tracking-widest hover:brightness-110">
          Guardar
        </button>
      </form>

      {/* Foto */}
      <section className="panel rounded-sm p-4 flex flex-col gap-3">
        <h3 className="font-display uppercase tracking-wide">Foto</h3>
        {full ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/img/${full.id}`}
            alt=""
            className="w-full rounded-sm border border-line"
          />
        ) : (
          <p className="text-sm text-muted">Este coche no tiene foto.</p>
        )}
        <PhotoUpload carId={car.id} hasPhoto={Boolean(full)} />
      </section>

      {/* Anotación de partes */}
      {full && (
        <section className="panel rounded-sm p-4 flex flex-col gap-5">
          <h3 className="font-display uppercase tracking-wide">
            Zonas{" "}
            <span className="text-xs text-muted normal-case">
              (desbloquean los modos faro / morro)
            </span>
          </h3>
          <BoxAnnotator
            carId={car.id}
            imageId={full.id}
            part="headlight"
            initial={headlight?.region}
          />
          <BoxAnnotator
            carId={car.id}
            imageId={full.id}
            part="front"
            initial={front?.region}
          />
        </section>
      )}

      <form action={deleteCar}>
        <input type="hidden" name="id" value={car.id} />
        <button className="text-xs uppercase text-muted hover:text-accent">
          Eliminar coche
        </button>
      </form>
    </div>
  );
}

function Field({
  name,
  label,
  defaultValue,
  type = "text",
  required,
  placeholder,
}: {
  name: string;
  label: string;
  defaultValue?: string;
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
        defaultValue={defaultValue}
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
  value,
}: {
  name: string;
  label: string;
  options: string[];
  value?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-display text-[10px] uppercase tracking-[0.2em] text-muted">
        {label}
      </span>
      <select
        name={name}
        defaultValue={value}
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
