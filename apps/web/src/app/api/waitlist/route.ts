import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, err, authenticate } from "@/lib/api";
import { appendAnalyticsSheetRow } from "@/lib/analytics-sheet";
import {
  getRequestContext,
  mergeAttribution,
  normalizeFreeText,
  normalizePath,
  normalizeTrackingValue,
  parseAttributionFromUrl,
} from "@/lib/launch-tracking";
import { createServiceClient } from "@/lib/supabase/server";

const payloadSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().optional(),
  company: z.string().optional(),
  role: z.string().optional(),
  useCase: z.string().optional(),
  teamSize: z.string().optional(),
  signupPath: z.string().optional(),
  landingPath: z.string().optional(),
  referrer: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmContent: z.string().optional(),
  utmTerm: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  const body = await request.json().catch(() => ({}));
  const parsed = payloadSchema.safeParse(body);

  if (!parsed.success) return err("Invalid waitlist payload", 400);

  const supabase = createServiceClient();
  let email = normalizeTrackingValue(parsed.data.email, 240);
  const userId = auth?.userId ?? null;

  if (auth?.userId) {
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(auth.userId);
    if (userError) return err("Could not fetch user email", 500);
    if (!email) {
      email = normalizeTrackingValue(userData?.user?.email, 240);
    }
  }

  if (!email) return err("Email is required", 400);

  const requestUrl = new URL(request.url);
  const baseAttribution = parseAttributionFromUrl(
    requestUrl,
    parsed.data.referrer ?? request.headers.get("referer")
  );
  const attribution = mergeAttribution(baseAttribution, {
    landingPath: parsed.data.landingPath,
    referrerHost: parsed.data.referrer,
    utmSource: parsed.data.utmSource,
    utmMedium: parsed.data.utmMedium,
    utmCampaign: parsed.data.utmCampaign,
    utmContent: parsed.data.utmContent,
    utmTerm: parsed.data.utmTerm,
  });
  const requestContext = getRequestContext(request.headers);

  const row = {
    ...(userId ? { user_id: userId } : {}),
    email,
    name: normalizeFreeText(parsed.data.name, 120),
    company: normalizeFreeText(parsed.data.company, 120),
    role: normalizeFreeText(parsed.data.role, 120),
    use_case: normalizeFreeText(parsed.data.useCase, 1000),
    team_size: normalizeFreeText(parsed.data.teamSize, 40),
    signup_path: normalizePath(parsed.data.signupPath ?? attribution.landingPath),
    landing_path: attribution.landingPath,
    referrer_host: attribution.referrerHost,
    country_code: requestContext.countryCode,
    region_code: requestContext.regionCode,
    locale: requestContext.locale,
    device_type: requestContext.deviceType,
    browser_family: requestContext.browserFamily,
    os_family: requestContext.osFamily,
    source_label: attribution.sourceLabel,
    utm_source: attribution.utmSource,
    utm_medium: attribution.utmMedium,
    utm_campaign: attribution.utmCampaign,
    utm_content: attribution.utmContent,
    utm_term: attribution.utmTerm,
    raw_context: {
      captured_at: new Date().toISOString(),
      auth_state: auth ? "authenticated" : "public",
    },
  };

  const { error: insertError } = await supabase
    .from("waitlist")
    .upsert(row, { onConflict: "email", ignoreDuplicates: false });

  if (insertError) {
    return err("Failed to join waitlist", 500);
  }

  await appendAnalyticsSheetRow("waitlist_signups", {
    captured_at: new Date().toISOString(),
    email: row.email,
    name: row.name,
    company: row.company,
    role: row.role,
    use_case: row.use_case,
    team_size: row.team_size,
    signup_path: row.signup_path,
    landing_path: row.landing_path,
    referrer_host: row.referrer_host,
    country_code: row.country_code,
    region_code: row.region_code,
    locale: row.locale,
    device_type: row.device_type,
    browser_family: row.browser_family,
    os_family: row.os_family,
    source_label: row.source_label,
    utm_source: row.utm_source,
    utm_medium: row.utm_medium,
    utm_campaign: row.utm_campaign,
    utm_content: row.utm_content,
    utm_term: row.utm_term,
    auth_state: auth ? "authenticated" : "public",
  });

  return ok({ joined: true });
}
