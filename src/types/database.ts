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
      ai_usage: {
        Row: {
          cost_estimate: number | null
          created_at: string
          error_message: string | null
          id: string
          input_sample: string | null
          latency_ms: number | null
          metadata: Json | null
          model_version: string | null
          operation_type: string
          output_sample: string | null
          success: boolean
          timestamp: string
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          cost_estimate?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          input_sample?: string | null
          latency_ms?: number | null
          metadata?: Json | null
          model_version?: string | null
          operation_type: string
          output_sample?: string | null
          success: boolean
          timestamp?: string
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          cost_estimate?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          input_sample?: string | null
          latency_ms?: number | null
          metadata?: Json | null
          model_version?: string | null
          operation_type?: string
          output_sample?: string | null
          success?: boolean
          timestamp?: string
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      application_documents: {
        Row: {
          application_id: string
          created_at: string
          document_type: string
          file_name: string
          file_size: number | null
          id: string
          mime_type: string | null
          storage_path: string
        }
        Insert: {
          application_id: string
          created_at?: string
          document_type: string
          file_name: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          storage_path: string
        }
        Update: {
          application_id?: string
          created_at?: string
          document_type?: string
          file_name?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      application_notes: {
        Row: {
          application_id: string
          content: string
          created_at: string
          id: string
          note_type: string | null
          updated_at: string
        }
        Insert: {
          application_id: string
          content: string
          created_at?: string
          id?: string
          note_type?: string | null
          updated_at?: string
        }
        Update: {
          application_id?: string
          content?: string
          created_at?: string
          id?: string
          note_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_notes_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          analyzed_at: string | null
          applied_date: string | null
          company: string
          created_at: string
          deadline: string | null
          follow_up_suggestions: Json | null
          followup_suggestions_at: string | null
          id: string
          job_description: string | null
          job_type: string | null
          job_url: string | null
          location: string | null
          match_analysis: Json | null
          match_score: number | null
          notes_summary: Json | null
          position: string
          priority: string | null
          referral_name: string | null
          salary_range: Json | null
          source: string | null
          status: string
          summarized_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analyzed_at?: string | null
          applied_date?: string | null
          company: string
          created_at?: string
          deadline?: string | null
          follow_up_suggestions?: Json | null
          followup_suggestions_at?: string | null
          id?: string
          job_description?: string | null
          job_type?: string | null
          job_url?: string | null
          location?: string | null
          match_analysis?: Json | null
          match_score?: number | null
          notes_summary?: Json | null
          position: string
          priority?: string | null
          referral_name?: string | null
          salary_range?: Json | null
          source?: string | null
          status?: string
          summarized_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analyzed_at?: string | null
          applied_date?: string | null
          company?: string
          created_at?: string
          deadline?: string | null
          follow_up_suggestions?: Json | null
          followup_suggestions_at?: string | null
          id?: string
          job_description?: string | null
          job_type?: string | null
          job_url?: string | null
          location?: string | null
          match_analysis?: Json | null
          match_score?: number | null
          notes_summary?: Json | null
          position?: string
          priority?: string | null
          referral_name?: string | null
          salary_range?: Json | null
          source?: string | null
          status?: string
          summarized_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_interactions: {
        Row: {
          contact_id: string
          created_at: string
          id: string
          interaction_date: string
          interaction_type: string
          notes: string | null
        }
        Insert: {
          contact_id: string
          created_at?: string
          id?: string
          interaction_date?: string
          interaction_type: string
          notes?: string | null
        }
        Update: {
          contact_id?: string
          created_at?: string
          id?: string
          interaction_date?: string
          interaction_type?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_interactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          company: string | null
          contact_type: string | null
          created_at: string
          email: string | null
          id: string
          linkedin_url: string | null
          name: string
          notes: string | null
          phone: string | null
          position: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          contact_type?: string | null
          created_at?: string
          email?: string | null
          id?: string
          linkedin_url?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string | null
          contact_type?: string | null
          created_at?: string
          email?: string | null
          id?: string
          linkedin_url?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      insights: {
        Row: {
          content: string
          created_at: string
          id: string
          insight_type: string
          is_dismissed: boolean | null
          metadata: Json | null
          title: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          insight_type: string
          is_dismissed?: boolean | null
          metadata?: Json | null
          title: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          insight_type?: string
          is_dismissed?: boolean | null
          metadata?: Json | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          application_id: string
          completed_date: string | null
          created_at: string
          id: string
          milestone_type: string
          notes: string | null
          scheduled_date: string | null
          updated_at: string
        }
        Insert: {
          application_id: string
          completed_date?: string | null
          created_at?: string
          id?: string
          milestone_type: string
          notes?: string | null
          scheduled_date?: string | null
          updated_at?: string
        }
        Update: {
          application_id?: string
          completed_date?: string | null
          created_at?: string
          id?: string
          milestone_type?: string
          notes?: string | null
          scheduled_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          notification_type: string
          related_application_id: string | null
          scheduled_for: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          notification_type: string
          related_application_id?: string | null
          scheduled_for?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          notification_type?: string
          related_application_id?: string | null
          scheduled_for?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_application_id_fkey"
            columns: ["related_application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_parsing_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          resume_url: string
          started_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          resume_url: string
          started_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          resume_url?: string
          started_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resume_parsing_jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_education: {
        Row: {
          created_at: string
          degree: string
          end_date: string | null
          field_of_study: string | null
          gpa: number | null
          id: string
          institution: string
          is_current: boolean | null
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          degree: string
          end_date?: string | null
          field_of_study?: string | null
          gpa?: number | null
          id?: string
          institution: string
          is_current?: boolean | null
          start_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          degree?: string
          end_date?: string | null
          field_of_study?: string | null
          gpa?: number | null
          id?: string
          institution?: string
          is_current?: boolean | null
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_education_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_experience: {
        Row: {
          company: string
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          is_current: boolean | null
          position: string
          skills_used: string[] | null
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          position: string
          skills_used?: string[] | null
          start_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          position?: string
          skills_used?: string[] | null
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_experience_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          bio: string | null
          created_at: string
          github_url: string | null
          id: string
          linkedin_url: string | null
          location: string | null
          parsed_resume_data: Json | null
          phone: string | null
          portfolio_url: string | null
          preferred_job_types: string[] | null
          preferred_locations: string[] | null
          resume_parsed_at: string | null
          resume_parsing_error: string | null
          resume_url: string | null
          salary_expectation: Json | null
          skills: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          github_url?: string | null
          id?: string
          linkedin_url?: string | null
          location?: string | null
          parsed_resume_data?: Json | null
          phone?: string | null
          portfolio_url?: string | null
          preferred_job_types?: string[] | null
          preferred_locations?: string[] | null
          resume_parsed_at?: string | null
          resume_parsing_error?: string | null
          resume_url?: string | null
          salary_expectation?: Json | null
          skills?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          github_url?: string | null
          id?: string
          linkedin_url?: string | null
          location?: string | null
          parsed_resume_data?: Json | null
          phone?: string | null
          portfolio_url?: string | null
          preferred_job_types?: string[] | null
          preferred_locations?: string[] | null
          resume_parsed_at?: string | null
          resume_parsing_error?: string | null
          resume_url?: string | null
          salary_expectation?: Json | null
          skills?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_id: string
          created_at: string
          display_name: string | null
          email: string
          id: string
          photo_url: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          auth_id: string
          created_at?: string
          display_name?: string | null
          email: string
          id?: string
          photo_url?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          auth_id?: string
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          photo_url?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
