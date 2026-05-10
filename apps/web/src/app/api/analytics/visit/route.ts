import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, err } from "@/lib/api";
import { appendAnalyticsSheetRow } from "@/lib/analytics-sheet";
import { createServiceClient } from "@/lib/supabase/server";
import {
  getRequestContext,
  mergeAttribution,
  normalizePath,
  parseAttributionFromUrl,
} from "@/lib/launch-tracking";

const payloadSchema = z.object({
  path: z.string().optional(),
  referrer: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmContent: z.string().optional(),
  utmTerm: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const parsed = payloadSchema.safeParse(body);

  if (!parsed.success) return err("Invalid tracking payload", 400);

  const requestUrl = new URL(request.url);
  const baseAttribution = parseAttributionFromUrl(
    requestUrl,
    parsed.data.referrer ?? request.headers.get("referer")
  );
  const attribution = mergeAttribution(baseAttribution, {
    landingPath: parsed.data.path ? normalizePath(parsed.data.path) : baseAttribution.landingPath,
    referrerHost: parsed.data.referrer,
    utmSource: parsed.data.utmSource,
    utmMedium: parsed.data.utmMedium,
    utmCampaign: parsed.data.utmCampaign,
    utmContent: parsed.data.utmContent,
    utmTerm: parsed.data.utmTerm,
  });
  const requestContext = getRequestContext(request.headers);

  const supabase = createServiceClient();

  const { error: rpcError } = await supabase.rpc("increment_launch_daily_visitors", {
    p_path: attribution.landingPath,
    p_country_code: requestContext.countryCode,
    p_region_code: requestContext.regionCode,
    p_locale: requestContext.locale,
    p_device_type: requestContext.deviceType,
    p_browser_family: requestContext.browserFamily,
    p_os_family: requestContext.osFamily,
    p_source_label: attribution.sourceLabel,
    p_utm_source: attribution.utmSource,
    p_utm_medium: attribution.utmMedium,
    p_utm_campaign: attribution.utmCampaign,
    p_utm_content: attribution.utmContent,
    p_utm_term: attribution.utmTerm,
    p_referrer_host: attribution.referrerHost,
  });

  if (rpcError) return err("Failed to track visit", 500);

  await appendAnalyticsSheetRow("visitor_events", {
    captured_at: new Date().toISOString(),
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
    visit_type: "page_view",
  });

  return ok({ tracked: true });
}
