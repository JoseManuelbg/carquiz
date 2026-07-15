// Detección de idioma en servidor: cookie del usuario > idioma del navegador.

import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, isLocale, matchLocale, type Locale } from "./config";
import { translate } from "./dictionaries";

export async function getLocale(): Promise<Locale> {
  const jar = await cookies();
  const chosen = jar.get(LOCALE_COOKIE)?.value;
  if (isLocale(chosen)) return chosen;
  const h = await headers();
  return matchLocale(h.get("accept-language"));
}

/** Para Server Components: locale + función de traducción. */
export async function getT() {
  const locale = await getLocale();
  return {
    locale,
    t: (key: string, vars?: Record<string, string | number>) =>
      translate(locale, key, vars),
  };
}
