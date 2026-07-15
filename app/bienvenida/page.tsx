import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getProfile } from "@/lib/stats";
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

  return (
    <div className="max-w-sm mx-auto flex flex-col gap-5 py-8">
      <div className="flex items-center gap-3">
        <span className="racing-stripe h-1 w-8" />
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide">
          Elige tu nombre
        </h1>
      </div>
      <p className="text-sm text-muted">
        Es con el que sales en el ranking y con el que te añaden tus amigos. Tu
        email no se muestra nunca. Podrás cambiarlo más adelante.
      </p>
      <UsernameForm current={null} redirectTo={dest} cta="Empezar a jugar" />
    </div>
  );
}
