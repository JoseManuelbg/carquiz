import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, isAdminEmail } from "@/lib/auth";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");

  if (!(await isAdminEmail(user.email))) {
    return (
      <div className="py-16 text-center flex flex-col gap-2">
        <h1 className="font-display text-2xl font-bold uppercase text-accent">
          No autorizado
        </h1>
        <p className="text-sm text-muted">
          Esta cuenta no está en la lista de administradores.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="racing-stripe h-1 w-8" />
          <Link
            href="/admin"
            className="font-display text-2xl font-bold uppercase tracking-wide"
          >
            Panel
          </Link>
        </div>
        <Link href="/admin/stats" className="text-xs text-muted hover:text-accent">
          Datos
        </Link>
      </div>
      {children}
    </div>
  );
}
