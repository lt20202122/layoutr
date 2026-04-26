# Layoutr — Tasks for Qwen3

These are mechanical, well-defined tasks. Each one is self-contained.

---

## 1. Database Migrations

Add the following columns/tables via a new SQL migration file at `supabase/migrations/002_credits_design.sql`:

- Add `credits INTEGER NOT NULL DEFAULT 100` to the `auth.users` profile or a new `user_profiles` table
- Create `llm_api_keys` table:
  ```sql
  CREATE TABLE llm_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, -- 'anthropic' | 'openai' | 'google' | 'groq'
    key_hash TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
  );
  ```
- Create `design_system` table:
  ```sql
  CREATE TABLE design_system (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    tokens JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT now()
  );
  ```
- Create `wireframe_blocks` table:
  ```sql
  CREATE TABLE wireframe_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id UUID NOT NULL REFERENCES sitemap_nodes(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    props JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  );
  ```
- Enable RLS on all new tables
- Add updated_at triggers (copy pattern from existing migration)

---

## 2. GET /api/users/me/credits

Create `apps/web/src/app/api/users/me/credits/route.ts`:

- Authenticate the request via `authenticate()` from `@/lib/api`
- Query `user_profiles` for `credits` where `user_id = auth.userId`
- Return `{ credits: number }`

---

## 3. GET /api/projects/:id/design and PATCH /api/projects/:id/design

Create `apps/web/src/app/api/projects/[projectId]/design/route.ts`:

- `GET` — fetch the design system row for the project, return it (or empty tokens `{}` if none)
- `PATCH` — upsert the design system row with the provided `tokens` object
- Use `createServiceClient()` from `@/lib/supabase/server`
- Authenticate + verify project ownership (copy pattern from existing routes)

---

## 4. Credit Balance in Header

In `apps/web/src/app/(dashboard)/layout.tsx`:

- Fetch the user's credit balance server-side alongside the existing `getUser()` call
- Display it in the header next to the user email, e.g. `⚡ 94 credits`
- Style: small, muted text, same row as the email

---

## 5. Per-Tool Setup Snippets for /docs

Create `apps/web/src/app/docs/page.tsx` (new page, no auth required):

- Simple static page with sections for each tool
- Each section has a heading, a short description, and a code block with the copy-paste config
- Tools to cover: **Claude Code**, **Codex**, **Cline**, **Kilo Code**, **opencode**
- Use the config snippets from the project's existing documentation

---

## 6. Settings Page — BYOK Key Manager UI

In `apps/web/src/app/(dashboard)/settings/page.tsx` and a new `LLMKeysManager` component:

- Add a section "AI Provider Keys" below the existing API Keys section
- List providers: Anthropic, OpenAI, Google, Groq
- Each row: provider name, masked key if set (e.g. `sk-ant-••••••••`), Add/Remove button
- On Add: modal with a password input for the key, POST to `/api/ai/keys`
- On Remove: DELETE to `/api/ai/keys/:id`
- No key is ever shown after saving — only the prefix

---

## 7. Delete Account

In `apps/web/src/app/(dashboard)/settings/page.tsx`:

- Add a "Danger Zone" section at the bottom
- "Delete account" button → confirmation modal ("Type DELETE to confirm")
- On confirm: call `supabase.auth.admin.deleteUser()` via a new `DELETE /api/users/me` route
- Sign out and redirect to `/` after deletion
