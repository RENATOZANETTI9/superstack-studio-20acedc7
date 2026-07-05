
CREATE TABLE public.password_reset_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  target_email text NOT NULL,
  action text NOT NULL CHECK (action IN ('send_reset_email', 'reset_password', 'self_request')),
  success boolean NOT NULL DEFAULT true,
  error_message text,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_password_reset_audit_created_at ON public.password_reset_audit(created_at DESC);
CREATE INDEX idx_password_reset_audit_target_email ON public.password_reset_audit(target_email);

GRANT SELECT ON public.password_reset_audit TO authenticated;
GRANT ALL ON public.password_reset_audit TO service_role;

ALTER TABLE public.password_reset_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view password reset audit"
ON public.password_reset_audit
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master'));
