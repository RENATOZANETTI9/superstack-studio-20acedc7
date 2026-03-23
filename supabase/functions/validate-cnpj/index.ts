import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cnpj } = await req.json();

    if (!cnpj || cnpj.length !== 14) {
      return new Response(
        JSON.stringify({ error: 'CNPJ inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Query public CNPJ API (BrasilAPI)
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
    
    if (!response.ok) {
      return new Response(
        JSON.stringify({ valido: false, area: 'desconhecida', razao_social: '' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();

    // Check if CNAE is health-related
    // Health CNAEs start with 86 (human health activities)
    const mainCnae = data.cnae_fiscal?.toString() || '';
    const secondaryCnaes = (data.cnaes_secundarios || []).map((c: any) => c.codigo?.toString() || '');
    const allCnaes = [mainCnae, ...secondaryCnaes];
    
    const healthPrefixes = ['86', '325', '477']; // 86=saude, 325=equipamentos medicos, 477=farmacia
    const isHealthArea = allCnaes.some((cnae: string) => 
      healthPrefixes.some(prefix => cnae.startsWith(prefix))
    );

    return new Response(
      JSON.stringify({
        valido: true,
        area: isHealthArea ? 'medica' : 'nao_medica',
        razao_social: data.razao_social || data.nome_fantasia || '',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Validate CNPJ error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
