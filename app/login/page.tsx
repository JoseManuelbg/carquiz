import { Suspense } from "react";
import LoginForm from "./LoginForm";
import { getT } from "@/lib/i18n/server";

// El formulario lee ?next= con useSearchParams, así que va dentro de <Suspense>:
// sin él, Next no puede prerenderizar esta página y el build falla.
export default async function LoginPage() {
  const { t } = await getT();
  return (
    <div className="max-w-sm mx-auto flex flex-col gap-6 py-6">
      <header className="flex items-center gap-3">
        <span className="racing-stripe h-1 w-8" />
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide">
          {t("auth.signin")}
        </h1>
      </header>

      <Suspense fallback={<p className="text-sm text-muted">{t("game.loading")}</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
