CREATE TABLE IF NOT EXISTS public.portfolio_clinics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  nome text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('Clínica', 'Hospital', 'Consultório')),
  bairro text NOT NULL,
  cidade text NOT NULL,
  telefone text,
  responsavel text,
  status text NOT NULL DEFAULT 'Lead' CHECK (status IN ('Lead', 'Ativo', 'Inativo')),
  ultima_visita date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS portfolio_clinics_partner_id_idx
  ON public.portfolio_clinics(partner_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolio_clinics TO authenticated;
GRANT ALL ON public.portfolio_clinics TO service_role;

ALTER TABLE public.portfolio_clinics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "portfolio_select_own"
  ON public.portfolio_clinics FOR SELECT
  USING (
    partner_id = (
      SELECT id FROM public.partners
      WHERE user_id = auth.uid()
      LIMIT 1
    )
  );

CREATE POLICY "portfolio_insert_own"
  ON public.portfolio_clinics FOR INSERT
  WITH CHECK (
    partner_id = (
      SELECT id FROM public.partners
      WHERE user_id = auth.uid()
      LIMIT 1
    )
  );

CREATE POLICY "portfolio_delete_own"
  ON public.portfolio_clinics FOR DELETE
  USING (
    partner_id = (
      SELECT id FROM public.partners
      WHERE user_id = auth.uid()
      LIMIT 1
    )
  );

CREATE POLICY "admin_portfolio_all"
  ON public.portfolio_clinics FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_portfolio_clinics_updated_at
  BEFORE UPDATE ON public.portfolio_clinics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();