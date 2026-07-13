"use server";

// Acciones del panel. TODAS verifican que quien llama es admin (defensa en
// profundidad: no basta con que el layout proteja la página).

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin, PHOTO_BUCKET } from "@/lib/supabase";
import type { Region } from "@/lib/types";

const newImageId = () => `img_${randomBytes(5).toString("hex")}`;

function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Guarda los datos de un coche y su estado de revisión. */
export async function saveCar(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));

  const patch = {
    brand: String(formData.get("brand")).trim(),
    model: String(formData.get("model")).trim(),
    gen: String(formData.get("gen") ?? "").trim() || null,
    year: Number(formData.get("year")),
    engine: String(formData.get("engine") ?? "").trim() || null,
    region: String(formData.get("region")),
    body_type: String(formData.get("bodyType")),
    reviewed: formData.get("reviewed") === "on",
  };

  const { error } = await supabaseAdmin().from("cars").update(patch).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
  revalidatePath(`/admin/cars/${id}`);
}

/** Alta manual: marca y modelo escritos a mano, con validación. */
export async function createCar(formData: FormData) {
  await requireAdmin();
  const sb = supabaseAdmin();

  const brand = String(formData.get("brand") ?? "").trim();
  const model = String(formData.get("model") ?? "").trim();
  const year = Number(formData.get("year"));
  if (!brand || !model || !Number.isFinite(year)) {
    return { error: "Marca, modelo y año son obligatorios." };
  }

  const gen = String(formData.get("gen") ?? "").trim();
  const id = slugify([brand, model, gen].filter(Boolean).join("-"));

  // Validación: ¿ya existe ese coche?
  const dup = await sb.from("cars").select("id").eq("id", id).maybeSingle();
  if (dup.data) return { error: `Ya existe un coche con id "${id}".` };

  const { error } = await sb.from("cars").insert({
    id,
    brand,
    model,
    gen: gen || null,
    year,
    engine: String(formData.get("engine") ?? "").trim() || null,
    region: String(formData.get("region")),
    body_type: String(formData.get("bodyType")),
    reviewed: true, // lo has metido tú a mano
  });
  if (error) return { error: error.message };

  const photo = formData.get("photo") as File | null;
  if (photo && photo.size > 0) {
    const up = await uploadPhotoFor(id, photo);
    if (up?.error) return { error: `Coche creado, pero la foto falló: ${up.error}` };
  }

  revalidatePath("/admin");
  return { ok: true, id };
}

async function uploadPhotoFor(carId: string, photo: File) {
  const sb = supabaseAdmin();
  const ext = (photo.name.split(".").pop() || "jpg").toLowerCase();
  const storagePath = `cars/${carId}-${Date.now()}.${ext}`;
  const bytes = new Uint8Array(await photo.arrayBuffer());

  const up = await sb.storage.from(PHOTO_BUCKET).upload(storagePath, bytes, {
    contentType: photo.type || "image/jpeg",
    upsert: true,
  });
  if (up.error) return { error: up.error.message };

  const ins = await sb.from("car_images").insert({
    id: newImageId(),
    car_id: carId,
    storage_path: storagePath,
    part: "full",
  });
  if (ins.error) return { error: ins.error.message };
  return { ok: true };
}

/** Sustituye/añade la foto principal de un coche. */
export async function uploadPhoto(formData: FormData) {
  await requireAdmin();
  const carId = String(formData.get("id"));
  const photo = formData.get("photo") as File | null;
  if (!photo || photo.size === 0) return { error: "Elige un archivo." };

  const res = await uploadPhotoFor(carId, photo);
  revalidatePath(`/admin/cars/${carId}`);
  revalidatePath("/admin");
  return res;
}

/**
 * Guarda la caja del faro (o el morro) sobre una foto ya existente.
 * No duplica la imagen: crea otra fila car_images apuntando al MISMO fichero,
 * con part='headlight'/'front' y el recorte. Así el modo faro ya la encuentra.
 */
export async function savePartBox(formData: FormData) {
  await requireAdmin();
  const sb = supabaseAdmin();

  const carId = String(formData.get("carId"));
  const sourceImageId = String(formData.get("sourceImageId"));
  const part = String(formData.get("part")); // headlight | front
  const box: Region = {
    x: Number(formData.get("x")),
    y: Number(formData.get("y")),
    w: Number(formData.get("w")),
    h: Number(formData.get("h")),
  };
  if (![box.x, box.y, box.w, box.h].every(Number.isFinite) || box.w <= 0 || box.h <= 0) {
    return { error: "Dibuja una caja válida sobre la foto." };
  }

  const src = await sb
    .from("car_images")
    .select("storage_path")
    .eq("id", sourceImageId)
    .maybeSingle();
  if (!src.data) return { error: "No encuentro la foto de origen." };

  // Si ya hay una anotación de esa parte, la actualizamos.
  const existing = await sb
    .from("car_images")
    .select("id")
    .eq("car_id", carId)
    .eq("part", part)
    .maybeSingle();

  const row = {
    car_id: carId,
    storage_path: src.data.storage_path as string,
    part,
    region_box: box,
  };

  const { error } = existing.data
    ? await sb.from("car_images").update(row).eq("id", existing.data.id)
    : await sb.from("car_images").insert({ id: newImageId(), ...row });

  if (error) return { error: error.message };

  revalidatePath(`/admin/cars/${carId}`);
  return { ok: true };
}

export async function deleteCar(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const { error } = await supabaseAdmin().from("cars").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}
