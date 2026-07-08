CREATE INDEX IF NOT EXISTS idx_partners_user_id
  ON public.partners (user_id);

CREATE INDEX IF NOT EXISTS idx_partner_commissions_beneficiary_month
  ON public.partner_commissions (beneficiary_partner_id, reference_month);

CREATE INDEX IF NOT EXISTS idx_partner_commissions_beneficiary_paid_at
  ON public.partner_commissions (beneficiary_partner_id, paid_at)
  WHERE status = 'PAID';