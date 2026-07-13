// Refresco de sesión de Supabase.
//
// OJO: en Next.js 16 el Middleware pasó a llamarse "Proxy" (proxy.ts). La guía
// oficial de Supabase todavía dice middleware.ts — aquí NO funcionaría.

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresca el token si caducó (hay que llamarlo para que se renueve la cookie).
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    // Todo menos estáticos y las fotos (que se piden mucho y no necesitan sesión).
    "/((?!_next/static|_next/image|favicon.ico|api/img|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)",
  ],
};
