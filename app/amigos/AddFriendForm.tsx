"use client";

import { useState } from "react";
import { addFriend } from "../perfil/actions";

export default function AddFriendForm() {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(formData: FormData) {
    setBusy(true);
    setMsg(null);
    const res = await addFriend(formData);
    setBusy(false);
    setMsg(res?.error ?? res?.msg ?? null);
  }

  return (
    <form action={submit} className="flex flex-wrap gap-2 items-center">
      <input
        name="username"
        required
        placeholder="Nombre de tu amigo"
        className="flex-1 min-w-40 rounded-sm border border-line bg-surface px-3 py-2 outline-none focus:border-accent"
      />
      <button
        disabled={busy}
        className="rounded-sm bg-accent text-white px-4 py-2 font-display text-sm font-bold uppercase tracking-wider hover:brightness-110 disabled:opacity-50"
      >
        Añadir
      </button>
      {msg && <span className="text-xs text-muted w-full">{msg}</span>}
    </form>
  );
}
