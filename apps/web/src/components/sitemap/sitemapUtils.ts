export type NodeType = "page" | "section" | "folder" | "link" | "modal" | "component";
export type NodeStatus = "draft" | "review" | "approved" | "live";

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
  children?: SitemapNode[];
}

export function buildTree(nodes: SitemapNode[]): SitemapNode[] {
  const map = new Map<string, SitemapNode>();
  const roots: SitemapNode[] = [];

  nodes.forEach((n) => map.set(n.id, { ...n, children: [] }));

  map.forEach((node) => {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });

  const sort = (arr: SitemapNode[]) => {
    arr.sort((a, b) => a.order_index - b.order_index);
    arr.forEach((n) => n.children && sort(n.children));
  };
  sort(roots);

  return roots;
}

export function flattenTree(nodes: SitemapNode[]): SitemapNode[] {
  const result: SitemapNode[] = [];
  const walk = (arr: SitemapNode[]) => {
    arr.forEach((n) => {
      result.push(n);
      if (n.children) walk(n.children);
    });
  };
  walk(nodes);
  return result;
}

export const NODE_TYPE_ICONS: Record<NodeType, string> = {
  page: "📄",
  section: "📂",
  folder: "🗂",
  link: "🔗",
  modal: "🪟",
  component: "🧩",
};

export const STATUS_COLORS: Record<NodeStatus, string> = {
  draft: "text-gray-400 bg-gray-800",
  review: "text-yellow-400 bg-yellow-900/30",
  approved: "text-green-400 bg-green-900/30",
  live: "text-blue-400 bg-blue-900/30",
};
