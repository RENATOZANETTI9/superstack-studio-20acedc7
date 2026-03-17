
-- =====================================================
-- MIGRATION 001: create_partners
-- =====================================================
CREATE TABLE public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'PARTNER' CHECK (type IN ('PARTNER', 'MASTER')),
  person_type TEXT NOT NULL DEFAULT 'CPF' CHECK (person_type IN ('CPF', 'CNPJ')),
  document_number TEXT NOT NULL,
  legal_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  region_state TEXT,
  region_city TEXT,
  years_in_health_market INTEGER DEFAULT 0,
  monthly_relationship_clinics INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'SUSPENDED', 'INACTIVE')),
  current_level TEXT NOT NULL DEFAULT 'BRONZE' CHECK (current_level IN ('BRONZE', 'PRATA', 'OURO', 'ELITE')),
  seh_score NUMERIC(5,2) DEFAULT 0,
  idr_score NUMERIC(5,2) DEFAULT 0,
  onboarded_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Partners can view own record" ON public.partners
  FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin and master can insert partners" ON public.partners
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin and master can update partners" ON public.partners
  FOR UPDATE USING (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR auth.uid() = user_id);

CREATE POLICY "Admin can delete partners" ON public.partners
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- MIGRATION 002: create_partner_links
-- =====================================================
CREATE TABLE public.partner_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL DEFAULT 'CLINIC_REGISTRATION' CHECK (link_type IN ('CLINIC_REGISTRATION', 'PARTNER_INVITATION', 'NETWORK_INVITATION')),
  link_code TEXT NOT NULL UNIQUE,
  link_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  uses_count INTEGER NOT NULL DEFAULT 0,
  max_uses INTEGER,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view own links" ON public.partner_links
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.partners WHERE id = partner_links.partner_id AND user_id = auth.uid())
    OR has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Partners can insert own links" ON public.partner_links
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.partners WHERE id = partner_links.partner_id AND user_id = auth.uid())
    OR has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Partners can update own links" ON public.partner_links
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.partners WHERE id = partner_links.partner_id AND user_id = auth.uid())
    OR has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
  );

-- =====================================================
-- MIGRATION 003: create_partner_network
-- =====================================================
CREATE TABLE public.partner_network (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  child_partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL DEFAULT 'INDICATION' CHECK (relationship_type IN ('INDICATION', 'OVERRIDE')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  unlinked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(parent_partner_id, child_partner_id)
);

ALTER TABLE public.partner_network ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view own network" ON public.partner_network
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.partners WHERE id = partner_network.parent_partner_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.partners WHERE id = partner_network.child_partner_id AND user_id = auth.uid())
    OR has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admin can manage network" ON public.partner_network
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can update network" ON public.partner_network
  FOR UPDATE USING (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- MIGRATION 004: create_partner_clinic_relations
-- =====================================================
CREATE TABLE public.partner_clinic_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  clinic_name TEXT NOT NULL,
  clinic_external_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_qualified BOOLEAN NOT NULL DEFAULT false,
  qualified_at TIMESTAMPTZ,
  registered_via_link_id UUID REFERENCES public.partner_links(id),
  consultations_count INTEGER NOT NULL DEFAULT 0,
  approvals_count INTEGER NOT NULL DEFAULT 0,
  paid_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_clinic_relations ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_partner_clinic_relations_updated_at
  BEFORE UPDATE ON public.partner_clinic_relations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Partners can view own clinics" ON public.partner_clinic_relations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.partners WHERE id = partner_clinic_relations.partner_id AND user_id = auth.uid())
    OR has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'cs_geral'::app_role) OR has_role(auth.uid(), 'cs_exclusiva'::app_role)
  );

CREATE POLICY "Partners can insert clinics" ON public.partner_clinic_relations
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.partners WHERE id = partner_clinic_relations.partner_id AND user_id = auth.uid())
    OR has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Partners can update clinics" ON public.partner_clinic_relations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.partners WHERE id = partner_clinic_relations.partner_id AND user_id = auth.uid())
    OR has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE INDEX idx_partner_clinic_relations_active ON public.partner_clinic_relations (partner_id, is_active);

-- =====================================================
-- MIGRATION 005: create_partner_metrics_daily
-- =====================================================
CREATE TABLE public.partner_metrics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  total_clinics_direct INTEGER NOT NULL DEFAULT 0,
  active_clinics INTEGER NOT NULL DEFAULT 0,
  qualified_clinics INTEGER NOT NULL DEFAULT 0,
  consultations INTEGER NOT NULL DEFAULT 0,
  approvals INTEGER NOT NULL DEFAULT 0,
  paid_contracts INTEGER NOT NULL DEFAULT 0,
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  approval_rate NUMERIC(5,2) DEFAULT 0,
  paid_rate NUMERIC(5,2) DEFAULT 0,
  seh_score NUMERIC(5,2) DEFAULT 0,
  potential_lost_amount NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(partner_id, metric_date)
);

ALTER TABLE public.partner_metrics_daily ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_partner_metrics_daily_lookup ON public.partner_metrics_daily (partner_id, metric_date DESC);

CREATE POLICY "Partners can view own metrics" ON public.partner_metrics_daily
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.partners WHERE id = partner_metrics_daily.partner_id AND user_id = auth.uid())
    OR has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'cs_geral'::app_role)
  );

CREATE POLICY "System can insert metrics" ON public.partner_metrics_daily
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can update metrics" ON public.partner_metrics_daily
  FOR UPDATE USING (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- MIGRATION 006: create_master_network_metrics
-- =====================================================
CREATE TABLE public.master_network_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  total_network_partners INTEGER NOT NULL DEFAULT 0,
  active_network_partners INTEGER NOT NULL DEFAULT 0,
  network_clinics_total INTEGER NOT NULL DEFAULT 0,
  network_clinics_active INTEGER NOT NULL DEFAULT 0,
  network_consultations INTEGER NOT NULL DEFAULT 0,
  network_approvals INTEGER NOT NULL DEFAULT 0,
  network_paid_contracts INTEGER NOT NULL DEFAULT 0,
  network_paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  idr_score NUMERIC(5,2) DEFAULT 0,
  override_amount NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(master_partner_id, metric_date)
);

ALTER TABLE public.master_network_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master can view own network metrics" ON public.master_network_metrics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.partners WHERE id = master_network_metrics.master_partner_id AND user_id = auth.uid())
    OR has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "System can insert network metrics" ON public.master_network_metrics
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can update network metrics" ON public.master_network_metrics
  FOR UPDATE USING (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- MIGRATION 007: create_commissions
-- =====================================================
CREATE TABLE public.partner_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  beneficiary_partner_id UUID NOT NULL REFERENCES public.partners(id),
  commission_type TEXT NOT NULL CHECK (commission_type IN ('DIRECT', 'OVERRIDE', 'CS_INTERNAL')),
  source_paid_contract_id TEXT NOT NULL,
  clinic_external_id TEXT,
  net_paid_amount NUMERIC(12,2) NOT NULL,
  commission_rate NUMERIC(5,4) NOT NULL,
  commission_amount NUMERIC(12,2) NOT NULL,
  reference_month TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'CALCULATED' CHECK (status IN ('CALCULATED', 'APPROVED', 'PAID', 'CANCELLED')),
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  job_id TEXT,
  audit_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(source_paid_contract_id, beneficiary_partner_id, commission_type)
);

ALTER TABLE public.partner_commissions ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_partner_commissions_updated_at
  BEFORE UPDATE ON public.partner_commissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_partner_commissions_monthly ON public.partner_commissions (reference_month, status);

CREATE POLICY "Partners can view own commissions" ON public.partner_commissions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.partners WHERE id = partner_commissions.beneficiary_partner_id AND user_id = auth.uid())
    OR has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "System can insert commissions" ON public.partner_commissions
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can update commissions" ON public.partner_commissions
  FOR UPDATE USING (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- MIGRATION 008: create_attendant_incentives
-- =====================================================
CREATE TABLE public.attendant_incentives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_user_id UUID NOT NULL,
  clinic_external_id TEXT,
  incentive_type TEXT NOT NULL CHECK (incentive_type IN ('MIMO_SEMANAL', 'PIX_MENSAL')),
  reference_month TEXT NOT NULL,
  reference_week INTEGER,
  cpfs_generated INTEGER DEFAULT 0,
  consultations_generated INTEGER DEFAULT 0,
  paid_amount_generated NUMERIC(12,2) DEFAULT 0,
  incentive_amount NUMERIC(12,2) DEFAULT 0,
  pix_tier TEXT,
  status TEXT NOT NULL DEFAULT 'CALCULATED' CHECK (status IN ('CALCULATED', 'READY_FOR_PAYOUT', 'PAID', 'CANCELLED')),
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ,
  pix_key TEXT,
  job_id TEXT,
  audit_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(clinic_user_id, reference_month, incentive_type, reference_week)
);

ALTER TABLE public.attendant_incentives ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_attendant_incentives_updated_at
  BEFORE UPDATE ON public.attendant_incentives
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_attendant_incentives_lookup ON public.attendant_incentives (clinic_user_id, reference_month);

CREATE POLICY "Attendants can view own incentives" ON public.attendant_incentives
  FOR SELECT USING (
    auth.uid() = clinic_user_id
    OR has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "System can insert incentives" ON public.attendant_incentives
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can update incentives" ON public.attendant_incentives
  FOR UPDATE USING (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- MIGRATION 009: create_partner_alerts
-- =====================================================
CREATE TABLE public.partner_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  clinic_relation_id UUID REFERENCES public.partner_clinic_relations(id),
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'LOW_DAILY_VOLUME', 'DROPPED_BELOW_AVERAGE', 'UNCONVERTED_APPROVAL',
    'INACTIVE_CLINIC_RISK', 'LEVEL_AT_RISK', 'QUALIFICATION_OPPORTUNITY'
  )),
  alert_date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  action_taken TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_alerts ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_partner_alerts_daily ON public.partner_alerts (partner_id, alert_date DESC, resolved_at);

CREATE POLICY "Partners can view own alerts" ON public.partner_alerts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.partners WHERE id = partner_alerts.partner_id AND user_id = auth.uid())
    OR has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'cs_geral'::app_role) OR has_role(auth.uid(), 'cs_exclusiva'::app_role)
  );

CREATE POLICY "System can insert alerts" ON public.partner_alerts
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "CS and admin can update alerts" ON public.partner_alerts
  FOR UPDATE USING (
    has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'cs_geral'::app_role) OR has_role(auth.uid(), 'cs_exclusiva'::app_role)
  );

-- =====================================================
-- MIGRATION 010: create_partner_system_config
-- =====================================================
CREATE TABLE public.partner_system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT NOT NULL UNIQUE,
  config_value JSONB NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'GENERAL' CHECK (category IN (
    'GENERAL', 'COMMISSION_RATES', 'LEVEL_THRESHOLDS', 'SEH_WEIGHTS',
    'PIX_TIERS', 'MIMO_TIERS', 'FEATURE_FLAGS', 'ALERT_RULES'
  )),
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_system_config ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_partner_system_config_updated_at
  BEFORE UPDATE ON public.partner_system_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Authenticated users can read config" ON public.partner_system_config
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin can insert config" ON public.partner_system_config
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Admin can update config" ON public.partner_system_config
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Admin can delete config" ON public.partner_system_config
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- CONFIG HISTORY (auditoria de alterações de config)
-- =====================================================
CREATE TABLE public.partner_config_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID NOT NULL REFERENCES public.partner_system_config(id) ON DELETE CASCADE,
  config_key TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB NOT NULL,
  changed_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_config_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view config history" ON public.partner_config_history
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "System can insert config history" ON public.partner_config_history
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));
