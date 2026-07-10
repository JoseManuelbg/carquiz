// Automated photo fetcher (Wikimedia Commons).
//
// For every car in cars.json that has no images yet, searches Wikimedia Commons
// for a usable photo, downloads it into /cars, and appends an image record with
// an opaque id and attribution (required by the CC/Wikimedia licenses).
//
//   node scripts/fetch-photos.mjs            # fill cars missing a photo
//   node scripts/fetch-photos.mjs --force    # re-fetch even if a photo exists
//
// Wikimedia requires a descriptive User-Agent; be polite with rate limits.

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

const API = "https://commons.wikimedia.org/w/api.php";
const UA = "CarQuiz/0.1 (educational hobby project; contact: local dev)";
const FORCE = process.argv.includes("--force");

// Skip clearly non-photo or unhelpful results.
const BLOCK = /logo|badge|emblem|interior|dashboard|engine|diagram|drawing|map|patent|blueprint|\.svg$/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// GET with retry + exponential backoff, honoring 429/503 rate limits.
async function get(url) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.ok) return res;
    if (res.status === 429 || res.status === 503) {
      await sleep(1500 * 2 ** attempt);
      continue;
    }
    throw new Error(String(res.status));
  }
  throw new Error("429 (gave up)");
}

async function api(params) {
  const url = `${API}?${new URLSearchParams({ ...params, format: "json", origin: "*" })}`;
  return (await get(url)).json();
}

function stripHtml(s) {
  return s
    ? s.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim()
    : undefined;
}

async function searchPhoto(query) {
  const data = await api({
    action: "query",
    generator: "search",
    gsrsearch: `${query} car`,
    gsrnamespace: "6", // File:
    gsrlimit: "15",
    prop: "imageinfo",
    iiprop: "url|mime|size|extmetadata",
    iiurlwidth: "1024",
  });
  const pages = Object.values(data?.query?.pages ?? {});
  // Prefer wider photos; keep only real raster images that aren't blocked.
  const candidates = pages
    .filter((p) => !BLOCK.test(p.title || ""))
    .map((p) => p.imageinfo?.[0])
    .filter((ii) => ii && /^image\/(jpeg|png)$/.test(ii.mime) && (ii.width ?? 0) >= 640)
    .sort((a, b) => (b.width ?? 0) - (a.width ?? 0));
  return candidates[0];
}

async function download(url, dest) {
  const res = await get(url);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
}

async function main() {
  const carsPath = path.join(process.cwd(), "cars.json");
  const cars = JSON.parse(await readFile(carsPath, "utf8"));
  let changed = 0;

  for (const car of cars) {
    if (!FORCE && car.images?.length) continue;

    const queries = [
      `${car.brand} ${car.model} ${car.year}`,
      `${car.brand} ${car.model} ${car.gen ?? ""}`.trim(),
      `${car.brand} ${car.model}`,
    ];

    let ii;
    for (const q of queries) {
      try {
        ii = await searchPhoto(q);
      } catch (e) {
        console.warn(`  query failed (${q}): ${e.message}`);
      }
      if (ii) break;
      await sleep(400);
    }

    if (!ii) {
      console.warn(`✗ ${car.brand} ${car.model}: no photo found`);
      continue;
    }

    const src = ii.thumburl || ii.url;
    const ext = ii.mime === "image/png" ? "png" : "jpg";
    const file = `${car.id}.${ext}`;
    try {
      await download(src, path.join(process.cwd(), "cars", file));
    } catch (e) {
      console.warn(`✗ ${car.brand} ${car.model}: ${e.message}`);
      continue;
    }

    const meta = ii.extmetadata ?? {};
    const image = {
      id: `img_${randomBytes(5).toString("hex")}`,
      file,
      part: "full",
      credit: {
        artist: stripHtml(meta.Artist?.value) || "Wikimedia Commons",
        license: stripHtml(meta.LicenseShortName?.value) || "see source",
        source: ii.descriptionurl || "https://commons.wikimedia.org",
      },
    };
    car.images = [image];
    changed++;
    console.log(`✓ ${car.brand} ${car.model} -> ${file} (${image.credit.license})`);
    await sleep(700);
  }

  if (changed) {
    await writeFile(carsPath, JSON.stringify(cars, null, 2) + "\n");
    console.log(`\nUpdated cars.json: ${changed} photo(s) added.`);
  } else {
    console.log("Nothing to do.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
