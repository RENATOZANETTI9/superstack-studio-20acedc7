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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check master/admin role
    const { data: roleData } = await supabaseAdmin.from('user_roles').select('role').eq('user_id', user.id).single();
    if (!roleData || !['master', 'admin'].includes(roleData.role)) {
      return new Response(JSON.stringify({ error: 'Sem permissão' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fetch SEH weights from config
    const { data: sehConfig } = await supabaseAdmin
      .from('partner_system_config')
      .select('config_value')
      .eq('config_key', 'seh_weights')
      .single();

    const weights = sehConfig?.config_value as any || { activation: 0.30, volume: 0.35, conversion: 0.35 };

    // Fetch all active partners
    const { data: partners } = await supabaseAdmin
      .from('partners')
      .select('id, current_level')
      .eq('status', 'ACTIVE');

    if (!partners || partners.length === 0) {
      return new Response(JSON.stringify({ message: 'Nenhum partner ativo', updated: 0 }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fetch level thresholds
    const { data: levelConfigs } = await supabaseAdmin
      .from('partner_system_config')
      .select('config_key, config_value')
      .eq('category', 'LEVEL_THRESHOLDS');

    const levels = (levelConfigs || []).reduce((acc: any, l: any) => {
      acc[l.config_key] = l.config_value;
      return acc;
    }, {});

    let updated = 0;

    for (const partner of partners) {
      // Fetch clinic stats
      const { data: clinics } = await supabaseAdmin
        .from('partner_clinic_relations')
        .select('is_active')
        .eq('partner_id', partner.id);

      const totalClinics = clinics?.length || 0;
      const activeClinics = clinics?.filter((c: any) => c.is_active).length || 0;

      // Fetch latest metrics
      const { data: latestMetrics } = await supabaseAdmin
        .from('partner_metrics_daily')
        .select('*')
        .eq('partner_id', partner.id)
        .order('metric_date', { ascending: false })
        .limit(1)
        .single();

      // Calculate SEH
      const activationRate = totalClinics > 0 ? (activeClinics / totalClinics) * 100 : 0;
      const pilarActivation = Math.min(activationRate, 100);

      const consultations = latestMetrics?.consultations || 0;
      const metaConsultas = 100; // default target
      const pilarVolume = Math.min((consultations / metaConsultas) * 100, 100);

      const approvalRate = latestMetrics?.approval_rate || 0;
      const paidRate = latestMetrics?.paid_rate || 0;
      const pilarConversion = (Number(approvalRate) * 0.5 + Number(paidRate) * 0.5);

      const seh = (pilarActivation * weights.activation) + (pilarVolume * weights.volume) + (pilarConversion * weights.conversion);
      const sehCapped = Math.min(Math.max(seh, 0), 100);

      // Determine level
      let newLevel = 'BRONZE';
      if (sehCapped >= 85) newLevel = 'ELITE';
      else if (sehCapped >= 70) newLevel = 'OURO';
      else if (sehCapped >= 50) newLevel = 'PRATA';

      // Update partner
      await supabaseAdmin
        .from('partners')
        .update({ seh_score: sehCapped, current_level: newLevel })
        .eq('id', partner.id);

      updated++;
    }

    return new Response(
      JSON.stringify({ success: true, updated, message: `SEH recalculado para ${updated} partners` }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Compute SEH error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
