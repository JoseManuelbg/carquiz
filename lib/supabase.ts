// Server-side Supabase client using the SECRET key.
//
// Bypasses RLS, so this must NEVER be imported from a Client Component. All the
// game tables have RLS enabled with no policies, meaning the public anon key
// can't read them — the answers are only reachable through this client.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY (revisa .env.local)"
    );
  }
  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}

export const PHOTO_BUCKET = process.env.SUPABASE_PHOTO_BUCKET ?? "car-photos";
