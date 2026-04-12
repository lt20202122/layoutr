export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type NodeType =
  | "page"
  | "section"
  | "folder"
  | "link"
  | "modal"
  | "component";

export type NodeStatus = "draft" | "review" | "approved" | "live";

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          slug: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          slug: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          slug?: string;
          updated_at?: string;
        };
      };
      sitemap_nodes: {
        Row: {
          id: string;
          project_id: string;
          parent_id: string | null;
          label: string;
          type: NodeType;
          status: NodeStatus;
          order_index: number;
          url_path: string | null;
          notes: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          parent_id?: string | null;
          label: string;
          type?: NodeType;
          status?: NodeStatus;
          order_index?: number;
          url_path?: string | null;
          notes?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          parent_id?: string | null;
          label?: string;
          type?: NodeType;
          status?: NodeStatus;
          order_index?: number;
          url_path?: string | null;
          notes?: string | null;
          metadata?: Json;
          updated_at?: string;
        };
      };
      api_keys: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          key_hash: string;
          key_prefix: string;
          created_at: string;
          last_used_at: string | null;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          key_hash: string;
          key_prefix: string;
          created_at?: string;
          last_used_at?: string | null;
          expires_at?: string | null;
        };
        Update: {
          name?: string;
          last_used_at?: string | null;
          expires_at?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      node_type: NodeType;
      node_status: NodeStatus;
    };
  };
}
