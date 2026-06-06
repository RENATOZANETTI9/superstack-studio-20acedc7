
CREATE TABLE public.proposal_pix_states (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proposal_id TEXT NOT NULL,
  patient_name TEXT,
  cpf TEXT,
  value NUMERIC,
  proposal_status TEXT NOT NULL DEFAULT 'aprovada',
  pix_key_type TEXT CHECK (pix_key_type IN ('cpf','telefone','email')),
  pix_key_value TEXT,
  pix_phase TEXT NOT NULL DEFAULT 'idle' CHECK (pix_phase IN ('idle','generating','ready','analyzing')),
  biometric_link TEXT,
  link_generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, proposal_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.proposal_pix_states TO authenticated;
GRANT ALL ON public.proposal_pix_states TO service_role;

ALTER TABLE public.proposal_pix_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own proposal pix states"
  ON public.proposal_pix_states
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_proposal_pix_states_updated_at
  BEFORE UPDATE ON public.proposal_pix_states
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_proposal_pix_states_user ON public.proposal_pix_states(user_id);
