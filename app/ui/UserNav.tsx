import Link from "next/link";
import { getCurrentUser, isAdminEmail } from "@/lib/auth";
import { getProfile } from "@/lib/stats";
import { getT } from "@/lib/i18n/server";
import SignOutButton from "./SignOutButton";

export default async function UserNav() {
  const { t } = await getT();
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Link
        href="/login?next=/perfil"
        className="text-sm text-muted hover:text-foreground transition-colors"
      >
        {t("nav.login")}
      </Link>
    );
  }

  const profile = await getProfile(user.id);
  const admin = await isAdminEmail(user.email);

  return (
    <div className="flex items-center gap-3 text-sm">
      {admin && (
        <Link href="/admin" className="text-muted hover:text-accent transition-colors">
          {t("nav.panel")}
        </Link>
      )}
      <Link href="/perfil" className="hover:text-accent transition-colors">
        {/* Nunca el email: si aún no hay nombre, se le manda a ponérselo. */}
        {profile?.username ?? <span className="text-accent2">{t("nav.setName")}</span>}
      </Link>
      <SignOutButton />
    </div>
  );
}
