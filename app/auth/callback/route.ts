// Callback de OAuth (Google): cambia el code por una sesión y entra.

import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createSupabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Pasa por bienvenida: si no hay nombre (típico en Google), lo pone ahí;
      // si ya lo tiene, bienvenida reenvía a `next`.
      return NextResponse.redirect(
        `${origin}/bienvenida?next=${encodeURIComponent(next)}`
      );
    }
  }

  return NextResponse.redirect(`${origin}/login?error=1`);
}
