import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Não autorizado' }, 401);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: requester }, error: uErr } = await admin.auth.getUser(token);
    if (uErr || !requester) return json({ error: 'Não autorizado' }, 401);

    const { data: roleRow } = await admin
      .from('user_roles').select('role').eq('user_id', requester.id).single();
    const requesterRole = roleRow?.role;
    const isAdmin = requesterRole === 'master' || requesterRole === 'admin';

    const body = await req.json().catch(() => ({}));
    const action = body?.action as string;

    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('cf-connecting-ip') ??
      null;
    const userAgent = req.headers.get('user-agent') ?? null;

    const logAudit = async (opts: {
      target: string;
      auditAction: 'send_reset_email' | 'reset_password' | 'self_request';
      success: boolean;
      errorMessage?: string;
    }) => {
      try {
        await admin.from('password_reset_audit').insert({
          actor_user_id: requester.id,
          actor_email: requester.email ?? null,
          target_email: opts.target,
          action: opts.auditAction,
          success: opts.success,
          error_message: opts.errorMessage ?? null,
          ip_address: ipAddress,
          user_agent: userAgent,
        });
      } catch (e) {
        console.error('audit log failure', e);
      }
    };

    // Any authenticated user can look up their OWN role.
    if (action === 'lookup_role') {
      const email = String(body?.email ?? '').trim().toLowerCase();
      if (!email) return json({ error: 'Email obrigatório' }, 400);
      const isSelf = email === (requester.email ?? '').toLowerCase();
      if (!isSelf && !isAdmin) {
        // Anti-enumeração: não revelamos se o e-mail existe para não-admins.
        return json({ error: 'Você só pode consultar seu próprio e-mail.' }, 403);
      }

      const { data: profile } = await admin
        .from('profiles').select('user_id, email').eq('email', email).maybeSingle();
      if (!profile) {
        // Para self-lookup, é seguro dizer não encontrado (é a própria conta do requester).
        // Para admins, é uma consulta autorizada.
        return json({ found: false });
      }
      const { data: rr } = await admin
        .from('user_roles').select('role').eq('user_id', profile.user_id).maybeSingle();
      return json({ found: true, email: profile.email, role: rr?.role ?? 'user' });
    }

    if (!isAdmin) return json({ error: 'Apenas admin/master.' }, 403);

    if (action === 'reset_password') {
      const email = String(body?.email ?? '').trim().toLowerCase();
      const newPassword = String(body?.newPassword ?? '');
      if (!email || newPassword.length < 6 || newPassword.length > 100) {
        return json({ error: 'Email e senha (6-100 chars) obrigatórios' }, 400);
      }
      const { data: profile } = await admin
        .from('profiles').select('user_id').eq('email', email).maybeSingle();
      if (!profile) {
        await logAudit({ target: email, auditAction: 'reset_password', success: false, errorMessage: 'Usuário não encontrado' });
        return json({ error: 'Usuário não encontrado' }, 404);
      }
      const { error: upErr } = await admin.auth.admin.updateUserById(profile.user_id, {
        password: newPassword,
      });
      if (upErr) {
        await logAudit({ target: email, auditAction: 'reset_password', success: false, errorMessage: upErr.message });
        return json({ error: upErr.message }, 400);
      }
      await logAudit({ target: email, auditAction: 'reset_password', success: true });
      return json({ success: true });
    }

    if (action === 'send_reset_email') {
      const email = String(body?.email ?? '').trim().toLowerCase();
      const redirectTo = String(body?.redirectTo ?? '');
      if (!email) return json({ error: 'Email obrigatório' }, 400);
      const { error: rErr } = await admin.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo || undefined,
      });
      if (rErr) {
        await logAudit({ target: email, auditAction: 'send_reset_email', success: false, errorMessage: rErr.message });
        // Anti-enumeração: retornamos sucesso genérico mesmo em erro do provedor.
        return json({ success: true });
      }
      await logAudit({ target: email, auditAction: 'send_reset_email', success: true });
      return json({ success: true });
    }

    return json({ error: 'Ação inválida' }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});