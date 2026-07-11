import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  parseRoteiro,
  enrichStructured,
  validateFormat,
  buildCacheKey,
  computeCacheExpiresAt,
} from "./helpers.ts";

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export interface HandlerDeps {
  env: (k: string) => string | undefined;
  fetch: typeof fetch;
  admin: any | null;
  sleep?: (ms: number) => Promise<void>;
}

function defaultDeps(): HandlerDeps {
  const env = (k: string) => Deno.env.get(k);
  const SUPABASE_URL = env('SUPABASE_URL');
  const SERVICE_ROLE = env('SUPABASE_SERVICE_ROLE_KEY');
  const admin = SUPABASE_URL && SERVICE_ROLE ? createClient(SUPABASE_URL, SERVICE_ROLE) : null;
  return { env, fetch: fetch.bind(globalThis), admin };
}

export async function handleRequest(req: Request, depsOverride?: Partial<HandlerDeps>): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const base = defaultDeps();
  const deps: HandlerDeps = { ...base, ...depsOverride };
  const { env, fetch: fetchFn, admin } = deps;
  const sleep = deps.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));

  const reqId = (globalThis.crypto?.randomUUID?.() || String(Date.now())).slice(0, 8);
  const t0 = Date.now();
  const log = (event: string, extra: Record<string, unknown> = {}) => {
    try {
      console.log(JSON.stringify({ fn: 'generate-ai-route', reqId, event, ...extra }));
    } catch { /* ignore */ }
  };

  try {
    const {
      clinicas = [], semana = '', bairros = '', especialidade = '',
      tipoLocal = '', faturamentoMedio = '', clinicasPorDia = '4',
      notasAdicionais = '', cidade = 'Belo Horizonte',
    } = await req.json();

    const TAVILY_KEY = env('TAVILY_API_KEY');
    const LOVABLE_KEY = env('LOVABLE_API_KEY');
    const OPENAI_KEY = env('OPENAI_API_KEY');

    // Validate Tavily key shape — real keys are `tvly-...`. A misconfigured secret
    // (e.g. a URL) causes silent 401s on every call.
    const tavilyKeyLooksValid = !!TAVILY_KEY && /^tvly-/i.test(TAVILY_KEY.trim());
    if (TAVILY_KEY && !tavilyKeyLooksValid) {
      log('tavily_key_invalid_shape', { hint: 'TAVILY_API_KEY does not start with "tvly-"' });
    }

    log('request', {
      cidade, bairros, especialidade, tipoLocal, clinicasPorDia,
      portfolio_size: Array.isArray(clinicas) ? clinicas.length : 0,
      tavily_configured: !!TAVILY_KEY,
      tavily_key_valid_shape: tavilyKeyLooksValid,
      llm_provider: LOVABLE_KEY ? 'lovable' : (OPENAI_KEY ? 'openai' : 'none'),
    });

    if (!LOVABLE_KEY && !OPENAI_KEY) {
      log('error', { where: 'ai_key', message: 'no AI key configured' });
      return new Response(
        JSON.stringify({ error: 'AI key não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── 1. TAVILY com cache por (bairro, especialidade, tipo) ────────────────
    let clinicasInternetStr = '';
    let source: 'tavily' | 'tavily_cache' | 'suggested' = 'suggested';
    let tavilyHits = 0;
    let cacheHits = 0;
    let tavilyErrors = 0;
    const tavilyErrorDetails: Array<{ bairro: string; status?: number; message: string }> = [];
    // Fontes Tavily efetivamente usadas (cache + live)
    const tavilySources: Array<{ bairro: string; title: string; url?: string; from: 'cache' | 'live' }> = [];

    const bairrosList = String(bairros || '').split(',').map((b: string) => b.trim()).filter(Boolean).slice(0, 3);
    const tipo = tipoLocal && tipoLocal !== 'todos' ? tipoLocal : 'clínica';
    const esp = especialidade || 'saúde';

    if (bairrosList.length > 0) {
      const tavilyResults: string[] = [];

      for (const bairro of bairrosList) {
        const cacheKey = buildCacheKey(cidade, bairro, esp, tipo);
        let cached: any[] | null = null;

        // Tenta cache
        if (admin) {
          const { data } = await admin
            .from('tavily_cache')
            .select('results, expires_at')
            .eq('cache_key', cacheKey)
            .gt('expires_at', new Date().toISOString())
            .maybeSingle();
          if (data?.results && Array.isArray(data.results)) {
            cached = data.results;
            cacheHits++;
          }
        }

        if (cached) {
          cached.forEach((r: any) => {
            tavilyResults.push(`- ${r.title}: ${(r.content || '').slice(0, 300)}`);
            tavilySources.push({ bairro, title: String(r.title || ''), url: r.url, from: 'cache' });
          });
          continue;
        }

        // Busca Tavily com retry + backoff (2 tentativas)
        if (!TAVILY_KEY) continue;
        const MAX_ATTEMPTS = 2;
        let attemptFailure: { status?: number; message: string } | null = null;
        let succeeded = false;
        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
          try {
            const tavilyRes = await fetchFn('https://api.tavily.com/search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                api_key: TAVILY_KEY,
                query: `${tipo} ${esp} ${bairro} ${cidade} telefone responsável`,
                search_depth: 'basic', max_results: 5, include_answer: false,
              }),
            });
            if (!tavilyRes.ok) {
              const bodyText = await tavilyRes.text().catch(() => '');
              attemptFailure = { status: tavilyRes.status, message: bodyText.slice(0, 200) };
              // 4xx (exceto 429) não são retriáveis
              const retriable = tavilyRes.status === 429 || tavilyRes.status >= 500;
              log('tavily_attempt_failed', { bairro, attempt, status: tavilyRes.status, retriable });
              if (retriable && attempt < MAX_ATTEMPTS) {
                await sleep(300 * attempt); // backoff: 300ms, 600ms
                continue;
              }
              break;
            }
            const tavilyData = await tavilyRes.json();
            const results = (tavilyData.results || []).slice(0, 3);
            tavilyHits += results.length;
            results.forEach((r: any) => {
              tavilyResults.push(`- ${r.title}: ${(r.content || '').slice(0, 300)}`);
              tavilySources.push({ bairro, title: String(r.title || ''), url: r.url, from: 'live' });
            });

            if (admin && results.length > 0) {
              await admin.from('tavily_cache').upsert({
                cache_key: cacheKey, bairro, especialidade: esp, tipo,
                results, expires_at: computeCacheExpiresAt(),
              }, { onConflict: 'cache_key' });
            }
            succeeded = true;
            attemptFailure = null;
            break;
          } catch (err) {
            attemptFailure = { message: String((err as any)?.message || err).slice(0, 200) };
            log('tavily_attempt_exception', { bairro, attempt, ...attemptFailure });
            if (attempt < MAX_ATTEMPTS) {
              await sleep(300 * attempt);
              continue;
            }
          }
        }
        if (!succeeded && attemptFailure) {
          tavilyErrors++;
          const detail = { bairro, ...attemptFailure };
          tavilyErrorDetails.push(detail);
          log('tavily_error_final', detail);
          // Fallback: seguimos para o próximo bairro / geração via LLM
        }
      }

      if (tavilyResults.length > 0) {
        clinicasInternetStr = `\n\nDados de clínicas encontradas na internet (use para extrair nome, telefone, responsável):\n${tavilyResults.join('\n')}`;
        source = cacheHits > 0 && tavilyHits === 0 ? 'tavily_cache' : 'tavily';
      }

      // Se a chave é aparentemente válida e nenhuma fonte foi obtida,
      // sinaliza no meta que a expectativa (usar Tavily) não foi cumprida.
    }

    // Validação: quando a chave está no formato correto, esperamos ter fontes.
    // Isso não faz o request falhar (LLM ainda gera fallback utilizável), mas
    // é reportado em meta para o cliente decidir como exibir.
    const tavilyExpectedButMissing =
      tavilyKeyLooksValid && bairrosList.length > 0 && tavilySources.length === 0;
    if (tavilyExpectedButMissing) {
      log('tavily_expected_but_missing', {
        cidade, bairros: bairrosList, tavily_errors: tavilyErrors,
      });
    }

    // ── 2. Portfólio ─────────────────────────────────────────────────────────
    const clinicasPortfolio = (clinicas || []).filter((c: any) => c.nome);
    const portfolioStr = clinicasPortfolio.length > 0
      ? `\nClínicas já no portfólio (priorize visitas a estas):\n` +
        clinicasPortfolio.map((c: any) =>
          `- ${c.nome} (${c.tipo}) | Bairro: ${c.bairro}, ${c.cidade} | Tel: ${c.telefone || '—'} | Responsável: ${c.responsavel || '—'} | Status: ${c.status}`
        ).join('\n')
      : '';

    const hasAnyData = clinicasPortfolio.length > 0 || clinicasInternetStr || bairros;

    // ── 3. Prompt ────────────────────────────────────────────────────────────
    const prompt = `Você é um assistente especializado em roteiros de visitas para representantes comerciais da área de saúde no Brasil.

Crie um roteiro semanal de visitas a clínicas e hospitais para a ${semana || 'semana atual'}.

PARÂMETROS:
- Cidade: ${cidade}
- Bairros de foco: ${bairros || 'bairros centrais de ' + cidade}
- Especialidade prioritária: ${especialidade || 'Odontologia / Saúde Geral'}
- Tipo de estabelecimento: ${tipoLocal && tipoLocal !== 'todos' ? tipoLocal : 'Clínicas e Hospitais'}
- Faturamento médio alvo: ${faturamentoMedio || 'não especificado'}
- Meta de clínicas por dia: ${clinicasPorDia || '4'}
- Observações: ${notasAdicionais || 'nenhuma'}
${portfolioStr}${clinicasInternetStr}

INSTRUÇÃO:
${hasAnyData
  ? `Gere roteiro realista. Para cada clínica: nome plausível, bairro, telefone (formato (DDD) 9XXXX-XXXX), responsável, objetivo e faixa de faturamento.`
  : `Nenhuma clínica fornecida. Crie roteiro com clínicas SUGERIDAS (nomes plausíveis para ${cidade}) com todos os campos preenchidos. Indique no cabeçalho que são sugestões para prospecção.`}

FORMATO OBRIGATÓRIO (siga EXATAMENTE — cabeçalhos com "##" e itens numerados "1."):

## Segunda-feira — [data]

1. **[Nome da Clínica]** | [Bairro] | Tel: [telefone] | Responsável: [nome]
   - Objetivo: [objetivo específico]
   - Faturamento estimado: [faixa]

2. **[Nome da Clínica]** | [Bairro] | Tel: [telefone] | Responsável: [nome]
   - Objetivo: [objetivo específico]
   - Faturamento estimado: [faixa]

## Terça-feira — [data]
[continua para Qua, Qui]

## Sexta-feira — Entrega de Brindes
Liste clínicas do portfólio que bateram meta. Se não houver, escreva "Verificar metas da semana anterior."

## Dicas para a semana
[3 dicas táticas]`;

    // ── 4. LLM ───────────────────────────────────────────────────────────────
    const apiUrl = LOVABLE_KEY ? 'https://ai.gateway.lovable.dev/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions';
    const apiKey = LOVABLE_KEY || OPENAI_KEY;
    const model = LOVABLE_KEY ? 'google/gemini-2.5-flash' : 'gpt-4o-mini';

    log('llm_request', { model, provider: LOVABLE_KEY ? 'lovable' : 'openai', prompt_chars: prompt.length });

    const gptRes = await fetchFn(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 3000 }),
    });

    if (!gptRes.ok) {
      const errText = await gptRes.text();
      log('llm_error', { status: gptRes.status, model, message: errText.slice(0, 400) });
      if (gptRes.status === 429) return new Response(JSON.stringify({ error: 'Limite de requisições atingido.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (gptRes.status === 402) return new Response(JSON.stringify({ error: 'Créditos de IA esgotados.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      throw new Error(`LLM API error: ${gptRes.status}`);
    }

    const gptData = await gptRes.json();
    const roteiro = gptData.choices?.[0]?.message?.content || 'Roteiro não disponível.';

    // ── 5. Validação + estruturação + fallback de campos ─────────────────────
    const format = validateFormat(roteiro);
    const structured = enrichStructured(parseRoteiro(roteiro), cidade, faturamentoMedio);

    log('response', {
      cidade, model, source,
      tavily_hits: tavilyHits, cache_hits: cacheHits, tavily_errors: tavilyErrors,
      format_valid: format.valid, format_issues: format.issues,
      duration_ms: Date.now() - t0,
    });

    return new Response(
      JSON.stringify({
        roteiro,
        structured,
        source,
        tavily_sources: tavilySources,
        meta: {
          request_id: reqId,
          cidade,
          model,
          llm_provider: LOVABLE_KEY ? 'lovable' : 'openai',
          tavily_configured: !!TAVILY_KEY,
          tavily_key_valid_shape: tavilyKeyLooksValid,
          tavily_hits: tavilyHits,
          cache_hits: cacheHits,
          tavily_errors: tavilyErrors,
          tavily_error_details: tavilyErrorDetails,
          tavily_sources_count: tavilySources.length,
          tavily_sources_summary: tavilySources.slice(0, 10).map(s => ({
            bairro: s.bairro, title: s.title, from: s.from,
          })),
          tavily_expected_but_missing: tavilyExpectedButMissing,
          bairros_queried: bairrosList.length,
          format_valid: format.valid,
          format_issues: format.issues,
          duration_ms: Date.now() - t0,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    log('unhandled_error', { message: String(err?.message || err).slice(0, 400) });
    return new Response(
      JSON.stringify({ error: err?.message || 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

Deno.serve((req) => handleRequest(req));
