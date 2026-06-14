export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_by_user_id: string;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          slug: string;
          created_by_user_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["workspaces"]["Insert"]>;
      };
      workspace_members: {
        Row: {
          workspace_id: string;
          user_id: string;
          role: string;
          joined_at: string;
        };
        Insert: {
          workspace_id: string;
          user_id: string;
          role: string;
          joined_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["workspace_members"]["Insert"]>;
      };
      projects: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          key: string;
          color: string;
          created_at: string;
          archived_at: string | null;
        };
        Insert: {
          id: string;
          workspace_id: string;
          name: string;
          key: string;
          color: string;
          created_at?: string;
          archived_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
      };
      project_members: {
        Row: {
          project_id: string;
          user_id: string;
          role: string;
          joined_at: string;
        };
        Insert: {
          project_id: string;
          user_id: string;
          role: string;
          joined_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["project_members"]["Insert"]>;
      };
      issue_statuses: {
        Row: {
          id: string;
          name: string;
          sort_order: number;
          is_terminal: boolean;
        };
        Insert: {
          id: string;
          name: string;
          sort_order: number;
          is_terminal?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["issue_statuses"]["Insert"]>;
      };
      issue_priorities: {
        Row: {
          id: string;
          name: string;
          sort_order: number;
        };
        Insert: {
          id: string;
          name: string;
          sort_order: number;
        };
        Update: Partial<Database["public"]["Tables"]["issue_priorities"]["Insert"]>;
      };
      issue_types: {
        Row: {
          id: string;
          name: string;
          sort_order: number;
        };
        Insert: {
          id: string;
          name: string;
          sort_order: number;
        };
        Update: Partial<Database["public"]["Tables"]["issue_types"]["Insert"]>;
      };
      issues: {
        Row: {
          id: string;
          project_id: string;
          identifier: string;
          title: string;
          description: string;
          status_id: string;
          priority_id: string;
          issue_type_id: string;
          reporter_user_id: string;
          assignee_user_id: string | null;
          due_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          project_id: string;
          identifier: string;
          title: string;
          description: string;
          status_id: string;
          priority_id: string;
          issue_type_id?: string;
          reporter_user_id: string;
          assignee_user_id?: string | null;
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["issues"]["Insert"]>;
      };
      labels: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          color: string;
        };
        Insert: {
          id: string;
          workspace_id: string;
          name: string;
          color: string;
        };
        Update: Partial<Database["public"]["Tables"]["labels"]["Insert"]>;
      };
      issue_labels: {
        Row: {
          issue_id: string;
          label_id: string;
        };
        Insert: {
          issue_id: string;
          label_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["issue_labels"]["Insert"]>;
      };
      issue_links: {
        Row: {
          source_issue_id: string;
          target_issue_id: string;
          relationship: string;
          created_at: string;
        };
        Insert: {
          source_issue_id: string;
          target_issue_id: string;
          relationship: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["issue_links"]["Insert"]>;
      };
      issue_comments: {
        Row: {
          id: string;
          issue_id: string;
          author_user_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id: string;
          issue_id: string;
          author_user_id: string;
          body: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["issue_comments"]["Insert"]>;
      };
    };
    Views: {
      auth_user_profiles: {
        Row: {
          id: string;
          email: string | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type PublicTableName = keyof Database["public"]["Tables"];
