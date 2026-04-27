create table public.waitlist (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  email       text not null,
  created_at  timestamptz not null default now()
);

create unique index waitlist_user_id_idx on public.waitlist (user_id)
  where user_id is not null;
create unique index waitlist_email_idx on public.waitlist (email);
