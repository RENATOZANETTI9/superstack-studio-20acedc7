CREATE TABLE public.perf_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  source TEXT NOT NULL,
  label TEXT NOT NULL,
  duration_ms NUMERIC NOT NULL,
  budget_ms NUMERIC NOT NULL,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT, SELECT ON public.perf_alerts TO authenticated;
GRANT ALL ON public.perf_alerts TO service_role;

ALTER TABLE public.perf_alerts ENABLE ROW LEVEL SECURITY;

-- Users can insert their own alerts (client-side breach reporting).
CREATE POLICY "Users insert own perf alerts"
ON public.perf_alerts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can read their own alerts. Admins/masters can read everything.
CREATE POLICY "Users read own perf alerts"
ON public.perf_alerts
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'master'::app_role)
);

CREATE INDEX idx_perf_alerts_created_at ON public.perf_alerts (created_at DESC);
CREATE INDEX idx_perf_alerts_user_id_created_at ON public.perf_alerts (user_id, created_at DESC);
CREATE INDEX idx_perf_alerts_label_created_at ON public.perf_alerts (label, created_at DESC);