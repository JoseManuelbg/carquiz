"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setUsername } from "./actions";

export default function UsernameForm({
  current,
  redirectTo,
  cta = "Guardar",
  disabled,
}: {
  current: string | null;
  /** Si se pasa, al guardar con éxito navega ahí (para el onboarding). */
  redirectTo?: string;
  cta?: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(formData: FormData) {
    setBusy(true);
    setMsg(null);
    const res = await setUsername(formData);
    if (res?.error) {
      setBusy(false);
      return setMsg(res.error);
    }
    if (redirectTo) {
      router.push(redirectTo);
      router.refresh();
      return;
    }
    setBusy(false);
    setMsg("Guardado ✓");
    router.refresh();
  }

  return (
    <form action={submit} className="flex flex-wrap gap-2 items-center">
      <input
        name="username"
        defaultValue={current ?? ""}
        placeholder="tu_nombre"
        disabled={disabled}
        className="flex-1 min-w-40 rounded-sm border border-line bg-surface px-3 py-2 outline-none focus:border-accent disabled:opacity-50"
      />
      <button
        disabled={busy || disabled}
        className="rounded-sm bg-accent text-white px-4 py-2 font-display text-sm font-bold uppercase tracking-wider hover:brightness-110 disabled:opacity-50"
      >
        {cta}
      </button>
      {msg && <span className="text-xs text-muted w-full">{msg}</span>}
    </form>
  );
}
