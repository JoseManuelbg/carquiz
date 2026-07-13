"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();

  return (
    <button
      onClick={async () => {
        await createSupabaseBrowser().auth.signOut();
        router.push("/");
        router.refresh();
      }}
      className="text-muted hover:text-foreground transition-colors"
      title="Cerrar sesión"
    >
      Salir
    </button>
  );
}
