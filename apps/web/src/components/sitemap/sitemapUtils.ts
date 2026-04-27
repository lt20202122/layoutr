export type NodeType = "page" | "section" | "folder" | "link" | "modal" | "component";
export type NodeStatus = "draft" | "review" | "approved" | "live";
export type SectionColor = "teal" | "blue" | "navy" | "purple" | "slate" | "indigo";

export interface Section {
  id: string;
  label: string;
  color: SectionColor;
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
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  children?: SitemapNode[];
}

export const SECTION_COLOR_MAP: Record<SectionColor, string> = {
  teal:   "#1abc9c",
  blue:   "#3d7ab5",
  navy:   "#2d5a87",
  purple: "#9b59b6",
  slate:  "#4a6fa5",
  indigo: "#5c6bc0",
};

export const SECTION_COLOR_OPTIONS: { label: string; value: SectionColor }[] = [
  { label: "Teal",   value: "teal" },
  { label: "Blue",   value: "blue" },
  { label: "Navy",   value: "navy" },
  { label: "Purple", value: "purple" },
  { label: "Slate",  value: "slate" },
  { label: "Indigo", value: "indigo" },
];

export const DEFAULT_SECTIONS: Section[] = [
  { id: "d1", label: "Header",   color: "teal" },
  { id: "d2", label: "Hero",     color: "blue" },
  { id: "d3", label: "Features", color: "navy" },
  { id: "d4", label: "Footer",   color: "purple" },
];

export function getSections(node: SitemapNode): Section[] {
  const raw = node.metadata?.sections;
  if (Array.isArray(raw) && raw.length > 0) return raw as Section[];
  return DEFAULT_SECTIONS;
}

// ─── Card dimensions ────────────────────────────────────────────────────────
export const CARD_WIDTH       = 224;
export const CARD_SECTION_H   = 72;
export const CARD_HEADER_H    = 44;
export const CARD_ADD_BTN_H   = 46; // "add child" button at bottom
export const CARD_BODY_PAD    = 8;  // padding around sections
export const CARD_SECTION_GAP = 4;  // gap between sections
export const CARD_COLLAPSED_H = 44;

// ─── Gaps ───────────────────────────────────────────────────────────────────
export const H_GAP = 60;
export const V_GAP = 110;

export function cardHeight(sections: Section[], collapsed = false): number {
  if (collapsed) return CARD_COLLAPSED_H;
  return (
    CARD_HEADER_H +
    CARD_BODY_PAD +
    sections.length * CARD_SECTION_H +
    (sections.length - 1) * CARD_SECTION_GAP +
    CARD_BODY_PAD +
    CARD_ADD_BTN_H
  );
}

// ─── Layout ─────────────────────────────────────────────────────────────────
export interface NodePosition { x: number; y: number }

function subtreeWidth(node: SitemapNode): number {
  if (!node.children || node.children.length === 0) return CARD_WIDTH;
  const total = node.children.reduce((sum, child, i) =>
    sum + subtreeWidth(child) + (i > 0 ? H_GAP : 0), 0);
  return Math.max(CARD_WIDTH, total);
}

function layoutNode(
  node: SitemapNode,
  cx: number,
  y: number,
  map: Map<string, NodePosition>,
  collapsed: Set<string>
) {
  map.set(node.id, { x: cx - CARD_WIDTH / 2, y });
  if (!node.children || node.children.length === 0) return;
  if (collapsed.has(node.id)) return;

  const isCollapsed = collapsed.has(node.id);
  const sections = getSections(node);
  const ch = cardHeight(sections, isCollapsed);
  const childY = y + ch + V_GAP;

  const totalW = node.children.reduce((sum, child, i) =>
    sum + subtreeWidth(child) + (i > 0 ? H_GAP : 0), 0);
  let childX = cx - totalW / 2;
  node.children.forEach(child => {
    const sw = subtreeWidth(child);
    layoutNode(child, childX + sw / 2, childY, map, collapsed);
    childX += sw + H_GAP;
  });
}

export function computeLayout(
  roots: SitemapNode[],
  collapsed: Set<string> = new Set()
): Map<string, NodePosition> {
  const map = new Map<string, NodePosition>();
  const totalW = roots.reduce((sum, r, i) =>
    sum + subtreeWidth(r) + (i > 0 ? H_GAP : 0), 0);

  let x = -totalW / 2;
  roots.forEach(root => {
    const sw = subtreeWidth(root);
    layoutNode(root, x + sw / 2, 0, map, collapsed);
    x += sw + H_GAP;
  });
  return map;
}

export function flattenTree(nodes: SitemapNode[]): SitemapNode[] {
  const result: SitemapNode[] = [];
  const walk = (arr: SitemapNode[]) => arr.forEach(n => {
    result.push(n);
    if (n.children) walk(n.children);
  });
  walk(nodes);
  return result;
}

export function buildTree(nodes: SitemapNode[]): SitemapNode[] {
  const map = new Map<string, SitemapNode>();
  const roots: SitemapNode[] = [];
  nodes.forEach(n => map.set(n.id, { ...n, children: [] }));
  map.forEach(node => {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });
  const sort = (arr: SitemapNode[]) => {
    arr.sort((a, b) => a.order_index - b.order_index);
    arr.forEach(n => n.children && sort(n.children));
  };
  sort(roots);
  return roots;
}

export const STATUS_COLORS: Record<NodeStatus, string> = {
  draft:    "text-gray-400 bg-gray-800",
  review:   "text-yellow-400 bg-yellow-900/30",
  approved: "text-green-400 bg-green-900/30",
  live:     "text-blue-400 bg-blue-900/30",
};
