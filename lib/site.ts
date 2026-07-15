// URL pública del sitio. Se usa en metadata, OG, robots y sitemap.
// En Vercel, VERCEL_PROJECT_PRODUCTION_URL viene dado; el fallback es por si acaso.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://carquiz-two.vercel.app");

export const SITE_NAME = "Autodle";
export const SITE_DESC =
  "Adivina el coche por la foto. Un reto diario compartido y un modo infinito que se endurece con cada acierto. Más de 150 coches, de un Ford Focus a un Lamborghini Countach.";
