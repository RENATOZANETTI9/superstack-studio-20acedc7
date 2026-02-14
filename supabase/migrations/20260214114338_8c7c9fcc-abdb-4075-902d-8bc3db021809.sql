
-- Fix overly permissive RLS policies on contracts
DROP POLICY "Authenticated users can view contracts" ON public.contracts;
CREATE POLICY "Users can view their contracts" ON public.contracts
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'master'));

DROP POLICY "Authenticated users can update contracts" ON public.contracts;
CREATE POLICY "Users can update their contracts" ON public.contracts
  FOR UPDATE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'master'));

-- Fix overly permissive RLS policies on contract_history
DROP POLICY "Authenticated users can view history" ON public.contract_history;
CREATE POLICY "Users can view their history" ON public.contract_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.contracts WHERE id = contract_id AND user_id = auth.uid())
    OR public.has_role(auth.uid(), 'master')
  );

-- Fix overly permissive RLS policies on scheduled_returns
DROP POLICY "Authenticated users can view returns" ON public.scheduled_returns;
CREATE POLICY "Users can view their returns" ON public.scheduled_returns
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.contracts WHERE id = contract_id AND user_id = auth.uid())
    OR public.has_role(auth.uid(), 'master')
  );

DROP POLICY "Authenticated users can update returns" ON public.scheduled_returns;
CREATE POLICY "Users can update their returns" ON public.scheduled_returns
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.contracts WHERE id = contract_id AND user_id = auth.uid())
    OR public.has_role(auth.uid(), 'master')
  );
