import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  parseRoteiro,
  enrichStructured,
  validateFormat,
} from "./helpers.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const {
      clinicas = [], semana = '', bairros = '', especialidade = '',
      tipoLocal = '', faturamentoMedio = '', clinicasPorDia = '4',
      notasAdicionais = '', cidade = 'Belo Horizonte',
    } = await req.json();

    const TAVILY_KEY = Deno.env.get('TAVILY_API_KEY');
    const LOVABLE_KEY = Deno.env.get('LOVABLE_API_KEY');
    const OPENAI_KEY = Deno.env.get('OPENAI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_KEY && !OPENAI_KEY) {
      return new Response(
        JSON.stringify({ error: 'AI key não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const admin = SUPABASE_URL && SERVICE_ROLE ? createClient(SUPABASE_URL, SERVICE_ROLE) : null;

    // ── 1. TAVILY com cache por (bairro, especialidade, tipo) ────────────────
    let clinicasInternetStr = '';
    let source: 'tavily' | 'tavily_cache' | 'suggested' = 'suggested';
    let tavilyHits = 0;
    let cacheHits = 0;
    let tavilyErrors = 0;

    const bairrosList = String(bairros || '').split(',').map((b: string) => b.trim()).filter(Boolean).slice(0, 3);
    const tipo = tipoLocal && tipoLocal !== 'todos' ? tipoLocal : 'clínica';
    const esp = especialidade || 'saúde';

    if (bairrosList.length > 0) {
      const tavilyResults: string[] = [];

      for (const bairro of bairrosList) {
        const cacheKey = `${cidade}|${bairro}|${esp}|${tipo}`.toLowerCase();
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
          cached.forEach((r: any) => tavilyResults.push(`- ${r.title}: ${(r.content || '').slice(0, 300)}`));
          continue;
        }

        // Busca Tavily
        if (!TAVILY_KEY) continue;
        try {
          const tavilyRes = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              api_key: TAVILY_KEY,
              query: `${tipo} ${esp} ${bairro} ${cidade} telefone responsável`,
              search_depth: 'basic', max_results: 5, include_answer: false,
            }),
          });
          if (!tavilyRes.ok) { tavilyErrors++; continue; }
          const tavilyData = await tavilyRes.json();
          const results = (tavilyData.results || []).slice(0, 3);
          tavilyHits += results.length;
          results.forEach((r: any) => tavilyResults.push(`- ${r.title}: ${(r.content || '').slice(0, 300)}`));

          if (admin && results.length > 0) {
            await admin.from('tavily_cache').upsert({
              cache_key: cacheKey, bairro, especialidade: esp, tipo,
              results, expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
            }, { onConflict: 'cache_key' });
          }
        } catch (err) {
          console.warn('Tavily search failed for', bairro, err);
          tavilyErrors++;
        }
      }

      if (tavilyResults.length > 0) {
        clinicasInternetStr = `\n\nDados de clínicas encontradas na internet (use para extrair nome, telefone, responsável):\n${tavilyResults.join('\n')}`;
        source = cacheHits > 0 && tavilyHits === 0 ? 'tavily_cache' : 'tavily';
      }
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
    const model = LOVABLE_KEY ? 'openai/gpt-5-mini' : 'gpt-4o-mini';

    const gptRes = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_completion_tokens: 3000 }),
    });

    if (!gptRes.ok) {
      const errText = await gptRes.text();
      console.error('LLM error:', errText);
      if (gptRes.status === 429) return new Response(JSON.stringify({ error: 'Limite de requisições atingido.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (gptRes.status === 402) return new Response(JSON.stringify({ error: 'Créditos de IA esgotados.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      throw new Error(`LLM API error: ${gptRes.status}`);
    }

    const gptData = await gptRes.json();
    const roteiro = gptData.choices?.[0]?.message?.content || 'Roteiro não disponível.';

    // ── 5. Validação + estruturação + fallback de campos ─────────────────────
    const format = validateFormat(roteiro);
    const structured = enrichStructured(parseRoteiro(roteiro), cidade, faturamentoMedio);

    return new Response(
      JSON.stringify({
        roteiro,
        structured,
        source,
        meta: {
          tavily_configured: !!TAVILY_KEY,
          tavily_hits: tavilyHits,
          cache_hits: cacheHits,
          tavily_errors: tavilyErrors,
          bairros_queried: bairrosList.length,
          format_valid: format.valid,
          format_issues: format.issues,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    console.error('generate-ai-route error:', err);
    return new Response(
      JSON.stringify({ error: err?.message || 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
