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
      attendant_incentives: {
        Row: {
          audit_hash: string | null
          calculated_at: string
          clinic_external_id: string | null
          clinic_user_id: string
          consultations_generated: number | null
          cpfs_generated: number | null
          created_at: string
          id: string
          incentive_amount: number | null
          incentive_type: string
          job_id: string | null
          paid_amount_generated: number | null
          paid_at: string | null
          pix_key: string | null
          pix_tier: string | null
          reference_month: string
          reference_week: number | null
          status: string
          updated_at: string
        }
        Insert: {
          audit_hash?: string | null
          calculated_at?: string
          clinic_external_id?: string | null
          clinic_user_id: string
          consultations_generated?: number | null
          cpfs_generated?: number | null
          created_at?: string
          id?: string
          incentive_amount?: number | null
          incentive_type: string
          job_id?: string | null
          paid_amount_generated?: number | null
          paid_at?: string | null
          pix_key?: string | null
          pix_tier?: string | null
          reference_month: string
          reference_week?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          audit_hash?: string | null
          calculated_at?: string
          clinic_external_id?: string | null
          clinic_user_id?: string
          consultations_generated?: number | null
          cpfs_generated?: number | null
          created_at?: string
          id?: string
          incentive_amount?: number | null
          incentive_type?: string
          job_id?: string | null
          paid_amount_generated?: number | null
          paid_at?: string | null
          pix_key?: string | null
          pix_tier?: string | null
          reference_month?: string
          reference_week?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      contract_history: {
        Row: {
          contract_id: string
          created_at: string
          date: string
          id: string
          observation: string
          status: string
          type: string
          user_id: string
          user_name: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          date?: string
          id?: string
          observation?: string
          status?: string
          type?: string
          user_id: string
          user_name: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          date?: string
          id?: string
          observation?: string
          status?: string
          type?: string
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_history_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          amount_released: number
          approved_at: string
          bank_name: string
          cancel_reason: string | null
          cancelled_at: string | null
          contract_status: string
          cpf: string
          created_at: string
          expired_at: string | null
          id: string
          installment_value: number
          lead_id: string | null
          link_generated_at: string
          paid_at: string | null
          patient_name: string
          pending_reason: string | null
          proposal_number: string
          proposal_status: string
          signature_link: string
          signature_started_at: string | null
          signed_at: string | null
          term_months: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_released?: number
          approved_at?: string
          bank_name: string
          cancel_reason?: string | null
          cancelled_at?: string | null
          contract_status?: string
          cpf: string
          created_at?: string
          expired_at?: string | null
          id?: string
          installment_value?: number
          lead_id?: string | null
          link_generated_at?: string
          paid_at?: string | null
          patient_name: string
          pending_reason?: string | null
          proposal_number: string
          proposal_status?: string
          signature_link?: string
          signature_started_at?: string | null
          signed_at?: string | null
          term_months?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_released?: number
          approved_at?: string
          bank_name?: string
          cancel_reason?: string | null
          cancelled_at?: string | null
          contract_status?: string
          cpf?: string
          created_at?: string
          expired_at?: string | null
          id?: string
          installment_value?: number
          lead_id?: string | null
          link_generated_at?: string
          paid_at?: string | null
          patient_name?: string
          pending_reason?: string | null
          proposal_number?: string
          proposal_status?: string
          signature_link?: string
          signature_started_at?: string | null
          signed_at?: string | null
          term_months?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      master_network_metrics: {
        Row: {
          active_network_partners: number
          created_at: string
          id: string
          idr_score: number | null
          master_partner_id: string
          metric_date: string
          network_approvals: number
          network_clinics_active: number
          network_clinics_total: number
          network_consultations: number
          network_paid_amount: number
          network_paid_contracts: number
          override_amount: number | null
          total_network_partners: number
        }
        Insert: {
          active_network_partners?: number
          created_at?: string
          id?: string
          idr_score?: number | null
          master_partner_id: string
          metric_date: string
          network_approvals?: number
          network_clinics_active?: number
          network_clinics_total?: number
          network_consultations?: number
          network_paid_amount?: number
          network_paid_contracts?: number
          override_amount?: number | null
          total_network_partners?: number
        }
        Update: {
          active_network_partners?: number
          created_at?: string
          id?: string
          idr_score?: number | null
          master_partner_id?: string
          metric_date?: string
          network_approvals?: number
          network_clinics_active?: number
          network_clinics_total?: number
          network_consultations?: number
          network_paid_amount?: number
          network_paid_contracts?: number
          override_amount?: number | null
          total_network_partners?: number
        }
        Relationships: [
          {
            foreignKeyName: "master_network_metrics_master_partner_id_fkey"
            columns: ["master_partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_alerts: {
        Row: {
          action_taken: string | null
          alert_date: string
          alert_type: string
          clinic_relation_id: string | null
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          partner_id: string
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          title: string
        }
        Insert: {
          action_taken?: string | null
          alert_date?: string
          alert_type: string
          clinic_relation_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          partner_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title: string
        }
        Update: {
          action_taken?: string | null
          alert_date?: string
          alert_type?: string
          clinic_relation_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          partner_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_alerts_clinic_relation_id_fkey"
            columns: ["clinic_relation_id"]
            isOneToOne: false
            referencedRelation: "partner_clinic_relations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_alerts_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_clinic_relations: {
        Row: {
          approvals_count: number
          clinic_external_id: string | null
          clinic_name: string
          consultations_count: number
          created_at: string
          id: string
          is_active: boolean
          is_qualified: boolean
          paid_count: number
          partner_id: string
          qualified_at: string | null
          registered_via_link_id: string | null
          updated_at: string
        }
        Insert: {
          approvals_count?: number
          clinic_external_id?: string | null
          clinic_name: string
          consultations_count?: number
          created_at?: string
          id?: string
          is_active?: boolean
          is_qualified?: boolean
          paid_count?: number
          partner_id: string
          qualified_at?: string | null
          registered_via_link_id?: string | null
          updated_at?: string
        }
        Update: {
          approvals_count?: number
          clinic_external_id?: string | null
          clinic_name?: string
          consultations_count?: number
          created_at?: string
          id?: string
          is_active?: boolean
          is_qualified?: boolean
          paid_count?: number
          partner_id?: string
          qualified_at?: string | null
          registered_via_link_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_clinic_relations_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_clinic_relations_registered_via_link_id_fkey"
            columns: ["registered_via_link_id"]
            isOneToOne: false
            referencedRelation: "partner_links"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_commissions: {
        Row: {
          approved_at: string | null
          audit_hash: string | null
          beneficiary_partner_id: string
          calculated_at: string
          clinic_external_id: string | null
          commission_amount: number
          commission_rate: number
          commission_type: string
          created_at: string
          id: string
          job_id: string | null
          net_paid_amount: number
          paid_at: string | null
          partner_id: string
          reference_month: string
          source_paid_contract_id: string
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          audit_hash?: string | null
          beneficiary_partner_id: string
          calculated_at?: string
          clinic_external_id?: string | null
          commission_amount: number
          commission_rate: number
          commission_type: string
          created_at?: string
          id?: string
          job_id?: string | null
          net_paid_amount: number
          paid_at?: string | null
          partner_id: string
          reference_month: string
          source_paid_contract_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          audit_hash?: string | null
          beneficiary_partner_id?: string
          calculated_at?: string
          clinic_external_id?: string | null
          commission_amount?: number
          commission_rate?: number
          commission_type?: string
          created_at?: string
          id?: string
          job_id?: string | null
          net_paid_amount?: number
          paid_at?: string | null
          partner_id?: string
          reference_month?: string
          source_paid_contract_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_commissions_beneficiary_partner_id_fkey"
            columns: ["beneficiary_partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_commissions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_config_history: {
        Row: {
          changed_by: string
          config_id: string
          config_key: string
          created_at: string
          id: string
          new_value: Json
          old_value: Json | null
        }
        Insert: {
          changed_by: string
          config_id: string
          config_key: string
          created_at?: string
          id?: string
          new_value: Json
          old_value?: Json | null
        }
        Update: {
          changed_by?: string
          config_id?: string
          config_key?: string
          created_at?: string
          id?: string
          new_value?: Json
          old_value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_config_history_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "partner_system_config"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_links: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          link_code: string
          link_type: string
          link_url: string
          max_uses: number | null
          partner_id: string
          uses_count: number
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          link_code: string
          link_type?: string
          link_url: string
          max_uses?: number | null
          partner_id: string
          uses_count?: number
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          link_code?: string
          link_type?: string
          link_url?: string
          max_uses?: number | null
          partner_id?: string
          uses_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "partner_links_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_metrics_daily: {
        Row: {
          active_clinics: number
          approval_rate: number | null
          approvals: number
          consultations: number
          created_at: string
          id: string
          metric_date: string
          paid_amount: number
          paid_contracts: number
          paid_rate: number | null
          partner_id: string
          potential_lost_amount: number | null
          qualified_clinics: number
          seh_score: number | null
          total_clinics_direct: number
        }
        Insert: {
          active_clinics?: number
          approval_rate?: number | null
          approvals?: number
          consultations?: number
          created_at?: string
          id?: string
          metric_date: string
          paid_amount?: number
          paid_contracts?: number
          paid_rate?: number | null
          partner_id: string
          potential_lost_amount?: number | null
          qualified_clinics?: number
          seh_score?: number | null
          total_clinics_direct?: number
        }
        Update: {
          active_clinics?: number
          approval_rate?: number | null
          approvals?: number
          consultations?: number
          created_at?: string
          id?: string
          metric_date?: string
          paid_amount?: number
          paid_contracts?: number
          paid_rate?: number | null
          partner_id?: string
          potential_lost_amount?: number | null
          qualified_clinics?: number
          seh_score?: number | null
          total_clinics_direct?: number
        }
        Relationships: [
          {
            foreignKeyName: "partner_metrics_daily_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_network: {
        Row: {
          child_partner_id: string
          created_at: string
          id: string
          is_active: boolean
          linked_at: string
          parent_partner_id: string
          relationship_type: string
          unlinked_at: string | null
        }
        Insert: {
          child_partner_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          linked_at?: string
          parent_partner_id: string
          relationship_type?: string
          unlinked_at?: string | null
        }
        Update: {
          child_partner_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          linked_at?: string
          parent_partner_id?: string
          relationship_type?: string
          unlinked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_network_child_partner_id_fkey"
            columns: ["child_partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_network_parent_partner_id_fkey"
            columns: ["parent_partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_system_config: {
        Row: {
          category: string
          config_key: string
          config_value: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category?: string
          config_key: string
          config_value: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: string
          config_key?: string
          config_value?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      partners: {
        Row: {
          activated_at: string | null
          categoria: string | null
          created_at: string
          current_level: string
          document_number: string
          email: string
          id: string
          idr_score: number | null
          legal_name: string
          monthly_relationship_clinics: number | null
          onboarded_at: string | null
          person_type: string
          phone: string | null
          region_city: string | null
          region_state: string | null
          seh_score: number | null
          status: string
          suspended_at: string | null
          type: string
          updated_at: string
          user_id: string
          years_in_health_market: number | null
        }
        Insert: {
          activated_at?: string | null
          categoria?: string | null
          created_at?: string
          current_level?: string
          document_number: string
          email: string
          id?: string
          idr_score?: number | null
          legal_name: string
          monthly_relationship_clinics?: number | null
          onboarded_at?: string | null
          person_type?: string
          phone?: string | null
          region_city?: string | null
          region_state?: string | null
          seh_score?: number | null
          status?: string
          suspended_at?: string | null
          type?: string
          updated_at?: string
          user_id: string
          years_in_health_market?: number | null
        }
        Update: {
          activated_at?: string | null
          categoria?: string | null
          created_at?: string
          current_level?: string
          document_number?: string
          email?: string
          id?: string
          idr_score?: number | null
          legal_name?: string
          monthly_relationship_clinics?: number | null
          onboarded_at?: string | null
          person_type?: string
          phone?: string | null
          region_city?: string | null
          region_state?: string | null
          seh_score?: number | null
          status?: string
          suspended_at?: string | null
          type?: string
          updated_at?: string
          user_id?: string
          years_in_health_market?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduled_returns: {
        Row: {
          completed: boolean
          contract_id: string
          created_at: string
          date: string
          id: string
          time: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          contract_id: string
          created_at?: string
          date: string
          id?: string
          time: string
          user_id: string
        }
        Update: {
          completed?: boolean
          contract_id?: string
          created_at?: string
          date?: string
          id?: string
          time?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_returns_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
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
          role?: Database["public"]["Enums"]["app_role"]
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
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "master"
        | "user"
        | "partner"
        | "master_partner"
        | "cs_geral"
        | "cs_exclusiva"
        | "clinic_owner"
        | "attendant"
        | "admin"
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
      app_role: [
        "master",
        "user",
        "partner",
        "master_partner",
        "cs_geral",
        "cs_exclusiva",
        "clinic_owner",
        "attendant",
        "admin",
      ],
    },
  },
} as const
