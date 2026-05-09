"use client";

import type { SitemapNode } from "@/components/sitemap/sitemapUtils";
import type { Block } from "@/components/wireframe/WireframeEditor";

const STORAGE_KEY = "layoutr.guest.workspace.v1";

export interface GuestProject {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface GuestWorkspace {
  projects: GuestProject[];
  sitemapNodesByProject: Record<string, SitemapNode[]>;
  wireframeBlocksByNode: Record<string, Block[]>;
}

function createEmptyWorkspace(): GuestWorkspace {
  return {
    projects: [],
    sitemapNodesByProject: {},
    wireframeBlocksByNode: {},
  };
}

function hasLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readWorkspace(): GuestWorkspace {
  if (!hasLocalStorage()) return createEmptyWorkspace();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyWorkspace();

    const parsed = JSON.parse(raw) as Partial<GuestWorkspace>;
    return {
      projects: parsed.projects ?? [],
      sitemapNodesByProject: parsed.sitemapNodesByProject ?? {},
      wireframeBlocksByNode: parsed.wireframeBlocksByNode ?? {},
    };
  } catch {
    return createEmptyWorkspace();
  }
}

function writeWorkspace(workspace: GuestWorkspace) {
  if (!hasLocalStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
}

function nowIso() {
  return new Date().toISOString();
}

function guestId(prefix: string) {
  return `guest_${prefix}_${crypto.randomUUID()}`;
}

function touchProject(workspace: GuestWorkspace, projectId: string) {
  workspace.projects = workspace.projects.map((project) =>
    project.id === projectId ? { ...project, updated_at: nowIso() } : project
  );
}

export function listGuestProjects() {
  return readWorkspace().projects.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export function getGuestProject(projectId: string) {
  return readWorkspace().projects.find((project) => project.id === projectId) ?? null;
}

export function createGuestProject(input: { name: string; description?: string | null }) {
  const workspace = readWorkspace();
  const timestamp = nowIso();
  const project: GuestProject = {
    id: guestId("project"),
    name: input.name.trim(),
    description: input.description?.trim() || null,
    created_at: timestamp,
    updated_at: timestamp,
  };

  workspace.projects = [project, ...workspace.projects];
  workspace.sitemapNodesByProject[project.id] = [];
  writeWorkspace(workspace);
  return project;
}

export function updateGuestProject(projectId: string, updates: Partial<Pick<GuestProject, "name" | "description">>) {
  const workspace = readWorkspace();
  const existing = workspace.projects.find((project) => project.id === projectId);
  if (!existing) return null;

  const nextProject: GuestProject = {
    ...existing,
    name: updates.name?.trim() || existing.name,
    description: updates.description === undefined ? existing.description : updates.description?.trim() || null,
    updated_at: nowIso(),
  };

  workspace.projects = workspace.projects.map((project) => (project.id === projectId ? nextProject : project));
  writeWorkspace(workspace);
  return nextProject;
}

export function deleteGuestProject(projectId: string) {
  const workspace = readWorkspace();
  const nodes = workspace.sitemapNodesByProject[projectId] ?? [];
  const nodeIds = new Set(nodes.map((node) => node.id));

  workspace.projects = workspace.projects.filter((project) => project.id !== projectId);
  delete workspace.sitemapNodesByProject[projectId];

  for (const nodeId of Object.keys(workspace.wireframeBlocksByNode)) {
    if (nodeIds.has(nodeId)) delete workspace.wireframeBlocksByNode[nodeId];
  }

  writeWorkspace(workspace);
}

export function listGuestSitemapNodes(projectId: string) {
  return readWorkspace().sitemapNodesByProject[projectId] ?? [];
}

export function createGuestSitemapNode(
  projectId: string,
  input: Pick<SitemapNode, "parent_id" | "label" | "type" | "order_index" | "metadata"> & Partial<SitemapNode>
) {
  const workspace = readWorkspace();
  const timestamp = nowIso();
  const node: SitemapNode = {
    id: guestId("node"),
    project_id: projectId,
    parent_id: input.parent_id ?? null,
    label: input.label,
    type: input.type,
    status: input.status ?? "draft",
    order_index: input.order_index,
    url_path: input.url_path ?? null,
    notes: input.notes ?? null,
    metadata: input.metadata ?? null,
    created_at: timestamp,
    updated_at: timestamp,
  };

  workspace.sitemapNodesByProject[projectId] = [...(workspace.sitemapNodesByProject[projectId] ?? []), node];
  touchProject(workspace, projectId);
  writeWorkspace(workspace);
  return node;
}

export function updateGuestSitemapNode(projectId: string, nodeId: string, updates: Partial<SitemapNode>) {
  const workspace = readWorkspace();
  const nodes = workspace.sitemapNodesByProject[projectId] ?? [];
  let nextNode: SitemapNode | null = null;

  workspace.sitemapNodesByProject[projectId] = nodes.map((node) => {
    if (node.id !== nodeId) return node;
    nextNode = {
      ...node,
      ...updates,
      id: node.id,
      project_id: node.project_id,
      updated_at: nowIso(),
    };
    return nextNode;
  });

  if (!nextNode) return null;
  touchProject(workspace, projectId);
  writeWorkspace(workspace);
  return nextNode;
}

export function deleteGuestSitemapNode(projectId: string, nodeId: string) {
  const workspace = readWorkspace();
  const nodes = workspace.sitemapNodesByProject[projectId] ?? [];
  const toDelete = new Set<string>();

  const collect = (currentId: string) => {
    toDelete.add(currentId);
    nodes.filter((node) => node.parent_id === currentId).forEach((node) => collect(node.id));
  };

  collect(nodeId);

  workspace.sitemapNodesByProject[projectId] = nodes.filter((node) => !toDelete.has(node.id));
  for (const id of toDelete) delete workspace.wireframeBlocksByNode[id];
  touchProject(workspace, projectId);
  writeWorkspace(workspace);
}

export function listGuestWireframeBlocks(nodeId: string) {
  return readWorkspace().wireframeBlocksByNode[nodeId] ?? [];
}

export function createGuestWireframeBlock(
  projectId: string,
  nodeId: string,
  input: Pick<Block, "type" | "order_index" | "props"> & Partial<Block>
) {
  const workspace = readWorkspace();
  const timestamp = nowIso();
  const block: Block = {
    id: guestId("block"),
    node_id: nodeId,
    type: input.type,
    label: input.label ?? null,
    composition: input.composition ?? null,
    order_index: input.order_index,
    props: input.props,
    created_at: timestamp,
    updated_at: timestamp,
  };

  workspace.wireframeBlocksByNode[nodeId] = [...(workspace.wireframeBlocksByNode[nodeId] ?? []), block];
  touchProject(workspace, projectId);
  writeWorkspace(workspace);
  return block;
}

export function updateGuestWireframeBlock(projectId: string, nodeId: string, blockId: string, updates: Partial<Block>) {
  const workspace = readWorkspace();
  const blocks = workspace.wireframeBlocksByNode[nodeId] ?? [];
  let nextBlock: Block | null = null;

  workspace.wireframeBlocksByNode[nodeId] = blocks.map((block) => {
    if (block.id !== blockId) return block;
    nextBlock = {
      ...block,
      ...updates,
      id: block.id,
      node_id: block.node_id,
      updated_at: nowIso(),
    };
    return nextBlock;
  });

  if (!nextBlock) return null;
  touchProject(workspace, projectId);
  writeWorkspace(workspace);
  return nextBlock;
}

export function deleteGuestWireframeBlock(projectId: string, nodeId: string, blockId: string) {
  const workspace = readWorkspace();
  workspace.wireframeBlocksByNode[nodeId] = (workspace.wireframeBlocksByNode[nodeId] ?? []).filter(
    (block) => block.id !== blockId
  );
  touchProject(workspace, projectId);
  writeWorkspace(workspace);
}
