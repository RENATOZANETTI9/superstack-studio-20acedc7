import { createClient } from 'npm:@supabase/supabase-js@2.49.4';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3.23.8';

const BodySchema = z.object({
  proposal_id: z.string().min(1).max(200),
  pix_key_type: z.enum(['all', 'cpf', 'telefone', 'email']).default('all'),
  from: z.string().optional(),
  to: z.string().optional(),
  format: z.enum(['csv', 'json']).default('json'),
});

const PHASE_LABEL: Record<string, string> = {
  idle: 'Aguardando chave',
  generating: 'Gerando link',
  analyzing: 'Em análise',
  ready: 'Pronto p/ assinatura',
  error: 'Erro',
};

function toCSV(rows: any[]): string {
  const headers = ['data', 'de', 'para', 'tipo_chave', 'chave', 'autor', 'link_biometria', 'erro'];
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(';')];
  rows.forEach((r) => {
    lines.push(
      [
        new Date(r.created_at).toLocaleString('pt-BR'),
        PHASE_LABEL[r.from_phase ?? ''] ?? r.from_phase ?? '',
        PHASE_LABEL[r.to_phase] ?? r.to_phase,
        r.pix_key_type ?? '',
        r.pix_key_value ?? '',
        r.actor_email ?? '',
        r.biometric_link ?? '',
        r.error_message ?? '',
      ]
        .map(esc)
        .join(';'),
    );
  });
  return '\uFEFF' + lines.join('\n');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // ---- Authn: require a valid JWT ----
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Validate JWT against Supabase auth
    const authClient = createClient(supabaseUrl, anonKey);
    const { data: userData, error: userErr } = await authClient.auth.getUser(token);
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = userData.user.id;

    // ---- Authz: validate body ----
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    const { proposal_id, pix_key_type, from, to, format } = parsed.data;

    // ---- Query with service-role, but scope to authenticated user_id (defense-in-depth in addition to RLS) ----
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    let q = admin
      .from('proposal_pix_audit')
      .select('*')
      .eq('user_id', userId)
      .eq('proposal_id', proposal_id)
      .order('created_at', { ascending: true })
      .limit(5000);

    if (pix_key_type !== 'all') q = q.eq('pix_key_type', pix_key_type);
    if (from) {
      const d = new Date(from);
      if (isNaN(d.getTime())) {
        return new Response(JSON.stringify({ error: { from: ['invalid date'] } }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      q = q.gte('created_at', d.toISOString());
    }
    if (to) {
      const d = new Date(to);
      if (isNaN(d.getTime())) {
        return new Response(JSON.stringify({ error: { to: ['invalid date'] } }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      d.setHours(23, 59, 59, 999);
      q = q.lte('created_at', d.toISOString());
    }

    const { data, error } = await q;
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rows = data ?? [];

    if (format === 'csv') {
      return new Response(toCSV(rows), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="auditoria-pix-${proposal_id}.csv"`,
        },
      });
    }

    return new Response(JSON.stringify({ rows, count: rows.length }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});