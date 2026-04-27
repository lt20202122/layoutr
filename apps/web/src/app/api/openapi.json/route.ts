import { NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const spec: Record<string, any> = {
  openapi: "3.1.0",
  info: {
    title: "Layoutr API",
    version: "0.1.0",
    description:
      "AI-native sitemap and wireframe builder API. Requires `Authorization: Bearer ltr_<key>` header or a valid Supabase session cookie.",
  },
  servers: [
    { url: "https://layoutr-xi.vercel.app/api", description: "Production" },
  ],
  paths: {
    "/projects": {
      get: {
        summary: "List projects",
        security: [{ apiKey: [], sessionCookie: [] }],
        responses: {
          "200": {
            description: "Array of user projects",
          },
        },
      },
      post: {
        summary: "Create project",
        security: [{ apiKey: [], sessionCookie: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string", maxLength: 100 },
                  description: { type: "string", maxLength: 500 },
                },
              },
            },
          },
        },
        responses: { "201": { description: "Created project" } },
      },
    },
    "/projects/{projectId}": {
      get: {
        summary: "Get project",
        security: [{ apiKey: [], sessionCookie: [] }],
        parameters: [
          {
            name: "projectId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": { description: "Project" },
          "404": { description: "Project not found" },
        },
      },
      patch: {
        summary: "Update project",
        security: [{ apiKey: [], sessionCookie: [] }],
        parameters: [
          {
            name: "projectId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", maxLength: 100 },
                  description: {
                    type: "string",
                    maxLength: 500,
                    nullable: true,
                  },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Updated project" } },
      },
      delete: {
        summary: "Delete project",
        security: [{ apiKey: [], sessionCookie: [] }],
        parameters: [
          {
            name: "projectId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { "200": { description: "Deleted" } },
      },
    },
    "/projects/{projectId}/sitemaps": {
      get: {
        summary: "Get all sitemap nodes",
        security: [{ apiKey: [], sessionCookie: [] }],
        parameters: [
          {
            name: "projectId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { "200": { description: "Array of sitemap nodes" } },
      },
      post: {
        summary: "Create sitemap node",
        security: [{ apiKey: [], sessionCookie: [] }],
        parameters: [
          {
            name: "projectId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateSitemapNode" },
            },
          },
        },
        responses: { "201": { description: "Created node" } },
      },
    },
    "/projects/{projectId}/sitemaps/{nodeId}": {
      get: {
        summary: "Get sitemap node",
        security: [{ apiKey: [], sessionCookie: [] }],
        parameters: [
          {
            name: "projectId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
          {
            name: "nodeId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { "200": { description: "Sitemap node" } },
      },
      patch: {
        summary: "Update sitemap node",
        security: [{ apiKey: [], sessionCookie: [] }],
        parameters: [
          {
            name: "projectId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
          {
            name: "nodeId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  label: { type: "string" },
                  type: {
                    type: "string",
                    "enum": [
                      "page",
                      "section",
                      "folder",
                      "link",
                      "modal",
                      "component",
                    ],
                  },
                  url_path: { type: "string" },
                  notes: { type: "string" },
                  parent_id: {
                    type: "string",
                    format: "uuid",
                    nullable: true,
                  },
                  order_index: { type: "integer" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Updated node" } },
      },
      delete: {
        summary: "Delete sitemap node",
        security: [{ apiKey: [], sessionCookie: [] }],
        parameters: [
          {
            name: "projectId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
          {
            name: "nodeId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { "200": { description: "Deleted node" } },
      },
    },
    "/projects/{projectId}/wireframes/{nodeId}": {
      get: {
        summary: "Get wireframe blocks for a node",
        security: [{ apiKey: [], sessionCookie: [] }],
        parameters: [
          {
            name: "projectId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
          {
            name: "nodeId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { "200": { description: "Array of wireframe blocks" } },
      },
      post: {
        summary: "Add wireframe block",
        security: [{ apiKey: [], sessionCookie: [] }],
        parameters: [
          {
            name: "projectId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
          {
            name: "nodeId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["type"],
                properties: {
                  type: {
                    type: "string",
                    "enum": [
                      "Navbar",
                      "Hero",
                      "Cards",
                      "CTA",
                      "Form",
                      "Footer",
                      "Text",
                      "Image",
                      "Table",
                    ],
                  },
                  order_index: { type: "integer" },
                  props: { type: "object" },
                },
              },
            },
          },
        },
        responses: { "201": { description: "Created block" } },
      },
    },
    "/projects/{projectId}/wireframes/{nodeId}/{blockId}": {
      patch: {
        summary: "Update wireframe block",
        security: [{ apiKey: [], sessionCookie: [] }],
        parameters: [
          {
            name: "projectId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
          {
            name: "nodeId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
          {
            name: "blockId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  order_index: { type: "integer" },
                  props: { type: "object" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Updated block" } },
      },
      delete: {
        summary: "Delete wireframe block",
        security: [{ apiKey: [], sessionCookie: [] }],
        parameters: [
          {
            name: "projectId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
          {
            name: "nodeId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
          {
            name: "blockId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { "200": { description: "Deleted block" } },
      },
    },
    "/projects/{projectId}/design-system": {
      get: {
        summary: "Get design tokens",
        security: [{ apiKey: [], sessionCookie: [] }],
        parameters: [
          {
            name: "projectId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { "200": { description: "Design system tokens" } },
      },
      patch: {
        summary: "Update design tokens",
        security: [{ apiKey: [], sessionCookie: [] }],
        parameters: [
          {
            name: "projectId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  colors: { type: "object" },
                  typography: { type: "object" },
                  spacing: { type: "object" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Updated design tokens" } },
      },
    },
    "/ai/generate": {
      post: {
        summary: "AI generate sitemap or wireframe",
        description: "Costs credits unless using a BYOK key.",
        security: [{ apiKey: [], sessionCookie: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["prompt", "project_id", "target"],
                properties: {
                  prompt: { type: "string", minLength: 1, maxLength: 4000 },
                  project_id: { type: "string", format: "uuid" },
                  target: {
                    type: "string",
                    "enum": ["sitemap", "wireframe"],
                  },
                  model: {
                    type: "string",
                    "enum": [
                      "deepseek-chat",
                      "claude-sonnet-4-5",
                      "gpt-5.5",
                    ],
                    default: "deepseek-chat",
                  },
                  provider: {
                    type: "string",
                    "enum": [
                      "anthropic",
                      "openai",
                      "google",
                      "groq",
                      "deepseek",
                    ],
                    default: "deepseek",
                  },
                  node_id: {
                    type: "string",
                    format: "uuid",
                    description: "Required for wireframe target",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Generation result" },
          "402": { description: "Insufficient credits" },
        },
      },
    },
    "/ai/keys": {
      get: {
        summary: "List BYOK LLM keys",
        security: [{ apiKey: [], sessionCookie: [] }],
        responses: { "200": { description: "Array of LLM keys (prefixes)" } },
      },
      post: {
        summary: "Add or replace a BYOK LLM key",
        security: [{ apiKey: [], sessionCookie: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["provider", "key"],
                properties: {
                  provider: {
                    type: "string",
                    "enum": ["anthropic", "openai", "google", "groq"],
                  },
                  key: { type: "string" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Stored key metadata" } },
      },
    },
    "/ai/keys/{keyId}": {
      delete: {
        summary: "Remove a BYOK LLM key",
        security: [{ apiKey: [], sessionCookie: [] }],
        parameters: [
          {
            name: "keyId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { "200": { description: "Deleted" } },
      },
    },
    "/keys": {
      get: {
        summary: "List API keys",
        security: [{ apiKey: [], sessionCookie: [] }],
        responses: {
          "200": { description: "Array of API keys (prefixes only)" },
        },
      },
      post: {
        summary: "Create API key",
        security: [{ apiKey: [], sessionCookie: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string", maxLength: 100 },
                  expires_at: {
                    type: "string",
                    format: "date-time",
                    nullable: true,
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description:
              "Created API key (raw key returned once in response)",
          },
        },
      },
    },
    "/keys/{keyId}": {
      delete: {
        summary: "Revoke API key",
        security: [{ apiKey: [], sessionCookie: [] }],
        parameters: [
          {
            name: "keyId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { "200": { description: "Deleted" } },
      },
    },
    "/users/me": {
      get: {
        summary: "Get user profile and credits",
        security: [{ apiKey: [], sessionCookie: [] }],
        responses: { "200": { description: "User profile" } },
      },
      delete: {
        summary: "Delete account",
        security: [{ apiKey: [], sessionCookie: [] }],
        responses: { "200": { description: "Account deleted" } },
      },
    },
    "/users/me/credits": {
      get: {
        summary: "Get credit balance",
        security: [{ apiKey: [], sessionCookie: [] }],
        responses: { "200": { description: "Credit balance" } },
      },
    },
    "/waitlist": {
      post: {
        summary: "Join waitlist for plans and credit top-ups",
        security: [{ apiKey: [], sessionCookie: [] }],
        responses: {
          "200": { description: "Joined or already on waitlist" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      apiKey: {
        type: "http",
        scheme: "bearer",
        description: "API key with `ltr_` prefix",
      },
      sessionCookie: {
        type: "apiKey",
        in: "cookie",
        name: "sb-*-auth-token",
        description: "Supabase session cookie",
      },
    },
    schemas: {
      Project: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          user_id: { type: "string", format: "uuid" },
          name: { type: "string" },
          slug: { type: "string" },
          description: { type: "string", nullable: true },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      CreateSitemapNode: {
        type: "object",
        required: ["label", "type"],
        properties: {
          label: { type: "string" },
          type: {
            type: "string",
            "enum": [
              "page",
              "section",
              "folder",
              "link",
              "modal",
              "component",
            ],
          },
          parent_id: { type: "string", format: "uuid", nullable: true },
          url_path: { type: "string" },
          notes: { type: "string" },
          order_index: { type: "integer" },
        },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(spec);
}
