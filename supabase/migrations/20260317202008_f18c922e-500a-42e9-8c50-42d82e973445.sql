
-- Add unique constraints needed for upsert operations
ALTER TABLE public.partner_metrics_daily ADD CONSTRAINT partner_metrics_daily_partner_date_unique UNIQUE (partner_id, metric_date);
ALTER TABLE public.master_network_metrics ADD CONSTRAINT master_network_metrics_partner_date_unique UNIQUE (master_partner_id, metric_date);
ALTER TABLE public.partner_commissions ADD CONSTRAINT partner_commissions_source_beneficiary_type_unique UNIQUE (source_paid_contract_id, beneficiary_partner_id, commission_type);
ALTER TABLE public.attendant_incentives ADD CONSTRAINT attendant_incentives_user_type_month_unique UNIQUE (clinic_user_id, incentive_type, reference_month);
