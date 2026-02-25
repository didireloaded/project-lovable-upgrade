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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      channels: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          type?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          type?: string
        }
        Relationships: []
      }
      driver_presence: {
        Row: {
          heading: number | null
          last_seen: string
          lat: number | null
          lng: number | null
          speed: number | null
          user_id: string
        }
        Insert: {
          heading?: number | null
          last_seen?: string
          lat?: number | null
          lng?: number | null
          speed?: number | null
          user_id: string
        }
        Update: {
          heading?: number | null
          last_seen?: string
          lat?: number | null
          lng?: number | null
          speed?: number | null
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          channel_id: string
          content: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          channel_id: string
          content: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          content?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          ghost_mode: boolean
          id: string
          last_report_date: string | null
          rank: string
          reports_today: number
          score: number
          total_miles: number
          updated_at: string
          user_id: string
          weekly_reports: number
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          ghost_mode?: boolean
          id?: string
          last_report_date?: string | null
          rank?: string
          reports_today?: number
          score?: number
          total_miles?: number
          updated_at?: string
          user_id: string
          weekly_reports?: number
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          ghost_mode?: boolean
          id?: string
          last_report_date?: string | null
          rank?: string
          reports_today?: number
          score?: number
          total_miles?: number
          updated_at?: string
          user_id?: string
          weekly_reports?: number
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          confirmed_by: number
          created_at: string
          description: string | null
          expires_at: string
          id: string
          lat: number
          lng: number
          photo_url: string | null
          type: string
          user_id: string
        }
        Insert: {
          confirmed_by?: number
          created_at?: string
          description?: string | null
          expires_at?: string
          id?: string
          lat: number
          lng: number
          photo_url?: string | null
          type: string
          user_id: string
        }
        Update: {
          confirmed_by?: number
          created_at?: string
          description?: string | null
          expires_at?: string
          id?: string
          lat?: number
          lng?: number
          photo_url?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      sos_events: {
        Row: {
          created_at: string
          id: string
          lat: number | null
          lng: number | null
          message: string | null
          resolved: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          message?: string | null
          resolved?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          message?: string | null
          resolved?: boolean
          user_id?: string
        }
        Relationships: []
      }
      voice_rooms: {
        Row: {
          created_at: string
          created_by: string
          daily_room_url: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          daily_room_url?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          daily_room_url?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_report_score: {
        Args: { p_points: number; p_report_type: string }
        Returns: Json
      }
      confirm_report: { Args: { p_report_id: string }; Returns: undefined }
      earth: { Args: never; Returns: number }
      nearby_drivers: {
        Args: { radius_km?: number; user_lat: number; user_lng: number }
        Returns: {
          avatar_url: string
          display_name: string
          heading: number
          last_seen: string
          lat: number
          lng: number
          speed: number
          user_id: string
        }[]
      }
      reports_within_radius: {
        Args: { radius_km?: number; user_lat: number; user_lng: number }
        Returns: {
          confirmed_by: number
          created_at: string
          description: string | null
          expires_at: string
          id: string
          lat: number
          lng: number
          photo_url: string | null
          type: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "reports"
          isOneToOne: false
          isSetofReturn: true
        }
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
