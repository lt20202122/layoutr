export class LayoutrClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.apiKey = apiKey;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.error ?? `Request failed with status ${res.status}`);
    }

    return json.data as T;
  }

  // Projects
  listProjects() {
    return this.request<Project[]>("GET", "/api/projects");
  }

  createProject(name: string, description?: string) {
    return this.request<Project>("POST", "/api/projects", { name, description });
  }

  getProject(projectId: string) {
    return this.request<Project>("GET", `/api/projects/${projectId}`);
  }

  updateProject(projectId: string, updates: { name?: string; description?: string | null }) {
    return this.request<Project>("PATCH", `/api/projects/${projectId}`, updates);
  }

  deleteProject(projectId: string) {
    return this.request<{ deleted: boolean }>("DELETE", `/api/projects/${projectId}`);
  }

  // Sitemap nodes
  getSitemap(projectId: string) {
    return this.request<SitemapNode[]>("GET", `/api/projects/${projectId}/sitemaps`);
  }

  createNode(projectId: string, node: CreateNodeInput) {
    return this.request<SitemapNode>("POST", `/api/projects/${projectId}/sitemaps`, node);
  }

  updateNode(projectId: string, nodeId: string, updates: UpdateNodeInput) {
    return this.request<SitemapNode>(
      "PATCH",
      `/api/projects/${projectId}/sitemaps/${nodeId}`,
      updates
    );
  }

  deleteNode(projectId: string, nodeId: string) {
    return this.request<{ deleted: boolean }>(
      "DELETE",
      `/api/projects/${projectId}/sitemaps/${nodeId}`
    );
  }
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface SitemapNode {
  id: string;
  project_id: string;
  parent_id: string | null;
  label: string;
  type: "page" | "section" | "folder" | "link" | "modal" | "component";
  status: "draft" | "review" | "approved" | "live";
  order_index: number;
  url_path: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateNodeInput {
  label: string;
  type?: SitemapNode["type"];
  status?: SitemapNode["status"];
  parent_id?: string | null;
  url_path?: string | null;
  notes?: string | null;
  order_index?: number;
  metadata?: Record<string, unknown>;
}

export type UpdateNodeInput = Partial<CreateNodeInput>;
