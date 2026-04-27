#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { LayoutrClient } from "./client.js";

const apiKey = process.env.LAYOUTR_API_KEY ?? process.argv.find((a) => a.startsWith("--api-key="))?.split("=")[1] ?? "";
const baseUrl = process.env.LAYOUTR_BASE_URL ?? process.argv.find((a) => a.startsWith("--base-url="))?.split("=")[1] ?? "https://layoutr.app";

if (!apiKey) {
  console.error("Error: LAYOUTR_API_KEY environment variable or --api-key= argument required");
  process.exit(1);
}

const client = new LayoutrClient(baseUrl, apiKey);
const server = new McpServer({
  name: "layoutr",
  version: "0.2.0",
});

// ─── Projects ──────────────────────────────────────────────────────────────

server.tool("list_projects", "List all your Layoutr projects", {}, async () => {
  const projects = await client.listProjects();
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(projects, null, 2),
      },
    ],
  };
});

server.tool(
  "create_project",
  "Create a new Layoutr project",
  {
    name: z.string().min(1).max(100).describe("Project name"),
    description: z.string().max(500).optional().describe("Optional project description"),
  },
  async ({ name, description }) => {
    const project = await client.createProject(name, description);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(project, null, 2),
        },
      ],
    };
  }
);

server.tool(
  "get_project",
  "Get a specific project by ID",
  {
    project_id: z.string().uuid().describe("Project ID"),
  },
  async ({ project_id }) => {
    const project = await client.getProject(project_id);
    return {
      content: [{ type: "text", text: JSON.stringify(project, null, 2) }],
    };
  }
);

server.tool(
  "update_project",
  "Update a project's name or description",
  {
    project_id: z.string().uuid().describe("Project ID"),
    name: z.string().min(1).max(100).optional().describe("New name"),
    description: z.string().max(500).nullable().optional().describe("New description"),
  },
  async ({ project_id, ...updates }) => {
    const project = await client.updateProject(project_id, updates);
    return {
      content: [{ type: "text", text: JSON.stringify(project, null, 2) }],
    };
  }
);

server.tool(
  "delete_project",
  "Delete a project and all its sitemap nodes",
  {
    project_id: z.string().uuid().describe("Project ID"),
  },
  async ({ project_id }) => {
    const result = await client.deleteProject(project_id);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// ─── Sitemap nodes ─────────────────────────────────────────────────────────

server.tool(
  "get_sitemap",
  "Get all sitemap nodes for a project (flat list — use parent_id to reconstruct tree)",
  {
    project_id: z.string().uuid().describe("Project ID"),
  },
  async ({ project_id }) => {
    const nodes = await client.getSitemap(project_id);
    return {
      content: [{ type: "text", text: JSON.stringify(nodes, null, 2) }],
    };
  }
);

server.tool(
  "create_node",
  "Create a new sitemap node (page, section, folder, etc.)",
  {
    project_id: z.string().uuid().describe("Project ID"),
    label: z.string().min(1).max(200).describe("Display name for the node"),
    type: z
      .enum(["page", "section", "folder", "link", "modal", "component"])
      .default("page")
      .describe("Node type"),
    status: z
      .enum(["draft", "review", "approved", "live"])
      .default("draft")
      .describe("Node status"),
    parent_id: z.string().uuid().nullable().optional().describe("Parent node ID, or null for root"),
    url_path: z.string().nullable().optional().describe("URL path, e.g. /about"),
    notes: z.string().nullable().optional().describe("Notes about this page"),
    metadata: z.record(z.unknown()).optional().describe("Metadata, e.g. { sections: [{ label: 'Header', color: 'teal' }, { label: 'Hero', color: 'blue' }, { label: 'Footer', color: 'purple' }] }"),
    order_index: z.number().int().min(0).optional().describe("Order among siblings"),
  },
  async ({ project_id, ...nodeInput }) => {
    const node = await client.createNode(project_id, nodeInput);
    return {
      content: [{ type: "text", text: JSON.stringify(node, null, 2) }],
    };
  }
);

server.tool(
  "update_node",
  "Update a sitemap node's properties",
  {
    project_id: z.string().uuid().describe("Project ID"),
    node_id: z.string().uuid().describe("Node ID"),
    label: z.string().min(1).max(200).optional().describe("New label"),
    type: z.enum(["page", "section", "folder", "link", "modal", "component"]).optional(),
    status: z.enum(["draft", "review", "approved", "live"]).optional(),
    parent_id: z.string().uuid().nullable().optional().describe("New parent ID"),
    url_path: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    metadata: z.record(z.unknown()).optional(),
    order_index: z.number().int().min(0).optional(),
  },
  async ({ project_id, node_id, ...updates }) => {
    const node = await client.updateNode(project_id, node_id, updates);
    return {
      content: [{ type: "text", text: JSON.stringify(node, null, 2) }],
    };
  }
);

server.tool(
  "move_node",
  "Move a sitemap node to a different parent",
  {
    project_id: z.string().uuid().describe("Project ID"),
    node_id: z.string().uuid().describe("Node ID to move"),
    new_parent_id: z.string().uuid().nullable().describe("New parent node ID, or null for root"),
    order_index: z.number().int().min(0).optional().describe("Position among new siblings"),
  },
  async ({ project_id, node_id, new_parent_id, order_index }) => {
    const node = await client.updateNode(project_id, node_id, {
      parent_id: new_parent_id,
      order_index,
    });
    return {
      content: [{ type: "text", text: JSON.stringify(node, null, 2) }],
    };
  }
);

server.tool(
  "delete_node",
  "Delete a sitemap node (and all its children)",
  {
    project_id: z.string().uuid().describe("Project ID"),
    node_id: z.string().uuid().describe("Node ID to delete"),
  },
  async ({ project_id, node_id }) => {
    const result = await client.deleteNode(project_id, node_id);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// ─── High-level scaffold ────────────────────────────────────────────────────

server.tool(
  "scaffold_sitemap",
  "Scaffold a complete sitemap from a list of pages. For professional pages, prefer a structure like: Header -> Hero -> [Features/Content] -> Footer. You can add any number of sections and name them creatively.",
  {
    project_id: z.string().uuid().describe("Project ID"),
    pages: z
      .array(
        z.object({
          label: z.string().describe("Page name"),
          url_path: z.string().optional().describe("URL path"),
          type: z.enum(["page", "section", "folder", "link", "modal", "component"]).default("page"),
          parent_label: z.string().optional().describe("Label of the parent page (must already exist in this list or the project)"),
          notes: z.string().optional(),
          metadata: z.record(z.unknown()).optional().describe("Metadata, e.g. { sections: [...] }"),
          blocks: z
            .array(
              z.object({
                type: z.enum(["Hero", "Navbar", "Cards", "CTA", "Form", "Footer", "Text", "Image", "Table"]).describe("Block type"),
                order_index: z.number().int().min(0).optional().describe("Position in the wireframe"),
                props: z.record(z.unknown()).optional().describe("Block properties"),
              })
            )
            .optional()
            .describe("Wireframe sections/blocks for this page (e.g. Navbar, Hero, Footer)"),
        })
      )
      .describe("List of pages to create"),
  },
  async ({ project_id, pages }) => {
    const labelToId = new Map<string, string>();

    const existing = await client.getSitemap(project_id);
    existing.forEach((n) => labelToId.set(n.label, n.id));

    const created = [];
    for (const page of pages) {
      const parent_id = page.parent_label ? (labelToId.get(page.parent_label) ?? null) : null;
      const node = await client.createNode(project_id, {
        label: page.label,
        type: page.type,
        url_path: page.url_path,
        notes: page.notes,
        metadata: page.metadata,
        parent_id,
      });
      labelToId.set(page.label, node.id);

      // Create wireframe blocks for this node if provided
      if (page.blocks && page.blocks.length > 0) {
        for (let i = 0; i < page.blocks.length; i++) {
          const b = page.blocks[i];
          await client.createBlock(project_id, node.id, {
            type: b.type,
            order_index: b.order_index ?? i,
            props: b.props,
          });
        }
      }

      created.push(node);
    }

    return {
      content: [
        {
          type: "text",
          text: `Created ${created.length} nodes:\n${JSON.stringify(created, null, 2)}`,
        },
      ],
    };
  }
);

// ─── Integrated AI ─────────────────────────────────────────────────────────

server.tool(
  "ai_generate",
  "Use Layoutr's integrated AI to generate or update a sitemap or wireframe from a natural language prompt. Costs credits unless you have a BYOK key configured.",
  {
    prompt: z.string().min(1).max(4000).describe("Natural language description of what to build"),
    project_id: z.string().uuid().describe("Project ID to modify"),
    target: z.enum(["sitemap", "wireframe"]).describe("What to generate"),
    model: z
      .enum(["claude-haiku-3-5", "claude-sonnet-3-7", "gpt-4o-mini", "gemini-2-0-flash"])
      .optional()
      .describe("LLM model to use (default: claude-haiku-3-5)"),
    provider: z
      .enum(["anthropic", "openai", "google", "groq"])
      .optional()
      .describe("LLM provider (default: anthropic)"),
  },
  async ({ prompt, project_id, target, model, provider }) => {
    const result = await client.aiGenerate({ prompt, project_id, target, model, provider });
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

// ─── Wireframe blocks ──────────────────────────────────────────────────────

server.tool(
  "get_wireframe",
  "Get all wireframe blocks for a specific sitemap node",
  {
    project_id: z.string().uuid().describe("Project ID"),
    node_id: z.string().uuid().describe("Sitemap node ID"),
  },
  async ({ project_id, node_id }) => {
    const blocks = await client.getWireframe(project_id, node_id);
    return {
      content: [{ type: "text", text: JSON.stringify(blocks, null, 2) }],
    };
  }
);

server.tool(
  "create_block",
  "Add a wireframe block to a sitemap node",
  {
    project_id: z.string().uuid().describe("Project ID"),
    node_id: z.string().uuid().describe("Sitemap node ID"),
    type: z
      .enum(["Hero", "Navbar", "Cards", "CTA", "Form", "Footer", "Text", "Image", "Table"])
      .describe("Block type"),
    order_index: z.number().int().min(0).optional().describe("Position in the wireframe"),
    props: z.record(z.unknown()).optional().describe("Block properties (content, alignment, etc.)"),
  },
  async ({ project_id, node_id, ...block }) => {
    const result = await client.createBlock(project_id, node_id, block);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

server.tool(
  "update_block",
  "Update a wireframe block's type or properties",
  {
    project_id: z.string().uuid().describe("Project ID"),
    node_id: z.string().uuid().describe("Sitemap node ID"),
    block_id: z.string().uuid().describe("Block ID to update"),
    type: z
      .enum(["Hero", "Navbar", "Cards", "CTA", "Form", "Footer", "Text", "Image", "Table"])
      .optional(),
    order_index: z.number().int().min(0).optional(),
    props: z.record(z.unknown()).optional().describe("Updated block properties"),
  },
  async ({ project_id, node_id, block_id, ...updates }) => {
    const result = await client.updateBlock(project_id, node_id, block_id, updates);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

server.tool(
  "delete_block",
  "Remove a wireframe block from a node",
  {
    project_id: z.string().uuid().describe("Project ID"),
    node_id: z.string().uuid().describe("Sitemap node ID"),
    block_id: z.string().uuid().describe("Block ID to delete"),
  },
  async ({ project_id, node_id, block_id }) => {
    const result = await client.deleteBlock(project_id, node_id, block_id);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// ─── Design system ─────────────────────────────────────────────────────────

server.tool(
  "get_design_system",
  "Fetch the design system tokens for a project (colors, typography, spacing, etc.)",
  {
    project_id: z.string().uuid().describe("Project ID"),
  },
  async ({ project_id }) => {
    const ds = await client.getDesignSystem(project_id);
    return {
      content: [{ type: "text", text: JSON.stringify(ds, null, 2) }],
    };
  }
);

server.tool(
  "update_design_system",
  "Update the design system tokens for a project",
  {
    project_id: z.string().uuid().describe("Project ID"),
    tokens: z
      .record(z.unknown())
      .describe("Design tokens object (e.g. { colors: { primary: '#...' }, fonts: { body: '...' } })"),
  },
  async ({ project_id, tokens }) => {
    const ds = await client.updateDesignSystem(project_id, tokens);
    return {
      content: [{ type: "text", text: JSON.stringify(ds, null, 2) }],
    };
  }
);

// ─── Start ─────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
