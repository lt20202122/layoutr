const REQUIRED_SUPABASE_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

type SupabasePublicEnv = {
  url: string;
  anonKey: string;
};

export function getSupabasePublicEnvOrNull(): SupabasePublicEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function getSupabasePublicEnv(): SupabasePublicEnv {
  const env = getSupabasePublicEnvOrNull();

  if (!env) {
    throw new Error(
      `Missing Supabase environment variables: ${REQUIRED_SUPABASE_ENV_VARS.filter((name) => !process.env[name]).join(", ")}`
    );
  }

  return env;
}

export function hasSupabasePublicEnv() {
  return REQUIRED_SUPABASE_ENV_VARS.every((name) => Boolean(process.env[name]));
}
