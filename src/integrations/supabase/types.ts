export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      auth_attempts: {
        Row: {
          created_at: string
          id: string
          identifier: string
          ip: string | null
          succeeded: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          identifier: string
          ip?: string | null
          succeeded?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          identifier?: string
          ip?: string | null
          succeeded?: boolean
        }
        Relationships: []
      }
      moderation_logs: {
        Row: {
          context: Json | null
          created_at: string
          id: string
          level: string
          reason: string
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string
          id?: string
          level: string
          reason: string
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string
          id?: string
          level?: string
          reason?: string
          user_id?: string | null
        }
        Relationships: []
      }
      pastes: {
        Row: {
          author: string
          body_md: string
          created_at: string
          created_by: string | null
          excerpt: string
          id: string
          published: boolean
          slug: string
          tags: string[]
          theory_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author?: string
          body_md?: string
          created_at?: string
          created_by?: string | null
          excerpt?: string
          id?: string
          published?: boolean
          slug: string
          tags?: string[]
          theory_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author?: string
          body_md?: string
          created_at?: string
          created_by?: string | null
          excerpt?: string
          id?: string
          published?: boolean
          slug?: string
          tags?: string[]
          theory_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pastes_theory_id_fkey"
            columns: ["theory_id"]
            isOneToOne: false
            referencedRelation: "theories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sources: {
        Row: {
          agency: string | null
          created_at: string
          credibility: Database["public"]["Enums"]["credibility_level"]
          description: string | null
          file_path: string | null
          id: string
          source_type: string
          theory_id: string
          title: string
          updated_at: string
          url: string | null
          year: string | null
        }
        Insert: {
          agency?: string | null
          created_at?: string
          credibility?: Database["public"]["Enums"]["credibility_level"]
          description?: string | null
          file_path?: string | null
          id?: string
          source_type: string
          theory_id: string
          title: string
          updated_at?: string
          url?: string | null
          year?: string | null
        }
        Update: {
          agency?: string | null
          created_at?: string
          credibility?: Database["public"]["Enums"]["credibility_level"]
          description?: string | null
          file_path?: string | null
          id?: string
          source_type?: string
          theory_id?: string
          title?: string
          updated_at?: string
          url?: string | null
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sources_theory_id_fkey"
            columns: ["theory_id"]
            isOneToOne: false
            referencedRelation: "theories"
            referencedColumns: ["id"]
          },
        ]
      }
      theories: {
        Row: {
          category: string
          classification: Database["public"]["Enums"]["classification_level"]
          codename: string
          created_at: string
          created_by: string | null
          credibility: Database["public"]["Enums"]["credibility_level"]
          document_count: number
          entities: string[]
          id: string
          slug: string
          summary: string
          tags: string[]
          title: string
          updated_at: string
          year: string | null
        }
        Insert: {
          category: string
          classification?: Database["public"]["Enums"]["classification_level"]
          codename: string
          created_at?: string
          created_by?: string | null
          credibility?: Database["public"]["Enums"]["credibility_level"]
          document_count?: number
          entities?: string[]
          id?: string
          slug: string
          summary: string
          tags?: string[]
          title: string
          updated_at?: string
          year?: string | null
        }
        Update: {
          category?: string
          classification?: Database["public"]["Enums"]["classification_level"]
          codename?: string
          created_at?: string
          created_by?: string | null
          credibility?: Database["public"]["Enums"]["credibility_level"]
          document_count?: number
          entities?: string[]
          id?: string
          slug?: string
          summary?: string
          tags?: string[]
          title?: string
          updated_at?: string
          year?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "editor" | "viewer"
      classification_level:
        | "TOP SECRET"
        | "CONFIDENTIAL"
        | "DECLASSIFIED"
        | "RESTRICTED"
      credibility_level:
        | "confirmed"
        | "partial"
        | "unverified"
        | "speculative"
        | "narrative"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "editor", "viewer"],
      classification_level: [
        "TOP SECRET",
        "CONFIDENTIAL",
        "DECLASSIFIED",
        "RESTRICTED",
      ],
      credibility_level: [
        "confirmed",
        "partial",
        "unverified",
        "speculative",
        "narrative",
      ],
    },
  },
} as const
