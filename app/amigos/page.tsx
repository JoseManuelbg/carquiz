import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getProfile, listFriends, pendingRequests } from "@/lib/stats";
import { acceptFriend } from "../perfil/actions";
import AddFriendForm from "./AddFriendForm";

export const dynamic = "force-dynamic";

export default async function Amigos() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/amigos");

  const [profile, friends, pending] = await Promise.all([
    getProfile(user.id),
    listFriends(user.id),
    pendingRequests(user.id),
  ]);

  if (!profile?.username) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="font-display text-3xl font-bold uppercase">Amigos</h1>
        <p className="text-sm text-muted">
          Antes necesitas un nombre para que puedan encontrarte.
        </p>
        <Link href="/perfil" className="text-accent hover:underline text-sm">
          Ponerme un nombre →
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide">Amigos</h1>

      <div className="panel rounded-sm p-4 flex flex-col gap-2">
        <p className="text-sm text-muted">
          Tu nombre es <strong className="text-foreground">{profile.username}</strong>.
          Pásaselo a quien quieras que te añada.
        </p>
        <AddFriendForm />
      </div>

      {pending.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-display text-sm uppercase tracking-[0.2em] text-muted">
            Peticiones
          </h2>
          {pending.map((p) => (
            <form
              key={p.user_id}
              action={acceptFriend}
              className="panel rounded-sm flex items-center gap-3 px-3 py-2"
            >
              <input type="hidden" name="requesterId" value={p.user_id} />
              <span className="flex-1">{p.profiles?.username ?? "alguien"}</span>
              <button className="rounded-sm bg-accent text-white px-3 py-1.5 text-sm font-display uppercase hover:brightness-110">
                Aceptar
              </button>
            </form>
          ))}
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-sm uppercase tracking-[0.2em] text-muted">
          Tus amigos ({friends.length})
        </h2>
        {friends.length === 0 ? (
          <p className="text-sm text-muted">Todavía no has añadido a nadie.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {friends.map((f) => (
              <li key={f.id} className="panel rounded-sm px-3 py-2">
                {f.username}
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link href="/ranking?scope=amigos" className="text-accent hover:underline text-sm">
        Ver ranking entre amigos →
      </Link>
    </div>
  );
}
