
CREATE TABLE public.mimo_tiers_customization_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level INTEGER NOT NULL,
  field TEXT NOT NULL CHECK (field IN ('name','image_url')),
  old_value TEXT,
  new_value TEXT,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mimo_tiers_customization_log_level ON public.mimo_tiers_customization_log(level, changed_at DESC);

GRANT SELECT, INSERT ON public.mimo_tiers_customization_log TO authenticated;
GRANT ALL ON public.mimo_tiers_customization_log TO service_role;

ALTER TABLE public.mimo_tiers_customization_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view mimo tier logs"
  ON public.mimo_tiers_customization_log
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master'));

CREATE POLICY "Authenticated can insert own mimo tier logs"
  ON public.mimo_tiers_customization_log
  FOR INSERT
  TO authenticated
  WITH CHECK (changed_by = auth.uid() OR changed_by IS NULL);
