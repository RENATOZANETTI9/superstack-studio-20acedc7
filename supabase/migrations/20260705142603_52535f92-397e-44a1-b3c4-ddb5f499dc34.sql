
-- Tabela de rate limit (log de tentativas)
CREATE TABLE public.password_reset_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,          -- email ou ip
  action text NOT NULL,              -- 'request' ou 'complete'
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_prl_identifier_action_time
  ON public.password_reset_rate_limits(identifier, action, created_at DESC);

GRANT ALL ON public.password_reset_rate_limits TO service_role;
-- Não expor ao frontend
ALTER TABLE public.password_reset_rate_limits ENABLE ROW LEVEL SECURITY;
-- Sem policies para authenticated/anon => bloqueado por padrão

-- Tabela de tokens de recovery já usados (single-use)
CREATE TABLE public.used_recovery_tokens (
  session_id text PRIMARY KEY,       -- claim session_id do JWT de recovery
  user_id uuid NOT NULL,
  used_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL     -- claim exp do JWT
);
CREATE INDEX idx_urt_user ON public.used_recovery_tokens(user_id);
CREATE INDEX idx_urt_expires ON public.used_recovery_tokens(expires_at);

GRANT SELECT ON public.used_recovery_tokens TO authenticated;
GRANT ALL ON public.used_recovery_tokens TO service_role;
ALTER TABLE public.used_recovery_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view used recovery tokens"
ON public.used_recovery_tokens
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master'));

-- Função helper para consultar rate limit (service_role usa direto, mas útil para SQL manual)
CREATE OR REPLACE FUNCTION public.count_recent_password_reset_attempts(
  _identifier text,
  _action text,
  _window_seconds int DEFAULT 900
) RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int
  FROM public.password_reset_rate_limits
  WHERE identifier = _identifier
    AND action = _action
    AND created_at > (now() - make_interval(secs => _window_seconds))
$$;

-- Revogar execução pública desta função (é auxiliar interna)
REVOKE ALL ON FUNCTION public.count_recent_password_reset_attempts(text, text, int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.count_recent_password_reset_attempts(text, text, int) FROM anon;
REVOKE ALL ON FUNCTION public.count_recent_password_reset_attempts(text, text, int) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.count_recent_password_reset_attempts(text, text, int) TO service_role;
