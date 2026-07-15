"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { useT } from "./I18nProvider";

export default function SignOutButton() {
  const router = useRouter();
  const { t } = useT();

  return (
    <button
      onClick={async () => {
        await createSupabaseBrowser().auth.signOut();
        router.push("/");
        router.refresh();
      }}
      className="text-muted hover:text-foreground transition-colors"
    >
      {t("nav.logout")}
    </button>
  );
}
