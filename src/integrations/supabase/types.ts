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
      ai_route_generations: {
        Row: {
          created_at: string
          params: Json | null
          roteiro: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          params?: Json | null
          roteiro: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          params?: Json | null
          roteiro?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_route_item_status: {
        Row: {
          created_at: string
          item_key: string
          item_text: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          item_key: string
          item_text: string
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          item_key?: string
          item_text?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_route_preview_drafts: {
        Row: {
          bairro: string
          cidade: string
          created_at: string
          id: string
          meta: Json | null
          params: Json | null
          roteiro: string
          structured: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bairro?: string
          cidade: string
          created_at?: string
          id?: string
          meta?: Json | null
          params?: Json | null
          roteiro: string
          structured?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bairro?: string
          cidade?: string
          created_at?: string
          id?: string
          meta?: Json | null
          params?: Json | null
          roteiro?: string
          structured?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
      mimo_tiers_customization: {
        Row: {
          image_url: string | null
          level: number
          name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          image_url?: string | null
          level: number
          name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          image_url?: string | null
          level?: number
          name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      mimo_tiers_customization_log: {
        Row: {
          changed_at: string
          changed_by: string | null
          field: string
          id: string
          level: number
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          field: string
          id?: string
          level: number
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          field?: string
          id?: string
          level?: number
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: []
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
      partner_commission_status_log: {
        Row: {
          changed_at: string
          changed_by: string | null
          commission_id: string | null
          id: string
          new_status: string
          note: string | null
          old_status: string | null
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          commission_id?: string | null
          id?: string
          new_status: string
          note?: string | null
          old_status?: string | null
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          commission_id?: string | null
          id?: string
          new_status?: string
          note?: string | null
          old_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_commission_status_log_commission_id_fkey"
            columns: ["commission_id"]
            isOneToOne: false
            referencedRelation: "partner_commissions"
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
      password_reset_audit: {
        Row: {
          action: string
          actor_email: string | null
          actor_user_id: string | null
          created_at: string
          error_message: string | null
          id: string
          ip_address: string | null
          success: boolean
          target_email: string
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_user_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean
          target_email: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_user_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean
          target_email?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      password_reset_rate_limits: {
        Row: {
          action: string
          created_at: string
          id: string
          identifier: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          identifier: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          identifier?: string
        }
        Relationships: []
      }
      perf_alerts: {
        Row: {
          budget_ms: number
          context: Json
          created_at: string
          duration_ms: number
          id: string
          label: string
          source: string
          user_id: string | null
        }
        Insert: {
          budget_ms: number
          context?: Json
          created_at?: string
          duration_ms: number
          id?: string
          label: string
          source: string
          user_id?: string | null
        }
        Update: {
          budget_ms?: number
          context?: Json
          created_at?: string
          duration_ms?: number
          id?: string
          label?: string
          source?: string
          user_id?: string | null
        }
        Relationships: []
      }
      portfolio_clinics: {
        Row: {
          bairro: string
          cidade: string
          created_at: string
          id: string
          nome: string
          partner_id: string
          responsavel: string | null
          status: string
          telefone: string | null
          tipo: string
          ultima_visita: string | null
          updated_at: string
        }
        Insert: {
          bairro: string
          cidade: string
          created_at?: string
          id?: string
          nome: string
          partner_id: string
          responsavel?: string | null
          status?: string
          telefone?: string | null
          tipo: string
          ultima_visita?: string | null
          updated_at?: string
        }
        Update: {
          bairro?: string
          cidade?: string
          created_at?: string
          id?: string
          nome?: string
          partner_id?: string
          responsavel?: string | null
          status?: string
          telefone?: string | null
          tipo?: string
          ultima_visita?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_clinics_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          must_change_password: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          must_change_password?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          must_change_password?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      proposal_pix_audit: {
        Row: {
          actor_email: string | null
          actor_id: string | null
          biometric_link: string | null
          created_at: string
          error_message: string | null
          from_phase: string | null
          id: string
          pix_key_type: string | null
          pix_key_value: string | null
          proposal_id: string
          to_phase: string
          user_id: string
        }
        Insert: {
          actor_email?: string | null
          actor_id?: string | null
          biometric_link?: string | null
          created_at?: string
          error_message?: string | null
          from_phase?: string | null
          id?: string
          pix_key_type?: string | null
          pix_key_value?: string | null
          proposal_id: string
          to_phase: string
          user_id: string
        }
        Update: {
          actor_email?: string | null
          actor_id?: string | null
          biometric_link?: string | null
          created_at?: string
          error_message?: string | null
          from_phase?: string | null
          id?: string
          pix_key_type?: string | null
          pix_key_value?: string | null
          proposal_id?: string
          to_phase?: string
          user_id?: string
        }
        Relationships: []
      }
      proposal_pix_states: {
        Row: {
          biometric_link: string | null
          cpf: string | null
          created_at: string
          id: string
          link_generated_at: string | null
          patient_name: string | null
          pix_key_type: string | null
          pix_key_value: string | null
          pix_phase: string
          proposal_id: string
          proposal_status: string
          updated_at: string
          user_id: string
          value: number | null
        }
        Insert: {
          biometric_link?: string | null
          cpf?: string | null
          created_at?: string
          id?: string
          link_generated_at?: string | null
          patient_name?: string | null
          pix_key_type?: string | null
          pix_key_value?: string | null
          pix_phase?: string
          proposal_id: string
          proposal_status?: string
          updated_at?: string
          user_id: string
          value?: number | null
        }
        Update: {
          biometric_link?: string | null
          cpf?: string | null
          created_at?: string
          id?: string
          link_generated_at?: string | null
          patient_name?: string | null
          pix_key_type?: string | null
          pix_key_value?: string | null
          pix_phase?: string
          proposal_id?: string
          proposal_status?: string
          updated_at?: string
          user_id?: string
          value?: number | null
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
      system_config_change_log: {
        Row: {
          changed_at: string
          changed_by: string | null
          config_key: string
          id: string
          new_value: Json
          old_value: Json | null
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          config_key: string
          id?: string
          new_value: Json
          old_value?: Json | null
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          config_key?: string
          id?: string
          new_value?: Json
          old_value?: Json | null
        }
        Relationships: []
      }
      tavily_cache: {
        Row: {
          bairro: string
          cache_key: string
          created_at: string
          especialidade: string | null
          expires_at: string
          id: string
          results: Json
          tipo: string | null
        }
        Insert: {
          bairro: string
          cache_key: string
          created_at?: string
          especialidade?: string | null
          expires_at?: string
          id?: string
          results: Json
          tipo?: string | null
        }
        Update: {
          bairro?: string
          cache_key?: string
          created_at?: string
          especialidade?: string | null
          expires_at?: string
          id?: string
          results?: Json
          tipo?: string | null
        }
        Relationships: []
      }
      used_recovery_tokens: {
        Row: {
          expires_at: string
          session_id: string
          used_at: string
          user_id: string
        }
        Insert: {
          expires_at: string
          session_id: string
          used_at?: string
          user_id: string
        }
        Update: {
          expires_at?: string
          session_id?: string
          used_at?: string
          user_id?: string
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
      count_recent_password_reset_attempts: {
        Args: { _action: string; _identifier: string; _window_seconds?: number }
        Returns: number
      }
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
        | "representante"
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
        "representante",
      ],
    },
  },
} as const
