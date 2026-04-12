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
  version: "0.1.0",
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

// ─── High-level AI tools ───────────────────────────────────────────────────

server.tool(
  "scaffold_sitemap",
  "Scaffold a complete sitemap from a list of pages with optional hierarchy. Use this to quickly populate a project from a natural-language description.",
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
        })
      )
      .describe("List of pages to create"),
  },
  async ({ project_id, pages }) => {
    // Build label → id map as we create nodes
    const labelToId = new Map<string, string>();

    // First pass: get existing nodes
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
        parent_id,
      });
      labelToId.set(page.label, node.id);
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

// ─── Start ─────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
