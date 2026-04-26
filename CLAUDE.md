# Layoutr — Claude Code Context

**Layoutr** is an AI-native sitemap and wireframe builder. It is built API/MCP-first, targeting AI coding agents (Claude Code, Codex, Cline, Kilo Code, opencode) as the primary power users.

Live: https://layoutr-xi.vercel.app

---

## Monorepo structure

```
layoutr/
├── apps/
│   └── web/                  Next.js 15 App Router (main product)
├── packages/
│   ├── mcp-server/           @layoutr/mcp-server — MCP server (18 tools)
│   ├── cli/                  @layoutr/cli — npx layoutr init
│   └── shared/               Shared types (future)
├── supabase/
│   └── migrations/           001_initial_schema, 002_credits_design, 003_llm_api_keys_encrypted
└── turbo.json                Turborepo config
```

## Tech stack

- **Framework**: Next.js 15 App Router, TypeScript, Tailwind CSS
- **Auth & DB**: Supabase (Postgres + Auth + RLS)
- **AI SDK**: Vercel AI SDK (`ai`, `@ai-sdk/anthropic`, `@ai-sdk/openai`, `@ai-sdk/google`, `@ai-sdk/groq`)
- **MCP**: `@modelcontextprotocol/sdk` with StdioServerTransport
- **Deployment**: Vercel (monorepo, `apps/web` root)
- **Package manager**: npm workspaces + Turborepo

---

## Architecture: two layers

### Layer 1 — Direct CRUD via API/MCP (free, no credits)
REST API and MCP server. AI agents call these directly to build/read/update project data without ever hitting an LLM through Layoutr.

### Layer 2 — Integrated AI (`/api/ai/generate`, `ai_generate` MCP tool)
Users/agents can ask Layoutr's built-in AI to generate or modify sitemaps and wireframes from natural language. This costs credits (or uses BYOK keys).

---

## Authentication

- **Session-based** (Supabase SSR, cookie-managed) for UI pages
- **API key auth** (`Authorization: Bearer ltr_...`) for REST/MCP — keys stored in `api_keys` table
- **Dev bypass**: set `NEXT_PUBLIC_DEV_BYPASS=true` + `DEV_USER_ID=<uuid>` to skip auth in all routes

### Supabase clients
- `createClient()` — session-based, for server components only
- `createServiceClient()` — plain `@supabase/supabase-js` with service role key, **bypasses RLS**, used in all API routes

---

## Database tables (Supabase)

| Table | Purpose |
|-------|---------|
| `projects` | User projects |
| `sitemap_nodes` | Flat tree of pages/sections/folders/links/modals/components |
| `wireframe_blocks` | Ordered blocks per sitemap node (Navbar, Hero, Cards, etc.) |
| `design_system` | Design tokens per project (colors, typography, spacing) |
| `api_keys` | REST API keys (`ltr_...` prefix) for MCP/CLI access |
| `llm_api_keys` | BYOK LLM keys — AES-256-GCM encrypted (`key_ciphertext`, `key_iv`) |
| `user_profiles` | Credit balance (default 100 free credits per user) |

---

## Credit system

| Tier | Models | Cost |
|------|--------|------|
| 🟢 Green | claude-haiku-3-5, gpt-4o-mini, gemini-2-0-flash | 5 credits |
| 🟡 Yellow | claude-sonnet-3-7 | 15 credits |
| 🔴 Red | (reserved) | 40 credits |

- 1 credit ≈ $0.001
- BYOK users: zero credits deducted
- Default provider keys (env vars) used when user has no BYOK key

---

## BYOK (Bring Your Own Key)

Users store encrypted LLM keys via Settings → LLM Keys. Keys are AES-256-GCM encrypted at rest. Encryption key: `LLM_ENCRYPTION_KEY` env var (SHA-256 derived). When a BYOK key is present for the selected provider, it is decrypted and passed directly to the provider factory — no credits deducted.

---

## API routes (`apps/web/src/app/api/`)

```
POST   /api/projects                          Create project
GET    /api/projects                          List projects
GET    /api/projects/[projectId]              Get project
PATCH  /api/projects/[projectId]              Update project
DELETE /api/projects/[projectId]              Delete project

GET    /api/projects/[projectId]/sitemaps     Get all sitemap nodes
POST   /api/projects/[projectId]/sitemaps     Create sitemap node
PATCH  /api/projects/[projectId]/sitemaps/[nodeId]   Update node
DELETE /api/projects/[projectId]/sitemaps/[nodeId]   Delete node

GET    /api/projects/[projectId]/wireframes/[nodeId]         Get blocks
POST   /api/projects/[projectId]/wireframes/[nodeId]         Add block
PATCH  /api/projects/[projectId]/wireframes/[nodeId]/[blockId]  Update block
DELETE /api/projects/[projectId]/wireframes/[nodeId]/[blockId]  Delete block

GET    /api/projects/[projectId]/design-system  Get design tokens
PUT    /api/projects/[projectId]/design-system  Update design tokens

POST   /api/ai/generate                       AI generate sitemap/wireframe (costs credits)
GET    /api/ai/keys                           List BYOK LLM keys
POST   /api/ai/keys                           Add/replace BYOK key
DELETE /api/ai/keys/[keyId]                   Remove BYOK key

GET    /api/keys                              List API keys
POST   /api/keys                              Create API key
DELETE /api/keys/[keyId]                      Revoke API key

GET    /api/users/me                          Get profile + credits
DELETE /api/users/me                          Delete account
GET    /api/users/me/credits                  Get credit balance
```

All REST endpoints require `Authorization: Bearer <api-key>` or a valid session cookie.

---

## MCP server (`packages/mcp-server`)

Package: `@layoutr/mcp-server` (not yet published to npm)
Version: 0.2.0

### 18 tools

**Projects**
- `list_projects` — List all projects
- `create_project` — Create a project
- `get_project` — Get a project by ID
- `update_project` — Update name/description
- `delete_project` — Delete project + all nodes

**Sitemap**
- `get_sitemap` — Get all nodes (flat list, use parent_id for tree)
- `create_node` — Add a sitemap node
- `update_node` — Update node properties
- `move_node` — Reparent a node
- `delete_node` — Delete node + children
- `scaffold_sitemap` — Bulk-create a full sitemap from natural language

**AI**
- `ai_generate` — Generate/update sitemap or wireframe via integrated AI (costs credits)

**Wireframe**
- `get_wireframe` — Get blocks for a node
- `create_block` — Add a block to a node
- `update_block` — Update a block
- `delete_block` — Remove a block

**Design System**
- `get_design_system` — Fetch design tokens
- `update_design_system` — Update tokens

### Setup (Claude Code)

```json
{
  "mcpServers": {
    "layoutr": {
      "command": "npx",
      "args": ["@layoutr/mcp-server", "--api-key", "ltr_YOUR_API_KEY"]
    }
  }
}
```

Add to `~/.claude.json` (global) or `.claude/settings.json` (project-scoped).

---

## CLI (`packages/cli`)

Package: `@layoutr/cli` (not yet published to npm)

```bash
npx layoutr init
```

Detects which AI coding tools are installed and injects the MCP config block automatically. Supports: Claude Code, Codex, Cline, Kilo Code, opencode.

---

## Environment variables

### Required (Vercel + local)
| Var | Purpose |
|-----|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server only, bypasses RLS) |
| `LLM_ENCRYPTION_KEY` | Secret for AES-256-GCM BYOK key encryption |

### Dev mode
| Var | Purpose |
|-----|---------|
| `NEXT_PUBLIC_DEV_BYPASS` | Set to `true` to skip auth |
| `DEV_USER_ID` | UUID of dev user to impersonate |

### Default LLM providers (needed for non-BYOK users)
| Var | Purpose |
|-----|---------|
| `ANTHROPIC_API_KEY` | Default Anthropic key (`sk-ant-...`) |
| `OPENAI_API_KEY` | Default OpenAI key (`sk-...`) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Default Google key (`AIza...`) |
| `GROQ_API_KEY` | Default Groq key (`gsk_...`) |

> **Note**: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `GROQ_API_KEY` are **not yet set on Vercel**. Without them, non-BYOK users will get a 502 error when calling `/api/ai/generate`.

---

## Current status

### Done ✅
- Supabase auth (email + Google OAuth)
- Project CRUD with RLS (service role bypass in API routes)
- Sitemap editor — visual canvas, drag-and-drop, node types, collapsible tree
- Wireframe editor — pannable/zoomable canvas, 9 block types, props panel
- Design system tokens per project
- Credit system (100 free, per-model costs, live balance in header)
- BYOK LLM key storage (AES-256-GCM encrypted)
- `/api/ai/generate` — integrated AI for sitemap + wireframe generation
- MCP server (18 tools) with StdioServerTransport
- `npx layoutr init` CLI
- Dev mode bypass (no login required in development)
- Docs page with correct config snippets for all 5 target tools
- TypeScript clean (0 errors across all 3 packages)

### Pending ⏳
- Add default provider API keys to Vercel (`ANTHROPIC_API_KEY` etc.)
- Publish `@layoutr/mcp-server` to npm
- Publish `@layoutr/cli` to npm
- OpenAPI spec at `/api/openapi.json`
- Disable dev bypass before public launch (`NEXT_PUBLIC_DEV_BYPASS=false`)
- Stripe credit top-up flow
- User onboarding / empty states

---

## Key files

| File | Purpose |
|------|---------|
| `apps/web/src/lib/supabase/server.ts` | `createClient()` + `createServiceClient()` |
| `apps/web/src/lib/api.ts` | `authenticate()`, `ok()`, `err()` helpers |
| `apps/web/src/lib/crypto.ts` | AES-256-GCM `encryptKey()` / `decryptKey()` |
| `apps/web/src/app/api/ai/generate/route.ts` | AI generation endpoint |
| `apps/web/src/components/sitemap/SitemapEditor.tsx` | Visual sitemap canvas |
| `apps/web/src/components/sitemap/AiPanel.tsx` | AI chat panel (model picker, credits) |
| `apps/web/src/components/wireframe/WireframeEditor.tsx` | Wireframe canvas |
| `apps/web/src/components/wireframe/BlockLibrary.tsx` | 9 wireframe block types |
| `packages/mcp-server/src/index.ts` | MCP server + 18 tools |
| `packages/cli/src/index.ts` | `npx layoutr init` CLI |
| `supabase/migrations/` | 3 migrations (schema, credits+design, encrypted keys) |
