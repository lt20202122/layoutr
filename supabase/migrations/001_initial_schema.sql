-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Enums
create type node_type as enum ('page', 'section', 'folder', 'link', 'modal', 'component');
create type node_status as enum ('draft', 'review', 'approved', 'live');

-- Projects
create table projects (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  description text,
  slug        text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique(user_id, slug)
);

-- Sitemap nodes
create table sitemap_nodes (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references projects(id) on delete cascade,
  parent_id   uuid references sitemap_nodes(id) on delete cascade,
  label       text not null,
  type        node_type not null default 'page',
  status      node_status not null default 'draft',
  order_index integer not null default 0,
  url_path    text,
  notes       text,
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- API Keys (for MCP/REST access)
create table api_keys (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  key_hash     text not null unique,
  key_prefix   text not null,
  created_at   timestamptz not null default now(),
  last_used_at timestamptz,
  expires_at   timestamptz
);

-- Indexes
create index sitemap_nodes_project_id_idx on sitemap_nodes(project_id);
create index sitemap_nodes_parent_id_idx on sitemap_nodes(parent_id);
create index projects_user_id_idx on projects(user_id);
create index api_keys_user_id_idx on api_keys(user_id);
create index api_keys_key_hash_idx on api_keys(key_hash);

-- Updated at trigger
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger projects_updated_at
  before update on projects
  for each row execute function set_updated_at();

create trigger sitemap_nodes_updated_at
  before update on sitemap_nodes
  for each row execute function set_updated_at();

-- Row Level Security
alter table projects enable row level security;
alter table sitemap_nodes enable row level security;
alter table api_keys enable row level security;

-- Projects RLS
create policy "users can manage their own projects"
  on projects for all
  using (auth.uid() = user_id);

-- Sitemap nodes RLS (through project ownership)
create policy "users can manage nodes in their projects"
  on sitemap_nodes for all
  using (
    exists (
      select 1 from projects
      where projects.id = sitemap_nodes.project_id
      and projects.user_id = auth.uid()
    )
  );

-- API keys RLS
create policy "users can manage their own api keys"
  on api_keys for all
  using (auth.uid() = user_id);
