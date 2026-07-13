// Cliente Supabase para Server Components / Route Handlers / Server Actions.
// Usa la clave PÚBLICA y las cookies de sesión: representa AL USUARIO que navega
// (no confundir con lib/supabase.ts, que usa la secret key y salta RLS).

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function createSupabaseServer() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Llamado desde un Server Component: las cookies las refresca proxy.ts.
          }
        },
      },
    }
  );
}
