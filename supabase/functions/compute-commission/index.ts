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

    const { data: roleData } = await supabaseAdmin.from('user_roles').select('role').eq('user_id', user.id).single();
    if (!roleData || !['master', 'admin'].includes(roleData.role)) {
      return new Response(JSON.stringify({ error: 'Sem permissão' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const { paidContractId, clinicId, attendantUserId, netPaidAmount } = body;

    if (!paidContractId || !netPaidAmount) {
      return new Response(JSON.stringify({ error: 'paidContractId e netPaidAmount são obrigatórios' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fetch commission rates from config
    const { data: rateConfigs } = await supabaseAdmin
      .from('partner_system_config')
      .select('config_key, config_value')
      .eq('category', 'COMMISSION_RATES');

    const rates: Record<string, number> = {};
    (rateConfigs || []).forEach((r: any) => {
      rates[r.config_key] = r.config_value?.rate || 0;
    });

    const directRate = rates['commission_rate_direct'] || 0.016;
    const overrideRate = rates['commission_rate_override'] || 0.002;
    const csRate = rates['commission_rate_cs_internal'] || 0.002;

    // Find partner linked to the clinic
    const { data: clinicRelation } = await supabaseAdmin
      .from('partner_clinic_relations')
      .select('partner_id')
      .eq('clinic_external_id', clinicId)
      .eq('is_active', true)
      .single();

    if (!clinicRelation) {
      return new Response(JSON.stringify({ message: 'Clínica não vinculada a partner', processed: 0 }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const partnerId = clinicRelation.partner_id;
    const now = new Date();
    const referenceMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const jobId = `commission_${paidContractId}_${Date.now()}`;
    let processed = 0;

    // 1. Direct commission
    const directAmount = netPaidAmount * directRate;
    const { error: directErr } = await supabaseAdmin.from('partner_commissions').upsert({
      partner_id: partnerId,
      beneficiary_partner_id: partnerId,
      commission_type: 'DIRECT',
      source_paid_contract_id: paidContractId,
      clinic_external_id: clinicId,
      net_paid_amount: netPaidAmount,
      commission_rate: directRate,
      commission_amount: directAmount,
      reference_month: referenceMonth,
      job_id: jobId,
    }, { onConflict: 'source_paid_contract_id,beneficiary_partner_id,commission_type' });

    if (!directErr) processed++;

    // 2. Override commission (if partner has parent Master)
    const { data: networkRelation } = await supabaseAdmin
      .from('partner_network')
      .select('parent_partner_id')
      .eq('child_partner_id', partnerId)
      .eq('is_active', true)
      .single();

    if (networkRelation) {
      const overrideAmount = netPaidAmount * overrideRate;
      const { error: overrideErr } = await supabaseAdmin.from('partner_commissions').upsert({
        partner_id: partnerId,
        beneficiary_partner_id: networkRelation.parent_partner_id,
        commission_type: 'OVERRIDE',
        source_paid_contract_id: paidContractId,
        clinic_external_id: clinicId,
        net_paid_amount: netPaidAmount,
        commission_rate: overrideRate,
        commission_amount: overrideAmount,
        reference_month: referenceMonth,
        job_id: jobId,
      }, { onConflict: 'source_paid_contract_id,beneficiary_partner_id,commission_type' });

      if (!overrideErr) processed++;
    }

    return new Response(
      JSON.stringify({ success: true, processed, message: `${processed} comissões processadas` }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Compute commission error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
