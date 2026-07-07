
-- Last generated AI route per user
CREATE TABLE public.ai_route_generations (
  user_id uuid PRIMARY KEY,
  roteiro text NOT NULL,
  params jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_route_generations TO authenticated;
GRANT ALL ON public.ai_route_generations TO service_role;

ALTER TABLE public.ai_route_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own generations select" ON public.ai_route_generations
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own generations insert" ON public.ai_route_generations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own generations update" ON public.ai_route_generations
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own generations delete" ON public.ai_route_generations
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER ai_route_generations_updated_at
  BEFORE UPDATE ON public.ai_route_generations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Status per route item (keyed by hash of the item text so it survives regenerations)
CREATE TABLE public.ai_route_item_status (
  user_id uuid NOT NULL,
  item_key text NOT NULL,
  item_text text NOT NULL,
  status text NOT NULL CHECK (status IN ('pendente','conversamos','nao')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_route_item_status TO authenticated;
GRANT ALL ON public.ai_route_item_status TO service_role;

ALTER TABLE public.ai_route_item_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own items select" ON public.ai_route_item_status
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own items insert" ON public.ai_route_item_status
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own items update" ON public.ai_route_item_status
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own items delete" ON public.ai_route_item_status
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER ai_route_item_status_updated_at
  BEFORE UPDATE ON public.ai_route_item_status
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX ai_route_item_status_user_updated_idx
  ON public.ai_route_item_status (user_id, updated_at DESC);
