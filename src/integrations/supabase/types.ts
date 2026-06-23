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
      ai_insights: {
        Row: {
          category: string
          client_id: string
          created_at: string
          id: string
          insight_text: string
        }
        Insert: {
          category: string
          client_id: string
          created_at?: string
          id?: string
          insight_text: string
        }
        Update: {
          category?: string
          client_id?: string
          created_at?: string
          id?: string
          insight_text?: string
        }
        Relationships: []
      }
      ai_usage: {
        Row: {
          admin_user_id: string
          client_id: string | null
          completion_tokens: number | null
          created_at: string
          estimated_cost_usd: number | null
          id: string
          model: string
          operation: string
          prompt_tokens: number | null
          total_tokens: number | null
        }
        Insert: {
          admin_user_id: string
          client_id?: string | null
          completion_tokens?: number | null
          created_at?: string
          estimated_cost_usd?: number | null
          id?: string
          model: string
          operation: string
          prompt_tokens?: number | null
          total_tokens?: number | null
        }
        Update: {
          admin_user_id?: string
          client_id?: string | null
          completion_tokens?: number | null
          created_at?: string
          estimated_cost_usd?: number | null
          id?: string
          model?: string
          operation?: string
          prompt_tokens?: number | null
          total_tokens?: number | null
        }
        Relationships: []
      }
      dashboard_data: {
        Row: {
          ap_ar_detail: string | null
          ap_ar_status: string
          cash_balance: number | null
          cash_position: string
          cash_position_detail: string | null
          client_id: string
          created_at: string
          monthly_close: string
          monthly_close_detail: string | null
          monthly_close_status: string | null
          net_income: number | null
          net_revenue: number | null
          period: string | null
          total_ap: number | null
          total_ar: number | null
          updated_at: string
        }
        Insert: {
          ap_ar_detail?: string | null
          ap_ar_status?: string
          cash_balance?: number | null
          cash_position?: string
          cash_position_detail?: string | null
          client_id: string
          created_at?: string
          monthly_close?: string
          monthly_close_detail?: string | null
          monthly_close_status?: string | null
          net_income?: number | null
          net_revenue?: number | null
          period?: string | null
          total_ap?: number | null
          total_ar?: number | null
          updated_at?: string
        }
        Update: {
          ap_ar_detail?: string | null
          ap_ar_status?: string
          cash_balance?: number | null
          cash_position?: string
          cash_position_detail?: string | null
          client_id?: string
          created_at?: string
          monthly_close?: string
          monthly_close_detail?: string | null
          monthly_close_status?: string | null
          net_income?: number | null
          net_revenue?: number | null
          period?: string | null
          total_ap?: number | null
          total_ar?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_data_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          client_id: string
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          uploaded_by: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          uploaded_by?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          company_name: string
          company_type: string
          created_at: string
          first_name: string
          help_with: string
          id: string
          last_name: string
          message: string | null
          num_locations: string
          source: string
          work_email: string
        }
        Insert: {
          company_name: string
          company_type: string
          created_at?: string
          first_name: string
          help_with: string
          id?: string
          last_name: string
          message?: string | null
          num_locations: string
          source?: string
          work_email: string
        }
        Update: {
          company_name?: string
          company_type?: string
          created_at?: string
          first_name?: string
          help_with?: string
          id?: string
          last_name?: string
          message?: string | null
          num_locations?: string
          source?: string
          work_email?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          author_id: string
          author_name: string | null
          author_role: string
          body: string
          client_id: string
          created_at: string
          id: string
        }
        Insert: {
          author_id: string
          author_name?: string | null
          author_role: string
          body: string
          client_id: string
          created_at?: string
          id?: string
        }
        Update: {
          author_id?: string
          author_name?: string | null
          author_role?: string
          body?: string
          client_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      notes_read_state: {
        Row: {
          client_id: string
          last_read_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          last_read_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          last_read_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      periods: {
        Row: {
          cash_balance: number | null
          client_id: string
          created_at: string
          document_id: string | null
          gross_margin: number | null
          id: string
          net_income: number | null
          net_revenue: number | null
          period_end: string
          total_ap: number | null
          total_ar: number | null
          updated_at: string
        }
        Insert: {
          cash_balance?: number | null
          client_id: string
          created_at?: string
          document_id?: string | null
          gross_margin?: number | null
          id?: string
          net_income?: number | null
          net_revenue?: number | null
          period_end: string
          total_ap?: number | null
          total_ar?: number | null
          updated_at?: string
        }
        Update: {
          cash_balance?: number | null
          client_id?: string
          created_at?: string
          document_id?: string | null
          gross_margin?: number | null
          id?: string
          net_income?: number | null
          net_revenue?: number | null
          period_end?: string
          total_ap?: number | null
          total_ar?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "periods_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "periods_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
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
      widget_prefs: {
        Row: {
          updated_at: string
          user_id: string
          widget_ids: string[]
        }
        Insert: {
          updated_at?: string
          user_id: string
          widget_ids?: string[]
        }
        Update: {
          updated_at?: string
          user_id?: string
          widget_ids?: string[]
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
      is_aal2: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "client"
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
      app_role: ["admin", "client"],
    },
  },
} as const
