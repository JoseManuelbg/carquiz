// Valores permitidos. Tenerlos en un solo sitio evita que se cuelen
// carrocerías/regiones inventadas al dar de alta coches.

export const REGIONS = ["EUR", "JDM", "USDM"] as const;

export const BODY_TYPES = [
  "Hatchback",
  "Sedan",
  "Estate",
  "Coupe",
  "Convertible",
  "Roadster",
  "SUV",
  "Pickup",
  "MPV",
  "Van",
] as const;

export const PARTS = ["full", "headlight", "front", "rear", "interior", "wheel"] as const;
