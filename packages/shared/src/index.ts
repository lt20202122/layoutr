export type NodeType = "page" | "section" | "folder" | "link" | "modal" | "component";
export type NodeStatus = "draft" | "review" | "approved" | "live";

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
  type: NodeType;
  status: NodeStatus;
  order_index: number;
  url_path: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
