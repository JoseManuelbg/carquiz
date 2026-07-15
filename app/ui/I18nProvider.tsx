"use client";

// Proveedor de idioma para los Client Components. El locale lo decide el
// servidor (layout) y se pasa aquí; la traducción es pura.

import { createContext, useContext } from "react";
import { translate } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";

const LocaleContext = createContext<Locale>("es");

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useT() {
  const locale = useContext(LocaleContext);
  return {
    locale,
    t: (key: string, vars?: Record<string, string | number>) =>
      translate(locale, key, vars),
  };
}
