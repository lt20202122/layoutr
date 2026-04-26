-- Drop existing llm_api_keys table (from migration 002) and recreate
-- with AES-256-GCM encrypted storage.
-- key_ciphertext: base64-encoded AES-256-GCM ciphertext
-- key_iv: base64-encoded 12-byte IV (unique per key)
-- key_prefix: plaintext prefix for display only (e.g. "sk-ant-••••")

drop table if exists llm_api_keys;

create table llm_api_keys (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  provider       text not null, -- 'anthropic' | 'openai' | 'google' | 'groq'
  key_ciphertext text not null, -- AES-256-GCM encrypted, base64
  key_iv         text not null, -- base64-encoded 12-byte IV
  key_prefix     text not null, -- first 8 chars of raw key, for display
  created_at     timestamptz not null default now(),
  unique(user_id, provider)     -- one key per provider per user
);

create index llm_api_keys_user_id_idx on llm_api_keys(user_id);
create index llm_api_keys_provider_idx on llm_api_keys(provider);

-- Row Level Security
alter table llm_api_keys enable row level security;

create policy "users can manage their own llm api keys"
  on llm_api_keys for all
  using (auth.uid() = user_id);
