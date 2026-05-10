alter table public.waitlist
  add column if not exists name text,
  add column if not exists company text,
  add column if not exists role text,
  add column if not exists use_case text,
  add column if not exists team_size text,
  add column if not exists signup_path text,
  add column if not exists landing_path text,
  add column if not exists referrer_host text,
  add column if not exists country_code text,
  add column if not exists region_code text,
  add column if not exists locale text,
  add column if not exists device_type text,
  add column if not exists browser_family text,
  add column if not exists os_family text,
  add column if not exists source_label text not null default 'direct',
  add column if not exists utm_source text not null default '',
  add column if not exists utm_medium text not null default '',
  add column if not exists utm_campaign text not null default '',
  add column if not exists utm_content text not null default '',
  add column if not exists utm_term text not null default '',
  add column if not exists raw_context jsonb not null default '{}'::jsonb;

create table if not exists public.launch_daily_visitors (
  id uuid primary key default gen_random_uuid(),
  visit_date date not null,
  path text not null default '/',
  country_code text not null default '',
  region_code text not null default '',
  locale text not null default '',
  device_type text not null default '',
  browser_family text not null default '',
  os_family text not null default '',
  source_label text not null default 'direct',
  utm_source text not null default '',
  utm_medium text not null default '',
  utm_campaign text not null default '',
  utm_content text not null default '',
  utm_term text not null default '',
  referrer_host text not null default '',
  visits_total integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists launch_daily_visitors_bucket_idx
  on public.launch_daily_visitors (
    visit_date,
    path,
    country_code,
    region_code,
    locale,
    device_type,
    browser_family,
    os_family,
    source_label,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    utm_term,
    referrer_host
  );

create or replace function public.increment_launch_daily_visitors(
  p_path text,
  p_country_code text,
  p_region_code text,
  p_locale text,
  p_device_type text,
  p_browser_family text,
  p_os_family text,
  p_source_label text,
  p_utm_source text,
  p_utm_medium text,
  p_utm_campaign text,
  p_utm_content text,
  p_utm_term text,
  p_referrer_host text
) returns void
language plpgsql
security definer
as $$
begin
  insert into public.launch_daily_visitors (
    visit_date,
    path,
    country_code,
    region_code,
    locale,
    device_type,
    browser_family,
    os_family,
    source_label,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    utm_term,
    referrer_host,
    visits_total,
    new_visitors_total,
    returning_visitors_total,
    session_revisits_total
  )
  values (
    current_date,
    coalesce(nullif(p_path, ''), '/'),
    coalesce(p_country_code, ''),
    coalesce(p_region_code, ''),
    coalesce(p_locale, ''),
    coalesce(p_device_type, ''),
    coalesce(p_browser_family, ''),
    coalesce(p_os_family, ''),
    coalesce(nullif(p_source_label, ''), 'direct'),
    coalesce(p_utm_source, ''),
    coalesce(p_utm_medium, ''),
    coalesce(p_utm_campaign, ''),
    coalesce(p_utm_content, ''),
    coalesce(p_utm_term, ''),
    coalesce(p_referrer_host, ''),
    1
  )
  on conflict (
    visit_date,
    path,
    country_code,
    region_code,
    locale,
    device_type,
    browser_family,
    os_family,
    source_label,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    utm_term,
    referrer_host
  )
  do update
    set visits_total = public.launch_daily_visitors.visits_total + 1,
        updated_at = now();
end;
$$;
