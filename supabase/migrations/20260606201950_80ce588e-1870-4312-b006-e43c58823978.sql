CREATE TABLE public.proposal_pix_audit (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  proposal_id text NOT NULL,
  actor_id uuid,
  actor_email text,
  from_phase text,
  to_phase text NOT NULL,
  pix_key_type text,
  pix_key_value text,
  biometric_link text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_proposal_pix_audit_user ON public.proposal_pix_audit(user_id, proposal_id, created_at DESC);

GRANT SELECT, INSERT ON public.proposal_pix_audit TO authenticated;
GRANT ALL ON public.proposal_pix_audit TO service_role;

ALTER TABLE public.proposal_pix_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own pix audit"
  ON public.proposal_pix_audit FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own pix audit"
  ON public.proposal_pix_audit FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
