import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnv, getSupabasePublicEnvOrNull } from "./env";

export function createClient() {
  const { url, anonKey } = getSupabasePublicEnv();

  return createBrowserClient(
    url,
    anonKey
  );
}

export function createClientOrNull() {
  const env = getSupabasePublicEnvOrNull();
  if (!env) return null;

  return createBrowserClient(
    env.url,
    env.anonKey
  );
}
