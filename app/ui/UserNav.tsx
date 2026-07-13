import Link from "next/link";
import { getCurrentUser, isAdminEmail } from "@/lib/auth";
import { getProfile } from "@/lib/stats";
import SignOutButton from "./SignOutButton";

export default async function UserNav() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Link
        href="/login?next=/perfil"
        className="text-sm text-muted hover:text-foreground transition-colors"
      >
        Entrar
      </Link>
    );
  }

  const profile = await getProfile(user.id);
  const admin = await isAdminEmail(user.email);

  return (
    <div className="flex items-center gap-3 text-sm">
      {admin && (
        <Link href="/admin" className="text-muted hover:text-accent transition-colors">
          Panel
        </Link>
      )}
      <Link href="/perfil" className="hover:text-accent transition-colors">
        {/* Nunca el email: si aún no hay nombre, se le manda a ponérselo. */}
        {profile?.username ?? (
          <span className="text-accent2">Ponte un nombre</span>
        )}
      </Link>
      <SignOutButton />
    </div>
  );
}
