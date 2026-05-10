# Launch Tracking

## UTM naming format

- `utm_source`: exact publisher or platform in lowercase, for example `x`, `linkedin`, `producthunt`, `reddit`, `github`
- `utm_medium`: channel bucket in lowercase, for example `organic-social`, `paid-social`, `community`, `email`, `partner`, `referral`, `direct`
- `utm_campaign`: `launch_YYYYMM_topic`, for example `launch_202605_waitlist`
- `utm_content`: creative or placement, for example `hero_cta`, `post_a`, `comment_1`
- `utm_term`: optional audience or keyword, for example `founders`, `ai-agents`

## Where sources are logged

- Supabase `waitlist` table: one row per signup with lead fields and attribution
- Supabase `launch_daily_visitors` table: one row per day per attribution bucket
- Google Sheet `waitlist_signups` tab: one row per signup
- Google Sheet `visitor_events` tab: one row per tracked visit

Google Sheets writes are sent through `GOOGLE_SHEETS_WEBHOOK_URL`. The webhook is expected to append rows into the correct tab.

## Waitlist fields

- `email`
- `name`
- `company`
- `role`
- `use_case`
- `team_size`
- `signup_path`
- `landing_path`
- `referrer_host`
- `country_code`
- `region_code`
- `locale`
- `device_type`
- `browser_family`
- `os_family`
- `source_label`
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_content`
- `utm_term`
- `created_at`

## Consent boundary

Banner-free tracking here means:

- no cookies
- no `localStorage`
- no `sessionStorage`
- no fingerprinting
- no cross-visit identifier

Specificity comes from server-side request context instead:

- UTMs
- landing path
- signup path
- referrer host
- country and region from edge headers
- primary locale from `Accept-Language`
- coarse device, browser, and OS family from the request user agent

What you cannot know without consent-based storage is whether two visits came from the same anonymous person. So this setup gives you precise source attribution and campaign breakdowns, but not true returning-user counts.
