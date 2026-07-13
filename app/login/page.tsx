"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/admin";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function withEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const sb = createSupabaseBrowser();

    const { error } =
      mode === "signin"
        ? await sb.auth.signInWithPassword({ email, password })
        : await sb.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${location.origin}/auth/callback` },
          });

    setBusy(false);
    if (error) return setMsg(error.message);
    if (mode === "signup") {
      return setMsg("Cuenta creada. Revisa tu email para confirmarla.");
    }
    router.push(next);
    router.refresh();
  }

  async function withGoogle() {
    setBusy(true);
    const sb = createSupabaseBrowser();
    const { error } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setBusy(false);
      setMsg(error.message);
    }
  }

  return (
    <div className="max-w-sm mx-auto flex flex-col gap-6 py-6">
      <header className="flex items-center gap-3">
        <span className="racing-stripe h-1 w-8" />
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide">
          Entrar
        </h1>
      </header>

      <button
        onClick={withGoogle}
        disabled={busy}
        className="panel rounded-sm py-3 font-display uppercase tracking-widest hover:border-accent transition disabled:opacity-50"
      >
        Continuar con Google
      </button>

      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" />o<span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={withEmail} className="flex flex-col gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="rounded-sm border border-line bg-surface px-3 py-2.5 outline-none focus:border-accent"
        />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          className="rounded-sm border border-line bg-surface px-3 py-2.5 outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-sm bg-accent text-white py-3 font-display font-bold uppercase tracking-widest hover:brightness-110 transition disabled:opacity-50"
        >
          {mode === "signin" ? "Entrar" : "Crear cuenta"}
        </button>
      </form>

      {msg && <p className="text-sm text-accent2">{msg}</p>}

      <button
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setMsg(null);
        }}
        className="text-sm text-muted hover:text-foreground underline self-start"
      >
        {mode === "signin"
          ? "¿No tienes cuenta? Crear una"
          : "¿Ya tienes cuenta? Entrar"}
      </button>
    </div>
  );
}
