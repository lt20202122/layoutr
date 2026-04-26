-- Credits on user_profiles table
create table user_profiles (
  id        uuid primary key references auth.users(id) on delete cascade,
  credits   integer not null default 2000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- LLM API Keys
create table llm_api_keys (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  provider   text not null, -- 'anthropic' | 'openai' | 'google' | 'groq'
  key_hash   text not null,
  key_prefix text not null,
  created_at timestamptz default now()
);

-- Design System
create table design_system (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  tokens     jsonb not null default '{}',
  updated_at timestamptz default now()
);

-- Wireframe Blocks
create table wireframe_blocks (
  id         uuid primary key default gen_random_uuid(),
  node_id    uuid not null references sitemap_nodes(id) on delete cascade,
  type       text not null,
  order_index integer not null default 0,
  props      jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index llm_api_keys_user_id_idx on llm_api_keys(user_id);
create index llm_api_keys_provider_idx on llm_api_keys(provider);
create index design_system_project_id_idx on design_system(project_id);
create index wireframe_blocks_node_id_idx on wireframe_blocks(node_id);

-- Updated at trigger for wireframe_blocks
create trigger wireframe_blocks_updated_at
  before update on wireframe_blocks
  for each row execute function set_updated_at();

-- Row Level Security
alter table user_profiles enable row level security;
alter table llm_api_keys enable row level security;
alter table design_system enable row level security;
alter table wireframe_blocks enable row level security;

-- user_profiles RLS
create policy "users can view their own profile"
  on user_profiles for select
  using (auth.uid() = id);

create policy "users can insert their own profile"
  on user_profiles for insert
  with check (auth.uid() = id);

create policy "users can update their own profile"
  on user_profiles for update
  using (auth.uid() = id);

-- llm_api_keys RLS
create policy "users can manage their own llm api keys"
  on llm_api_keys for all
  using (auth.uid() = user_id);

-- design_system RLS (through project ownership)
create policy "users can view design systems in their projects"
  on design_system for select
  using (
    exists (
      select 1 from projects
      where projects.id = design_system.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "users can manage design systems in their projects"
  on design_system for all
  using (
    exists (
      select 1 from projects
      where projects.id = design_system.project_id
      and projects.user_id = auth.uid()
    )
  );

-- wireframe_blocks RLS (through sitemap_nodes -> projects ownership)
create policy "users can view wireframe blocks in their projects"
  on wireframe_blocks for select
  using (
    exists (
      select 1 from sitemap_nodes
      join projects on projects.id = sitemap_nodes.project_id
      where sitemap_nodes.id = wireframe_blocks.node_id
      and projects.user_id = auth.uid()
    )
  );

create policy "users can manage wireframe blocks in their projects"
  on wireframe_blocks for all
  using (
    exists (
      select 1 from sitemap_nodes
      join projects on projects.id = sitemap_nodes.project_id
      where sitemap_nodes.id = wireframe_blocks.node_id
      and projects.user_id = auth.uid()
    )
  );

-- Trigger to create user_profiles on user signup
create or replace function create_user_profile()
returns trigger as $$
begin
  insert into user_profiles (id, credits)
  values (new.id, 2000);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function create_user_profile();
