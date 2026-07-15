"use client";

import { LOCALES, LOCALE_NAMES, LOCALE_COOKIE } from "@/lib/i18n/config";
import { useT } from "./I18nProvider";

export default function LanguageSwitcher() {
  const { locale } = useT();

  return (
    <select
      aria-label="Idioma"
      value={locale}
      onChange={(e) => {
        document.cookie = `${LOCALE_COOKIE}=${e.target.value}; path=/; max-age=31536000; samesite=lax`;
        location.reload();
      }}
      className="rounded-sm border border-line bg-surface px-2 py-1 text-xs text-muted outline-none focus:border-accent"
    >
      {LOCALES.map((l) => (
        <option key={l} value={l}>
          {LOCALE_NAMES[l]}
        </option>
      ))}
    </select>
  );
}
