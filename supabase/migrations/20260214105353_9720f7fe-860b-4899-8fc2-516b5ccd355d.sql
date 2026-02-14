
-- Create update_updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create contracts table
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id TEXT,
  patient_name TEXT NOT NULL,
  cpf TEXT NOT NULL,
  proposal_number TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  proposal_status TEXT NOT NULL DEFAULT 'Aprovada',
  amount_released NUMERIC NOT NULL DEFAULT 0,
  installment_value NUMERIC NOT NULL DEFAULT 0,
  term_months INTEGER NOT NULL DEFAULT 12,
  signature_link TEXT NOT NULL DEFAULT '',
  link_generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  contract_status TEXT NOT NULL DEFAULT 'AGUARDANDO_ASSINATURA',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  signature_started_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  pending_reason TEXT,
  cancel_reason TEXT,
  user_id UUID NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create contract_history table
CREATE TABLE public.contract_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Ligação',
  status TEXT NOT NULL DEFAULT 'Falou com paciente',
  observation TEXT NOT NULL DEFAULT '',
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create scheduled_returns table
CREATE TABLE public.scheduled_returns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_returns ENABLE ROW LEVEL SECURITY;

-- RLS policies for contracts
CREATE POLICY "Authenticated users can view contracts" ON public.contracts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert contracts" ON public.contracts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated users can update contracts" ON public.contracts FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete contracts" ON public.contracts FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for contract_history
CREATE POLICY "Authenticated users can view history" ON public.contract_history FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert history" ON public.contract_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for scheduled_returns
CREATE POLICY "Authenticated users can view returns" ON public.scheduled_returns FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert returns" ON public.scheduled_returns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated users can update returns" ON public.scheduled_returns FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
