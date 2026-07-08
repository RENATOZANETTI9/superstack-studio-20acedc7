import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      clinicas = [],
      semana = '',
      bairros = '',
      especialidade = '',
      tipoLocal = '',
      faturamentoMedio = '',
      clinicasPorDia = '4',
      notasAdicionais = '',
    } = await req.json();

    const TAVILY_KEY = Deno.env.get('TAVILY_API_KEY');
    const LOVABLE_KEY = Deno.env.get('LOVABLE_API_KEY');
    const OPENAI_KEY = Deno.env.get('OPENAI_API_KEY');

    if (!LOVABLE_KEY && !OPENAI_KEY) {
      return new Response(
        JSON.stringify({ error: 'OPENAI_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── 1. BUSCA TAVILY (clínicas reais da internet) ────────────────────────
    let clinicasInternetStr = '';

    if (TAVILY_KEY && bairros) {
      try {
        const queries: string[] = [];
        const bairrosList = bairros.split(',').map((b: string) => b.trim()).filter(Boolean).slice(0, 3);
        const tipo = tipoLocal && tipoLocal !== 'todos' ? tipoLocal : 'clínica';
        const esp = especialidade || 'saúde';

        for (const bairro of bairrosList) {
          queries.push(`${tipo} ${esp} ${bairro} Belo Horizonte telefone responsável`);
        }

        const tavilyResults: string[] = [];
        for (const query of queries) {
          const tavilyRes = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              api_key: TAVILY_KEY,
              query,
              search_depth: 'basic',
              max_results: 5,
              include_answer: false,
            }),
          });
          if (tavilyRes.ok) {
            const tavilyData = await tavilyRes.json();
            const results = (tavilyData.results || []).slice(0, 3);
            results.forEach((r: any) => {
              tavilyResults.push(`- ${r.title}: ${r.content?.slice(0, 300) || ''}`);
            });
          }
        }

        if (tavilyResults.length > 0) {
          clinicasInternetStr = `\n\nDados de clínicas encontradas na internet (use para extrair nome, telefone, responsável):\n${tavilyResults.join('\n')}`;
        }
      } catch (tavilyErr) {
        console.warn('Tavily search failed:', tavilyErr);
      }
    }

    // ── 2. PORTFÓLIO DO REPRESENTANTE ────────────────────────────────────────
    const clinicasPortfolio = (clinicas || []).filter((c: any) => c.nome);
    const portfolioStr = clinicasPortfolio.length > 0
      ? `\nClínicas já no portfólio do representante (priorize visitas a estas):\n` +
        clinicasPortfolio.map((c: any) =>
          `- ${c.nome} (${c.tipo}) | Bairro: ${c.bairro}, ${c.cidade} | Tel: ${c.telefone || '—'} | Responsável: ${c.responsavel || '—'} | Status: ${c.status}`
        ).join('\n')
      : '';

    // ── 3. PROMPT ──────────────────────────────────────────────────────────
    const hasAnyData = clinicasPortfolio.length > 0 || clinicasInternetStr || bairros;

    const prompt = `Você é um assistente especializado em roteiros de visitas para representantes comerciais da área de saúde no Brasil.

Crie um roteiro semanal de visitas a clínicas e hospitais para a ${semana || 'semana atual'}.

PARÂMETROS DO REPRESENTANTE:
- Bairros de foco: ${bairros || 'não especificado — use bairros centrais de Belo Horizonte'}
- Especialidade prioritária: ${especialidade || 'Odontologia / Saúde Geral'}
- Tipo de estabelecimento: ${tipoLocal && tipoLocal !== 'todos' ? tipoLocal : 'Clínicas e Hospitais'}
- Faturamento médio alvo: ${faturamentoMedio || 'não especificado'}
- Meta de clínicas por dia: ${clinicasPorDia || '4'}
- Observações adicionais: ${notasAdicionais || 'nenhuma'}
${portfolioStr}
${clinicasInternetStr}

INSTRUÇÃO IMPORTANTE:
${hasAnyData
  ? `Com base nos dados acima, gere um roteiro realista. Para cada clínica inclua: nome real ou plausível, bairro, telefone (formato (31) 9XXXX-XXXX), nome do responsável/recepcionista, objetivo da visita e estimativa de faturamento mensal.`
  : `Nenhuma clínica foi fornecida. Crie um roteiro com clínicas SUGERIDAS (nomes plausíveis para BH) nos bairros informados, com todos os campos: telefone, responsável, objetivo, faixa de faturamento. Indique no cabeçalho que são sugestões para prospecção.`
}

FORMATO OBRIGATÓRIO DA RESPOSTA:
Use exatamente este formato para cada dia:

## Segunda-feira — [data]

1. **[Nome da Clínica]** | [Bairro] | Tel: [telefone] | Responsável: [nome]
   - Objetivo: [objetivo específico]
   - Faturamento estimado: [faixa]

2. **[Nome da Clínica]** | [Bairro] | Tel: [telefone] | Responsável: [nome]
   - Objetivo: [objetivo específico]
   - Faturamento estimado: [faixa]

## Terça-feira — [data]
[continua...]

## Sexta-feira — Entrega de Brindes
Liste apenas as clínicas do portfólio que bateram a meta (se houver). Se não houver, escreva "Verificar metas da semana anterior."

Ao final, adicione:
## Dicas para a semana
[3 dicas táticas específicas para o perfil informado]`;

    // ── 4. CHAMADA LLM ────────────────────────────────────────────────────
    const apiUrl = LOVABLE_KEY
      ? 'https://ai.gateway.lovable.dev/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions';
    const apiKey = LOVABLE_KEY || OPENAI_KEY;
    const model = LOVABLE_KEY ? 'openai/gpt-5-mini' : 'gpt-4o-mini';

    const gptRes = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_completion_tokens: 3000,
      }),
    });

    if (!gptRes.ok) {
      const errText = await gptRes.text();
      console.error('GPT error:', errText);
      if (gptRes.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições atingido. Tente novamente em instantes.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (gptRes.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos de IA esgotados. Adicione créditos no workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`GPT API error: ${gptRes.status}`);
    }

    const gptData = await gptRes.json();
    const roteiro = gptData.choices?.[0]?.message?.content || 'Roteiro não disponível.';

    return new Response(
      JSON.stringify({ roteiro }),
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
