import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clinicas, semana } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      return new Response(JSON.stringify({ roteiro: 'OPENAI_API_KEY não configurado. Adicione o secret na dashboard do Supabase.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const clinicasStr = (clinicas || []).map((c: any) =>
      `- ${c.nome} (${c.tipo}) | Bairro: ${c.bairro}, ${c.cidade} | Tel: ${c.telefone || '—'} | Status: ${c.status}`
    ).join('\n');

    const prompt = `Você é um especialista em otimização de rotas de vendas para o setor de saúde no Brasil.

Crie um roteiro semanal otimizado para um representante comercial visitar as seguintes clínicas/hospitais.
Agrupe as visitas por bairro para minimizar deslocamentos. Priorize clínicas ativas e leads.

Portfólio de clínicas:
${clinicasStr || 'Nenhuma clínica cadastrada ainda.'}

Semana: ${semana}

Formato da resposta:
- Distribua de segunda a sexta
- Para cada dia liste: clínica, bairro, objetivo da visita
- Finalize com um parágrafo "Estratégia da Semana"
- Responda em português brasileiro
- Use emojis para facilitar leitura`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const roteiro = data.choices?.[0]?.message?.content || 'Não foi possível gerar o roteiro.';

    return new Response(JSON.stringify({ roteiro }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});