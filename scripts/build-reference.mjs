// One-off builder for the autocomplete reference list.
//
// Pulls every passenger-car make from the free NHTSA vPIC API, then each make's
// models, and writes a clean reference/vehicles.json used to power the daily
// mode's autocomplete. Re-run whenever you want to refresh the catalog:
//
//   node scripts/build-reference.mjs
//
// No API key required. When the backend moves to a real DB, this same data can
// seed the vehicles table.

import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const BASE = "https://vpic.nhtsa.dot.gov/api/vehicles";
const YEAR_MIN = 1970;
const YEAR_MAX = new Date().getFullYear();

async function getJson(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`failed: ${url}`);
}

// Keep short tokens (BMW, MG, GT) uppercase; Title-case the rest.
function tidy(s) {
  return s
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((w) =>
      w
        .split("-")
        .map((p) =>
          p.length <= 3 && /^[a-z]+$/.test(p)
            ? p.toUpperCase()
            : p.charAt(0).toUpperCase() + p.slice(1)
        )
        .join("-")
    )
    .join(" ");
}

async function main() {
  console.log("Fetching car makes…");
  const makesRes = await getJson(`${BASE}/GetMakesForVehicleType/car?format=json`);
  const makes = makesRes.Results ?? [];
  console.log(`  ${makes.length} makes`);

  const cars = [];
  const seen = new Set();
  let done = 0;

  for (const make of makes) {
    done++;
    try {
      const modelsRes = await getJson(
        `${BASE}/GetModelsForMakeId/${make.MakeId}?format=json`
      );
      for (const m of modelsRes.Results ?? []) {
        const brand = tidy(m.Make_Name);
        const model = tidy(m.Model_Name);
        const key = `${brand}|${model}`.toLowerCase();
        if (!brand || !model || seen.has(key)) continue;
        seen.add(key);
        cars.push({ brand, model });
      }
    } catch (e) {
      console.warn(`  skip ${make.MakeName}: ${e.message}`);
    }
    if (done % 20 === 0) console.log(`  ${done}/${makes.length} makes, ${cars.length} models`);
    await new Promise((r) => setTimeout(r, 40));
  }

  cars.sort((a, b) =>
    a.brand === b.brand ? a.model.localeCompare(b.model) : a.brand.localeCompare(b.brand)
  );

  const brands = [...new Set(cars.map((c) => c.brand))].sort();
  const out = {
    generatedAt: new Date().toISOString(),
    source: "NHTSA vPIC",
    yearRange: [YEAR_MIN, YEAR_MAX],
    brands,
    cars,
  };

  const dir = path.join(process.cwd(), "reference");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "vehicles.json"), JSON.stringify(out));
  console.log(`Wrote reference/vehicles.json: ${brands.length} brands, ${cars.length} models`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
