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

// Config
const WINDOW_SECONDS = 15 * 60;         // 15 minutos
const MAX_ATTEMPTS_PER_EMAIL = 5;
const MAX_ATTEMPTS_PER_IP = 20;

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const email = String(body?.email ?? '').trim().toLowerCase();
    const redirectTo = String(body?.redirectTo ?? '');

    if (!email || !isEmail(email) || email.length > 255) {
      return json({ error: 'Email inválido' }, 400);
    }

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('cf-connecting-ip') ??
      'unknown';
    const userAgent = req.headers.get('user-agent') ?? null;

    // Rate limit: por email e por IP (janela de 15 min)
    const windowStart = new Date(Date.now() - WINDOW_SECONDS * 1000).toISOString();

    const [{ count: emailCount }, { count: ipCount }] = await Promise.all([
      admin
        .from('password_reset_rate_limits')
        .select('id', { count: 'exact', head: true })
        .eq('identifier', email)
        .eq('action', 'request')
        .gt('created_at', windowStart),
      admin
        .from('password_reset_rate_limits')
        .select('id', { count: 'exact', head: true })
        .eq('identifier', ip)
        .eq('action', 'request')
        .gt('created_at', windowStart),
    ]);

    const overEmail = (emailCount ?? 0) >= MAX_ATTEMPTS_PER_EMAIL;
    const overIp = (ipCount ?? 0) >= MAX_ATTEMPTS_PER_IP;

    if (overEmail || overIp) {
      // Audita bloqueio por rate limit (sucesso=false) sem vazar existência do e-mail.
      await admin.from('password_reset_audit').insert({
        actor_email: email,
        target_email: email,
        action: 'self_request',
        success: false,
        error_message: `rate_limited: email=${emailCount ?? 0}/${MAX_ATTEMPTS_PER_EMAIL} ip=${ipCount ?? 0}/${MAX_ATTEMPTS_PER_IP}`,
        ip_address: ip,
        user_agent: userAgent,
      });
      // Anti-enumeração: resposta genérica + Retry-After no header e no body.
      return new Response(
        JSON.stringify({
          success: true,
          throttled: true,
          retry_after_seconds: WINDOW_SECONDS,
        }),
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

    // Registra tentativa (email + ip) ANTES do envio para bloquear picos
    await admin.from('password_reset_rate_limits').insert([
      { identifier: email, action: 'request' },
      { identifier: ip, action: 'request' },
    ]);

    const { error: rErr } = await admin.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo || undefined,
    });

    // Audit
    await admin.from('password_reset_audit').insert({
      actor_email: email,
      target_email: email,
      action: 'self_request',
      success: !rErr,
      error_message: rErr?.message ?? null,
      ip_address: ip,
      user_agent: userAgent,
    });

    // Anti-enumeração: sempre 200 genérico
    return json({ success: true });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});