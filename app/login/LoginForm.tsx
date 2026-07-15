"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { useT } from "@/app/ui/I18nProvider";
import { isUsernameFree } from "./actions";

export default function LoginForm() {
  const { t } = useT();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function withEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const sb = createSupabaseBrowser();

    if (mode === "signup") {
      // Se comprueba antes para no crear la cuenta y dejarla sin nombre.
      const check = await isUsernameFree(username);
      if (!check.free) {
        setBusy(false);
        return setMsg(check.error ?? "Nombre no válido.");
      }
    }

    const { error } =
      mode === "signin"
        ? await sb.auth.signInWithPassword({ email, password })
        : await sb.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${location.origin}/auth/callback`,
              // El trigger de la BBDD lo copia al perfil al crear la cuenta.
              data: { username: username.trim() },
            },
          });

    setBusy(false);
    if (error) return setMsg(error.message);
    if (mode === "signup") {
      return setMsg(t("auth.created"));
    }
    // Pasa por bienvenida: reenvía a `next` si ya hay nombre, o lo pide si no.
    router.push(`/bienvenida?next=${encodeURIComponent(next)}`);
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
    <div className="flex flex-col gap-6">
      <button
        onClick={withGoogle}
        disabled={busy}
        className="panel rounded-sm py-3 font-display uppercase tracking-widest hover:border-accent transition disabled:opacity-50"
      >
        {t("auth.google")}
      </button>

      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" />
        {t("auth.or")}
        <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={withEmail} className="flex flex-col gap-3">
        {mode === "signup" && (
          <div className="flex flex-col gap-1">
            <input
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t("auth.pilotName")}
              minLength={3}
              maxLength={20}
              className="rounded-sm border border-line bg-surface px-3 py-2.5 outline-none focus:border-accent"
            />
            <span className="text-xs text-muted">{t("auth.nameHint")}</span>
          </div>
        )}

        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("auth.email")}
          className="rounded-sm border border-line bg-surface px-3 py-2.5 outline-none focus:border-accent"
        />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("auth.password")}
          className="rounded-sm border border-line bg-surface px-3 py-2.5 outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-sm bg-accent text-white py-3 font-display font-bold uppercase tracking-widest hover:brightness-110 transition disabled:opacity-50"
        >
          {mode === "signin" ? t("auth.signin") : t("auth.signup")}
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
        {mode === "signin" ? t("auth.toSignup") : t("auth.toSignin")}
      </button>
    </div>
  );
}
