const CALLBACK_PATH = "/auth/callback";

function trimTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function normalizeBaseUrl(value: string) {
  const withProtocol = value.startsWith("http://") || value.startsWith("https://") ? value : `https://${value}`;
  return trimTrailingSlash(withProtocol);
}

export function getConfiguredAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_VERCEL_URL?.trim() ||
    null
  );
}

export function getAppBaseUrl(origin?: string) {
  const baseUrl = origin || getConfiguredAppUrl();

  if (!baseUrl) {
    throw new Error("Missing base URL for Layoutr app");
  }

  return normalizeBaseUrl(baseUrl);
}

export function getAuthCallbackUrl(origin?: string) {
  return `${getAppBaseUrl(origin)}${CALLBACK_PATH}`;
}

export function getAuthErrorMessage(error: string | null, errorDescription?: string | null) {
  if (errorDescription) {
    return errorDescription;
  }

  switch (error) {
    case "auth_callback_failed":
      return "Google sign-in could not complete. Check your Supabase Google provider settings and allowed redirect URLs.";
    case "supabase_not_configured":
      return "Supabase auth is not configured in this environment.";
    default:
      return null;
  }
}

export function getAuthErrorMessageFromUrl(search: string, hash = "") {
  const searchParams = new URLSearchParams(search);
  const hashParams = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);

  return getAuthErrorMessage(
    searchParams.get("error") || hashParams.get("error"),
    hashParams.get("error_description")
  );
}
