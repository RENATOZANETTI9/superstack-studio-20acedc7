import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Server-side execution of the three hot queries that back the
 * "Real vs Projetado" tab. Each query is timed with performance.now(); any
 * sample that exceeds PERF_BUDGET_MS is persisted to public.perf_alerts so
 * we can audit slow paths later.
 *
 * Response shape: {
 *   partnerId, referenceMonth, weekStartISO,
 *   month: { rows, count },
 *   week:  { rows, count },
 *   portfolio: { rows, count },
 *   timings: [{ label, ms, overBudget }],
 *   totalMs
 * }
 */
const PERF_BUDGET_MS = Number(Deno.env.get('PERF_BUDGET_MS') ?? '500');

function nowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

async function measure<T>(label: string, fn: () => Promise<T>) {
  const start = nowMs();
  const result = await fn();
  const ms = nowMs() - start;
  return { label, ms, overBudget: ms > PERF_BUDGET_MS, result };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Auth-scoped client — enforces RLS for the caller.
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    // Elevated client — only used to persist perf_alerts breaches.
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Body may override the reference window when the client wants to audit
    // a specific month/week (kept optional for regular calls).
    let body: any = {};
    if (req.headers.get('content-type')?.includes('application/json')) {
      try { body = await req.json(); } catch { /* empty body is fine */ }
    }
    const now = new Date();
    const referenceMonth: string =
      typeof body.referenceMonth === 'string'
        ? body.referenceMonth
        : `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    const weekStartISO: string =
      typeof body.weekStartISO === 'string'
        ? body.weekStartISO
        : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Resolve partner_id for the caller (also timed for full transparency).
    const partnerLookup = await measure('partners.by_user_id', async () =>
      await supabase.from('partners').select('id').eq('user_id', user.id).limit(1).maybeSingle(),
    );
    const partnerId = (partnerLookup.result as any)?.data?.id ?? null;

    if (!partnerId) {
      return new Response(
        JSON.stringify({
          partnerId: null,
          referenceMonth,
          weekStartISO,
          month: { rows: [], count: 0 },
          week: { rows: [], count: 0 },
          portfolio: { rows: [], count: 0 },
          timings: [{ label: partnerLookup.label, ms: partnerLookup.ms, overBudget: partnerLookup.overBudget }],
          totalMs: partnerLookup.ms,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const [monthT, weekT, portfolioT] = await Promise.all([
      measure('commissions.month', async () =>
        await supabase
          .from('partner_commissions')
          .select('status, commission_amount')
          .eq('beneficiary_partner_id', partnerId)
          .eq('reference_month', referenceMonth)
          .in('status', ['CALCULATED', 'APPROVED', 'PAID']),
      ),
      measure('commissions.week', async () =>
        await supabase
          .from('partner_commissions')
          .select('commission_amount, paid_at')
          .eq('beneficiary_partner_id', partnerId)
          .eq('status', 'PAID')
          .gte('paid_at', weekStartISO),
      ),
      measure('portfolio.clinics', async () =>
        await supabase
          .from('portfolio_clinics')
          .select('id, nome, status')
          .eq('partner_id', partnerId)
          .order('created_at', { ascending: false })
          .limit(10),
      ),
    ]);

    const timings = [partnerLookup, monthT, weekT, portfolioT].map((t) => ({
      label: t.label, ms: Number(t.ms.toFixed(2)), overBudget: t.overBudget,
    }));
    const totalMs = Number(timings.reduce((s, t) => s + t.ms, 0).toFixed(2));

    // Persist every breach so the team can audit slow calls after the fact.
    const breaches = timings.filter((t) => t.overBudget);
    if (breaches.length > 0) {
      await supabaseAdmin.from('perf_alerts').insert(
        breaches.map((b) => ({
          user_id: user.id,
          source: 'edge:commissions-metrics',
          label: b.label,
          duration_ms: b.ms,
          budget_ms: PERF_BUDGET_MS,
          context: { partnerId, referenceMonth, weekStartISO },
        })),
      );
    }

    const monthRows = (monthT.result as any)?.data ?? [];
    const weekRows = (weekT.result as any)?.data ?? [];
    const portfolioRows = (portfolioT.result as any)?.data ?? [];

    return new Response(
      JSON.stringify({
        partnerId,
        referenceMonth,
        weekStartISO,
        month: { rows: monthRows, count: monthRows.length },
        week: { rows: weekRows, count: weekRows.length },
        portfolio: { rows: portfolioRows, count: portfolioRows.length },
        timings,
        totalMs,
        budgetMs: PERF_BUDGET_MS,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('commissions-metrics error', err);
    return new Response(
      JSON.stringify({ error: 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});