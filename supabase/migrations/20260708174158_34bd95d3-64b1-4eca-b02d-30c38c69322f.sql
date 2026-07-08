CREATE TABLE public.tavily_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  bairro TEXT NOT NULL,
  especialidade TEXT,
  tipo TEXT,
  results JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days')
);
CREATE INDEX idx_tavily_cache_key ON public.tavily_cache(cache_key);
CREATE INDEX idx_tavily_cache_expires ON public.tavily_cache(expires_at);
GRANT ALL ON public.tavily_cache TO service_role;
ALTER TABLE public.tavily_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only access to tavily_cache"
ON public.tavily_cache FOR ALL
USING (false) WITH CHECK (false);