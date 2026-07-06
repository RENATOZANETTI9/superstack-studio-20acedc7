CREATE POLICY "portfolio_update_own"
  ON public.portfolio_clinics FOR UPDATE
  USING (
    partner_id = (
      SELECT id FROM public.partners
      WHERE user_id = auth.uid()
      LIMIT 1
    )
  )
  WITH CHECK (
    partner_id = (
      SELECT id FROM public.partners
      WHERE user_id = auth.uid()
      LIMIT 1
    )
  );