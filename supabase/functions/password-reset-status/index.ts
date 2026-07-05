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

const WINDOW_SECONDS = 15 * 60;
const MAX_ATTEMPTS_PER_EMAIL = 5;
const MAX_ATTEMPTS_PER_IP = 20;

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/**
 * Retorna status de rate-limit para (email, ip) SEM revelar se o e-mail existe.
 * O status é derivado apenas da tabela `password_reset_rate_limits`, que só
 * possui registros para tentativas efetivamente submetidas neste IP/e-mail —
 * ou seja, apenas quem já solicitou vê algum "in_progress".
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const email = String(body?.email ?? '').trim().toLowerCase();
    if (!email || !isEmail(email) || email.length > 255) {
      return json({ error: 'Email inválido' }, 400);
    }

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('cf-connecting-ip') ??
      'unknown';

    const windowStart = new Date(Date.now() - WINDOW_SECONDS * 1000).toISOString();

    const [emailRes, ipRes, latestEmail] = await Promise.all([
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
      admin
        .from('password_reset_rate_limits')
        .select('created_at')
        .eq('identifier', email)
        .eq('action', 'request')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const emailCount = emailRes.count ?? 0;
    const ipCount = ipRes.count ?? 0;
    const attemptsRemaining = Math.max(0, MAX_ATTEMPTS_PER_EMAIL - emailCount);
    const throttled =
      emailCount >= MAX_ATTEMPTS_PER_EMAIL || ipCount >= MAX_ATTEMPTS_PER_IP;

    let retryAfterSeconds = 0;
    if (throttled && latestEmail.data?.created_at) {
      const oldest = new Date(latestEmail.data.created_at).getTime();
      const elapsed = Math.floor((Date.now() - oldest) / 1000);
      retryAfterSeconds = Math.max(0, WINDOW_SECONDS - elapsed);
    }

    return json({
      in_progress: emailCount > 0,
      attempts_used: emailCount,
      attempts_remaining: attemptsRemaining,
      max_attempts: MAX_ATTEMPTS_PER_EMAIL,
      throttled,
      retry_after_seconds: retryAfterSeconds,
      window_seconds: WINDOW_SECONDS,
    });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});