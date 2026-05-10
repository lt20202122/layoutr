export type LaunchAttribution = {
  landingPath: string;
  referrerHost: string;
  sourceLabel: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
};

export type RequestContext = {
  countryCode: string;
  regionCode: string;
  locale: string;
  deviceType: string;
  browserFamily: string;
  osFamily: string;
};

type PartialAttribution = Partial<LaunchAttribution>;

function clamp(value: string, maxLength: number) {
  return value.slice(0, maxLength);
}

export function normalizeTrackingValue(value: unknown, maxLength = 120) {
  if (typeof value !== "string") return "";

  return clamp(value.trim().toLowerCase(), maxLength);
}

export function normalizeFreeText(value: unknown, maxLength = 240) {
  if (typeof value !== "string") return "";

  return clamp(value.trim(), maxLength);
}

export function normalizePath(value: unknown) {
  if (typeof value !== "string" || value.trim() === "") return "/";

  const trimmed = value.trim();
  return trimmed.startsWith("/") ? clamp(trimmed, 240) : clamp(`/${trimmed}`, 240);
}

export function getReferrerHost(referrer: unknown) {
  if (typeof referrer !== "string" || referrer.trim() === "") return "";

  try {
    return clamp(new URL(referrer).hostname.toLowerCase(), 120);
  } catch {
    return "";
  }
}

export function inferSourceLabel(values: PartialAttribution) {
  if (values.utmSource) return values.utmSource;
  if (values.referrerHost) return values.referrerHost;
  return "direct";
}

export function parseAttributionFromUrl(url: URL, referrer?: string | null): LaunchAttribution {
  const utmSource = normalizeTrackingValue(url.searchParams.get("utm_source"));
  const utmMedium = normalizeTrackingValue(url.searchParams.get("utm_medium"));
  const utmCampaign = normalizeTrackingValue(url.searchParams.get("utm_campaign"));
  const utmContent = normalizeTrackingValue(url.searchParams.get("utm_content"));
  const utmTerm = normalizeTrackingValue(url.searchParams.get("utm_term"));
  const referrerHost = getReferrerHost(referrer ?? "");
  const landingPath = normalizePath(url.pathname);

  return {
    landingPath,
    referrerHost,
    sourceLabel: inferSourceLabel({ utmSource, referrerHost }),
    utmSource,
    utmMedium,
    utmCampaign,
    utmContent,
    utmTerm,
  };
}

export function mergeAttribution(base: LaunchAttribution, override: PartialAttribution): LaunchAttribution {
  const next = {
    landingPath: normalizePath(override.landingPath ?? base.landingPath),
    referrerHost: normalizeTrackingValue(override.referrerHost ?? base.referrerHost),
    utmSource: normalizeTrackingValue(override.utmSource ?? base.utmSource),
    utmMedium: normalizeTrackingValue(override.utmMedium ?? base.utmMedium),
    utmCampaign: normalizeTrackingValue(override.utmCampaign ?? base.utmCampaign),
    utmContent: normalizeTrackingValue(override.utmContent ?? base.utmContent),
    utmTerm: normalizeTrackingValue(override.utmTerm ?? base.utmTerm),
    sourceLabel: "",
  };

  next.sourceLabel =
    normalizeTrackingValue(override.sourceLabel ?? inferSourceLabel(next), 120) || inferSourceLabel(next);

  return next;
}

export function getPrimaryLocale(value: string | null) {
  if (!value) return "";

  return normalizeTrackingValue(value.split(",")[0]?.split(";")[0] ?? "", 40);
}

export function getDeviceType(userAgent: string) {
  const ua = userAgent.toLowerCase();
  if (!ua) return "";
  if (ua.includes("tablet") || ua.includes("ipad")) return "tablet";
  if (ua.includes("mobi") || ua.includes("iphone") || ua.includes("android")) return "mobile";
  return "desktop";
}

export function getBrowserFamily(userAgent: string) {
  const ua = userAgent.toLowerCase();
  if (!ua) return "";
  if (ua.includes("edg/")) return "edge";
  if (ua.includes("opr/") || ua.includes("opera")) return "opera";
  if (ua.includes("chrome/")) return "chrome";
  if (ua.includes("firefox/")) return "firefox";
  if (ua.includes("safari/") && !ua.includes("chrome/")) return "safari";
  return "other";
}

export function getOsFamily(userAgent: string) {
  const ua = userAgent.toLowerCase();
  if (!ua) return "";
  if (ua.includes("windows")) return "windows";
  if (ua.includes("mac os") || ua.includes("macintosh")) return "macos";
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ios")) return "ios";
  if (ua.includes("android")) return "android";
  if (ua.includes("linux")) return "linux";
  return "other";
}

export function getRequestContext(headers: Headers): RequestContext {
  const userAgent = headers.get("user-agent") ?? "";

  return {
    countryCode: normalizeTrackingValue(headers.get("x-vercel-ip-country"), 8),
    regionCode: normalizeTrackingValue(headers.get("x-vercel-ip-country-region"), 16),
    locale: getPrimaryLocale(headers.get("accept-language")),
    deviceType: getDeviceType(userAgent),
    browserFamily: getBrowserFamily(userAgent),
    osFamily: getOsFamily(userAgent),
  };
}
