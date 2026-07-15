import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getProfile } from "@/lib/stats";
import { getT } from "@/lib/i18n/server";
import UsernameForm from "../perfil/UsernameForm";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

// Paso de bienvenida: en cuanto inicias sesión, si aún no tienes nombre lo pones
// aquí "de una". Si ya lo tienes, esta página te reenvía a donde ibas.
export default async function Bienvenida({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const dest = next && next.startsWith("/") ? next : "/";

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/bienvenida`);

  const profile = await getProfile(user.id);
  if (profile?.username) redirect(dest);

  const { t } = await getT();

  return (
    <div className="max-w-sm mx-auto flex flex-col gap-5 py-8">
      <div className="flex items-center gap-3">
        <span className="racing-stripe h-1 w-8" />
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide">
          {t("welcome.title")}
        </h1>
      </div>
      <p className="text-sm text-muted">{t("welcome.text")}</p>
      <UsernameForm current={null} redirectTo={dest} cta={t("welcome.cta")} />
    </div>
  );
}
