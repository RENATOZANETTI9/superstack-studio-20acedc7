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

    const now = new Date();
    const referenceMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const jobId = `monthly_batch_${referenceMonth}_${Date.now()}`;

    // Fetch commission rates
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

    // Fetch Pix tiers
    const { data: pixConfigs } = await supabaseAdmin
      .from('partner_system_config')
      .select('config_value')
      .eq('config_key', 'pix_tiers')
      .single();
    const pixTiers = (pixConfigs?.config_value as any)?.tiers || [
      { min: 1, max: 30, amount: 20 },
      { min: 31, max: 60, amount: 40 },
      { min: 61, max: 999999, amount: 70 },
    ];

    // Fetch Mimo tiers
    const { data: mimoConfigs } = await supabaseAdmin
      .from('partner_system_config')
      .select('config_value')
      .eq('config_key', 'mimo_tiers')
      .single();
    const mimoTiers = (mimoConfigs?.config_value as any)?.tiers || [
      { min_paid: 10000, amount: 100 },
      { min_paid: 30000, amount: 250 },
      { min_paid: 50000, amount: 500 },
    ];

    let commissionsProcessed = 0;
    let incentivesProcessed = 0;

    // --- Process all PAID contracts this month that haven't been commissioned ---
    const monthStart = `${referenceMonth}-01`;
    const { data: paidContracts } = await supabaseAdmin
      .from('contracts')
      .select('id, amount_released, user_id')
      .eq('contract_status', 'PAGO')
      .gte('paid_at', monthStart);

    for (const contract of (paidContracts || [])) {
      // Check if already commissioned
      const { data: existing } = await supabaseAdmin
        .from('partner_commissions')
        .select('id')
        .eq('source_paid_contract_id', contract.id)
        .eq('commission_type', 'DIRECT')
        .limit(1);

      if (existing && existing.length > 0) continue;

      // Find clinic relation via user
      // For now, use the contract amount directly
      const netAmount = Number(contract.amount_released);

      // Find all active partner-clinic relations
      const { data: allRelations } = await supabaseAdmin
        .from('partner_clinic_relations')
        .select('partner_id, clinic_external_id')
        .eq('is_active', true);

      // For each relation, check and commission
      for (const rel of (allRelations || [])) {
        // Direct commission
        const directAmount = netAmount * directRate;
        await supabaseAdmin.from('partner_commissions').upsert({
          partner_id: rel.partner_id,
          beneficiary_partner_id: rel.partner_id,
          commission_type: 'DIRECT',
          source_paid_contract_id: contract.id,
          clinic_external_id: rel.clinic_external_id,
          net_paid_amount: netAmount,
          commission_rate: directRate,
          commission_amount: directAmount,
          reference_month: referenceMonth,
          job_id: jobId,
          status: 'CALCULATED',
        }, { onConflict: 'source_paid_contract_id,beneficiary_partner_id,commission_type' });
        commissionsProcessed++;

        // Override commission for parent
        const { data: networkRel } = await supabaseAdmin
          .from('partner_network')
          .select('parent_partner_id')
          .eq('child_partner_id', rel.partner_id)
          .eq('is_active', true)
          .single();

        if (networkRel) {
          const overrideAmount = netAmount * overrideRate;
          await supabaseAdmin.from('partner_commissions').upsert({
            partner_id: rel.partner_id,
            beneficiary_partner_id: networkRel.parent_partner_id,
            commission_type: 'OVERRIDE',
            source_paid_contract_id: contract.id,
            clinic_external_id: rel.clinic_external_id,
            net_paid_amount: netAmount,
            commission_rate: overrideRate,
            commission_amount: overrideAmount,
            reference_month: referenceMonth,
            job_id: jobId,
            status: 'CALCULATED',
          }, { onConflict: 'source_paid_contract_id,beneficiary_partner_id,commission_type' });
          commissionsProcessed++;
        }

        // CS internal commission
        const csAmount = netAmount * csRate;
        await supabaseAdmin.from('partner_commissions').upsert({
          partner_id: rel.partner_id,
          beneficiary_partner_id: rel.partner_id,
          commission_type: 'CS_INTERNAL',
          source_paid_contract_id: contract.id,
          clinic_external_id: rel.clinic_external_id,
          net_paid_amount: netAmount,
          commission_rate: csRate,
          commission_amount: csAmount,
          reference_month: referenceMonth,
          job_id: jobId,
          status: 'CALCULATED',
        }, { onConflict: 'source_paid_contract_id,beneficiary_partner_id,commission_type' });
        commissionsProcessed++;
        break; // One relation per contract
      }
    }

    // --- Attendant Incentives (Pix/Mimo) ---
    // Get all clinic users (attendants) with activity
    const { data: attendantContracts } = await supabaseAdmin
      .from('contracts')
      .select('user_id, amount_released')
      .eq('contract_status', 'PAGO')
      .gte('paid_at', monthStart);

    // Group by user
    const userAgg: Record<string, { count: number; amount: number }> = {};
    for (const c of (attendantContracts || [])) {
      if (!userAgg[c.user_id]) userAgg[c.user_id] = { count: 0, amount: 0 };
      userAgg[c.user_id].count++;
      userAgg[c.user_id].amount += Number(c.amount_released);
    }

    for (const [userId, agg] of Object.entries(userAgg)) {
      // Pix incentive based on CPFs (count)
      const pixTier = pixTiers.find((t: any) => agg.count >= t.min && agg.count <= t.max);
      if (pixTier) {
        await supabaseAdmin.from('attendant_incentives').upsert({
          clinic_user_id: userId,
          incentive_type: 'PIX',
          reference_month: referenceMonth,
          cpfs_generated: agg.count,
          paid_amount_generated: agg.amount,
          incentive_amount: pixTier.amount,
          pix_tier: `${pixTier.min}-${pixTier.max}`,
          job_id: jobId,
          status: 'CALCULATED',
        }, { onConflict: 'clinic_user_id,incentive_type,reference_month' });
        incentivesProcessed++;
      }

      // Mimo incentive based on paid amount
      const mimoTier = [...mimoTiers].reverse().find((t: any) => agg.amount >= t.min_paid);
      if (mimoTier) {
        await supabaseAdmin.from('attendant_incentives').upsert({
          clinic_user_id: userId,
          incentive_type: 'MIMO',
          reference_month: referenceMonth,
          cpfs_generated: agg.count,
          paid_amount_generated: agg.amount,
          incentive_amount: mimoTier.amount,
          job_id: jobId,
          status: 'CALCULATED',
        }, { onConflict: 'clinic_user_id,incentive_type,reference_month' });
        incentivesProcessed++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, commissionsProcessed, incentivesProcessed, referenceMonth, jobId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Monthly commission job error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
