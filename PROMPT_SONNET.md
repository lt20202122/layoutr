# Layoutr — Sonnet 4.6 Build Prompt

You are building features for **Layoutr**, an AI-native sitemap and wireframe builder. It is API-first and MCP-first, targeting AI coding agents (Claude Code, Codex, Cline, Kilo Code, opencode).

## Stack
- **Frontend/Backend**: Next.js 15 App Router, deployed on Vercel
- **Database**: Supabase (PostgreSQL + Auth)
- **Monorepo**: Turborepo with npm workspaces
- **Auth**: Supabase SSR with Google OAuth
- **API auth**: SHA-256 hashed API keys (prefix `ltr_`) + Supabase session
- **MCP**: `@modelcontextprotocol/sdk` with StdioServerTransport

## Key Files
- `apps/web/src/lib/api.ts` — `authenticate()`, `ok()`, `err()` helpers
- `apps/web/src/lib/supabase/server.ts` — `createClient()` (session-based), `createServiceClient()` (service role, bypasses RLS — use this in all API routes)
- `packages/mcp-server/src/index.ts` — existing MCP tools (11 tools for projects + sitemap nodes)
- `packages/mcp-server/src/client.ts` — HTTP client wrapping all REST API calls

## Architecture: Two Layers
1. **Direct API/MCP** — CRUD on projects, sitemap nodes, wireframes, design system. Free, no credits.
2. **Integrated AI** (`/api/ai/generate`) — accepts a natural language prompt, calls an LLM, and makes CRUD changes. Costs credits.

## Credit System
- 1 credit = $0.001
- New users get 100 credits (free)
- Credits are stored in `user_profiles.credits`
- Deduct credits before each AI call; reject with 402 if balance is 0
- If the user has a BYOK (bring-your-own-key) LLM key stored, use it instead and do NOT deduct credits

## Tasks to Implement

### 1. Integrated AI Endpoint — `POST /api/ai/generate`

**Request body:**
```json
{
  "prompt": "Build me a SaaS onboarding sitemap",
  "project_id": "uuid",
  "target": "sitemap" | "wireframe",
  "model": "claude-haiku-3-5" | "claude-sonnet-3-7" | "gpt-4o-mini" | "gemini-2-0-flash",
  "provider": "anthropic" | "openai" | "google" | "groq"
}
```

**Logic:**
1. Authenticate the request
2. Check if user has a BYOK key for the requested provider — if yes, use it (no credit deduction)
3. If no BYOK key, check credit balance — reject with 402 if insufficient
4. Estimate credit cost based on model tier (green=5, yellow=15, red=40 credits per call)
5. Call the LLM with a system prompt that includes:
   - The current project's sitemap/wireframe state (fetched from DB)
   - Instructions to respond with a JSON array of node operations (create/update/delete)
6. Parse the LLM response and apply the operations to the DB
7. Deduct credits if not BYOK
8. Return the updated nodes + credits remaining

**System prompt template for sitemap generation:**
> You are a sitemap architect. Given the user's request, return a JSON array of sitemap node operations to create or update. Each operation: `{ action: "create"|"update"|"delete", node: { label, type, parent_label?, url_path?, notes? } }`. Keep it practical and well-structured.

### 2. MCP Tools for AI + Wireframes

Add to `packages/mcp-server/src/index.ts`:

**New tools:**
- `ai_generate` — calls `POST /api/ai/generate`, takes `prompt`, `project_id`, `target`, optional `model`/`provider`
- `get_wireframe` — fetches all wireframe blocks for a node (`GET /api/projects/:id/wireframes/:nodeId`)
- `create_block` — adds a wireframe block to a node
- `update_block` — updates a block's props
- `delete_block` — removes a block
- `get_design_system` — fetches project design tokens
- `update_design_system` — patches design tokens

Add corresponding methods to `packages/mcp-server/src/client.ts`.

### 3. Publish `@layoutr/mcp-server` to npm

- Add `"publishConfig": { "access": "public" }` to `packages/mcp-server/package.json`
- Add a `prepublishOnly` script that runs `tsc`
- Make sure the shebang `#!/usr/bin/env node` is at the top of `dist/index.js` after build
- Add `"layoutr-mcp"` as the bin name (already present) and also `"layoutr"` as an alias
- Write the publish command: `npm publish --access public` from the `packages/mcp-server` directory

### 4. `npx layoutr init` CLI

Create `packages/cli/` with:
- `src/index.ts` — detects which agent config files exist on the user's machine and injects the MCP server config
- Detection paths:
  - Claude Code: `~/.claude.json` or `.claude/settings.json` in cwd
  - Codex: `~/.codex/config.yaml`
  - Cline/Kilo Code: VS Code `settings.json` (`mcp.servers` key)
  - opencode: `~/.config/opencode/config.json`
- Prompts the user for their Layoutr API key if not already set
- Injects the correct config block for each detected agent
- Prints a success summary

### 5. Wireframe Editor UI

In `apps/web/src/app/(dashboard)/projects/[projectId]/wireframe/page.tsx`:

- Pannable/zoomable canvas (same approach as the sitemap canvas)
- Left sidebar: block library (Hero, Navbar, Cards, CTA, Form, Footer, Text, Image, Table)
- Each block is a draggable tile; drop onto canvas to add
- Blocks render as grey placeholder boxes with their type label
- Click a block to select it; right panel shows editable props (text content, alignment, etc.)
- Blocks saved to `wireframe_blocks` table via the API
- Navigation: breadcrumb showing Project → Sitemap Node name

### 6. AI Chat Panel on Sitemap Editor

In `apps/web/src/components/sitemap/SitemapEditor.tsx`:

- Add a collapsible AI panel on the right side (toggle button in toolbar)
- Text input + send button: "Describe what you want to build..."
- On submit: POST to `/api/ai/generate` with `target: "sitemap"`
- Show a loading state on the canvas while generating
- On response: re-fetch nodes and update the canvas
- Show credit cost after each generation (e.g. "Used 5 credits · 95 remaining")
- Show an error if out of credits with a link to top up

## Code Conventions
- All API routes use `createServiceClient()` (not `createClient()`) for DB operations
- Auth always goes through `authenticate(request)` first
- Return `ok(data)` or `err(message, status)` from all API routes
- Server components use `createClient()` for session reads (not writes)
- No `any` types unless absolutely necessary — use `as unknown as T` instead
- Tailwind only for styling, dark theme (`gray-900` background family)
