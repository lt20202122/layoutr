import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getSupabasePublicEnv, getSupabasePublicEnvOrNull } from "./env";

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> };

async function getCookieMethods() {
  const cookieStore = await cookies();
  return {
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet: CookieToSet[]) {
      try {
        cookiesToSet.forEach(({ name, value, options }) =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          cookieStore.set(name, value, options as any)
        );
      } catch {
        // Ignore – called from Server Component
      }
    },
  };
}

export async function createClient() {
  const { url, anonKey } = getSupabasePublicEnv();

  return createServerClient(
    url,
    anonKey,
    { cookies: await getCookieMethods() }
  );
}

export async function createClientOrNull() {
  const env = getSupabasePublicEnvOrNull();
  if (!env) return null;

  return createServerClient(
    env.url,
    env.anonKey,
    { cookies: await getCookieMethods() }
  );
}

// Service client uses plain supabase-js (no cookie/session management)
// so the service role key is used directly in PostgREST, bypassing RLS.
export function createServiceClient() {
  const { url } = getSupabasePublicEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error("Missing Supabase environment variable: SUPABASE_SERVICE_ROLE_KEY");
  }

  return createSupabaseClient(
    url,
    serviceRoleKey
  );
}
