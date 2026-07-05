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

// Configuração
const WINDOW_SECONDS = 15 * 60;
const MAX_ATTEMPTS_PER_USER = 10;
const MAX_ATTEMPTS_PER_IP = 30;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 100;

// Política mínima: 8+, minúscula, maiúscula, número, especial
function validatePassword(pw: string): string | null {
  if (typeof pw !== 'string') return 'Senha inválida';
  if (pw.length < PASSWORD_MIN) return `A senha deve ter pelo menos ${PASSWORD_MIN} caracteres`;
  if (pw.length > PASSWORD_MAX) return `A senha deve ter no máximo ${PASSWORD_MAX} caracteres`;
  if (!/[a-z]/.test(pw)) return 'A senha deve conter pelo menos uma letra minúscula';
  if (!/[A-Z]/.test(pw)) return 'A senha deve conter pelo menos uma letra maiúscula';
  if (!/[0-9]/.test(pw)) return 'A senha deve conter pelo menos um número';
  if (!/[^A-Za-z0-9]/.test(pw)) return 'A senha deve conter pelo menos um caractere especial';
  return null;
}

// Extrai session_id (ou fallback) de um JWT verificado
function tokenFingerprint(claims: Record<string, unknown>): string {
  const sid = claims.session_id ?? claims.sid ?? null;
  if (typeof sid === 'string' && sid.length > 0) return sid;
  // Fallback: sub + iat garantem unicidade dentro da vida do token
  const sub = String(claims.sub ?? '');
  const iat = String(claims.iat ?? '');
  return `${sub}:${iat}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey);

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('cf-connecting-ip') ??
      'unknown';
    const userAgent = req.headers.get('user-agent') ?? null;

    // Autenticação: usuário DEVE apresentar o access_token da sessão de recovery
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Token de recuperação ausente' }, 401);
    }
    const token = authHeader.replace('Bearer ', '');

    // Verifica JWT (expiração + assinatura). Token expirado => getClaims falha.
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsErr } = await authClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return json({ error: 'Token expirado ou inválido' }, 401);
    }
    const claims = claimsData.claims as Record<string, unknown>;
    const userId = String(claims.sub ?? '');
    const exp = Number(claims.exp ?? 0);
    if (!userId) return json({ error: 'Token inválido' }, 401);
    if (exp && exp * 1000 < Date.now()) {
      return json({ error: 'Token expirado' }, 401);
    }

    const fingerprint = tokenFingerprint(claims);

    // Rate limit por usuário e IP (janela deslizante 15 min)
    const windowStart = new Date(Date.now() - WINDOW_SECONDS * 1000).toISOString();
    const [{ count: userCount }, { count: ipCount }] = await Promise.all([
      admin
        .from('password_reset_rate_limits')
        .select('id', { count: 'exact', head: true })
        .eq('identifier', userId)
        .eq('action', 'complete')
        .gt('created_at', windowStart),
      admin
        .from('password_reset_rate_limits')
        .select('id', { count: 'exact', head: true })
        .eq('identifier', ip)
        .eq('action', 'complete')
        .gt('created_at', windowStart),
    ]);
    if ((userCount ?? 0) >= MAX_ATTEMPTS_PER_USER || (ipCount ?? 0) >= MAX_ATTEMPTS_PER_IP) {
      return new Response(
        JSON.stringify({ error: 'Muitas tentativas. Aguarde alguns minutos.' }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': String(WINDOW_SECONDS),
          },
        },
      );
    }
    await admin.from('password_reset_rate_limits').insert([
      { identifier: userId, action: 'complete' },
      { identifier: ip, action: 'complete' },
    ]);

    // Token single-use: verifica se já foi consumido
    const { data: usedRow } = await admin
      .from('used_recovery_tokens')
      .select('session_id')
      .eq('session_id', fingerprint)
      .maybeSingle();
    if (usedRow) {
      await admin.from('password_reset_audit').insert({
        actor_user_id: userId,
        target_email: String(claims.email ?? ''),
        action: 'reset_password',
        success: false,
        error_message: 'Token de recuperação já utilizado',
        ip_address: ip,
        user_agent: userAgent,
      });
      return json({ error: 'Este link já foi utilizado. Solicite um novo.' }, 410);
    }

    // Validação de política
    const body = await req.json().catch(() => ({}));
    const newPassword = String(body?.newPassword ?? '');
    const policyError = validatePassword(newPassword);
    if (policyError) {
      return json({ error: policyError }, 400);
    }

    // Atualiza senha via admin
    const { error: upErr } = await admin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });
    if (upErr) {
      await admin.from('password_reset_audit').insert({
        actor_user_id: userId,
        target_email: String(claims.email ?? ''),
        action: 'reset_password',
        success: false,
        error_message: upErr.message,
        ip_address: ip,
        user_agent: userAgent,
      });
      return json({ error: upErr.message }, 400);
    }

    // Marca token como usado (single-use)
    await admin.from('used_recovery_tokens').insert({
      session_id: fingerprint,
      user_id: userId,
      expires_at: new Date(exp * 1000).toISOString(),
    });

    // Invalida TODAS as sessões existentes do usuário (global)
    try {
      // @ts-expect-error scope suportado em runtime
      await admin.auth.admin.signOut(userId, 'global');
    } catch (_) {
      // fallback silencioso — a signOut do cliente também será chamada
    }

    await admin.from('password_reset_audit').insert({
      actor_user_id: userId,
      target_email: String(claims.email ?? ''),
      action: 'reset_password',
      success: true,
      ip_address: ip,
      user_agent: userAgent,
    });

    return json({ success: true });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});