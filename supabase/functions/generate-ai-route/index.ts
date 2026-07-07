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
    const {
      clinicas,
      semana,
      bairros,
      especialidade,
      tipoLocal,
      faturamentoMedio,
      clinicasPorDia,
      notasAdicionais,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!LOVABLE_API_KEY && !openAIApiKey) {
      return new Response(JSON.stringify({ roteiro: 'Nenhuma chave de IA configurada.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const clinicasStr = (clinicas || []).map((c: any) =>
      `- ${c.nome} (${c.tipo}) | Bairro: ${c.bairro}, ${c.cidade} | Tel: ${c.telefone || '—'} | Status: ${c.status}`
    ).join('\n');

    const orientacoes: string[] = [];
    if (bairros) orientacoes.push(`- Bairros de foco: ${bairros}`);
    if (especialidade) orientacoes.push(`- Especialidade prioritária: ${especialidade}`);
    if (tipoLocal) orientacoes.push(`- Tipo de estabelecimento: ${tipoLocal}`);
    if (faturamentoMedio) orientacoes.push(`- Faturamento médio alvo: ${faturamentoMedio}`);
    if (clinicasPorDia) orientacoes.push(`- Meta de clínicas visitadas por dia: ${clinicasPorDia}`);
    if (notasAdicionais) orientacoes.push(`- Observações do representante: ${notasAdicionais}`);

    const prompt = `Você é um especialista em otimização de rotas de vendas para o setor de saúde no Brasil.

Crie um roteiro semanal otimizado para um representante comercial visitar clínicas/hospitais.
Agrupe as visitas por bairro para minimizar deslocamentos. Priorize clínicas ativas e leads.

Portfólio de clínicas:
${clinicasStr || 'Nenhuma clínica cadastrada ainda.'}

Semana: ${semana}

Orientações do representante:
${orientacoes.length ? orientacoes.join('\n') : '- (nenhuma orientação adicional fornecida)'}

Formato da resposta:
- Distribua de segunda a sexta
- Respeite a meta de clínicas por dia informada, se houver
- Para cada dia liste: clínica, bairro, objetivo da visita
- Considere as orientações (bairros, especialidade, tipo, faturamento) para priorização
- Finalize com um parágrafo "Estratégia da Semana"
- Responda em português brasileiro
- Use emojis para facilitar leitura`;

    const useGateway = !!LOVABLE_API_KEY;
    const endpoint = useGateway
      ? 'https://ai.gateway.lovable.dev/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions';
    const authKey = useGateway ? LOVABLE_API_KEY! : openAIApiKey!;
    const model = useGateway ? 'openai/gpt-5.5' : 'gpt-4o-mini';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text().catch(() => '');
      console.error('AI upstream error', response.status, err);
      return new Response(
        JSON.stringify({ error: `Falha na IA (${response.status})`, details: err }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

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