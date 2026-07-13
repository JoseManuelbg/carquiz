"use client";

import { useState } from "react";
import { uploadPhoto } from "../actions";

export default function PhotoUpload({
  carId,
  hasPhoto,
}: {
  carId: string;
  hasPhoto: boolean;
}) {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(formData: FormData) {
    setBusy(true);
    setMsg(null);
    const res = await uploadPhoto(formData);
    setBusy(false);
    setMsg(res?.error ? res.error : "Foto actualizada ✓");
  }

  return (
    <form action={submit} className="flex flex-wrap gap-2 items-center">
      <input type="hidden" name="id" value={carId} />
      <input
        type="file"
        name="photo"
        accept="image/*"
        required
        className="text-sm text-muted file:mr-3 file:rounded-sm file:border-0 file:bg-surface file:px-3 file:py-1.5 file:text-foreground"
      />
      <button
        disabled={busy}
        className="rounded-sm border border-line bg-surface px-4 py-2 font-display text-sm uppercase hover:border-accent disabled:opacity-50"
      >
        {hasPhoto ? "Reemplazar foto" : "Subir foto"}
      </button>
      {msg && <span className="text-xs text-muted">{msg}</span>}
    </form>
  );
}
