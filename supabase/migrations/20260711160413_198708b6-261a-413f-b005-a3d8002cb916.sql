
CREATE TABLE public.ai_route_preview_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cidade TEXT NOT NULL,
  bairro TEXT NOT NULL DEFAULT '',
  roteiro TEXT NOT NULL,
  structured JSONB,
  meta JSONB,
  params JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, cidade, bairro)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_route_preview_drafts TO authenticated;
GRANT ALL ON public.ai_route_preview_drafts TO service_role;

ALTER TABLE public.ai_route_preview_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own preview drafts"
  ON public.ai_route_preview_drafts FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_ai_route_preview_drafts_updated_at
  BEFORE UPDATE ON public.ai_route_preview_drafts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX ai_route_preview_drafts_user_updated_idx
  ON public.ai_route_preview_drafts (user_id, updated_at DESC);
