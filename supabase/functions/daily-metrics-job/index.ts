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

    const today = new Date().toISOString().split('T')[0];

    // Fetch all active partners
    const { data: partners } = await supabaseAdmin
      .from('partners')
      .select('id, current_level, status')
      .eq('status', 'ACTIVE');

    if (!partners || partners.length === 0) {
      return new Response(JSON.stringify({ message: 'Nenhum partner ativo', processed: 0 }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch SEH weights
    const { data: sehConfig } = await supabaseAdmin
      .from('partner_system_config')
      .select('config_value')
      .eq('config_key', 'seh_weights')
      .single();
    const weights = (sehConfig?.config_value as any) || { activation: 0.30, volume: 0.35, conversion: 0.35 };

    // Fetch alert rules
    const { data: alertRulesConfig } = await supabaseAdmin
      .from('partner_system_config')
      .select('config_value')
      .eq('config_key', 'alert_rules_inactivity')
      .single();
    const alertRules = (alertRulesConfig?.config_value as any) || { inactive_days: 7, seh_drop_threshold: 10 };

    let metricsProcessed = 0;
    let alertsGenerated = 0;

    for (const partner of partners) {
      // Clinic stats
      const { data: clinics } = await supabaseAdmin
        .from('partner_clinic_relations')
        .select('id, is_active, is_qualified, consultations_count, approvals_count, paid_count')
        .eq('partner_id', partner.id);

      const totalClinics = clinics?.length || 0;
      const activeClinics = clinics?.filter(c => c.is_active).length || 0;
      const qualifiedClinics = clinics?.filter(c => c.is_qualified).length || 0;
      const consultations = clinics?.reduce((s, c) => s + (c.consultations_count || 0), 0) || 0;
      const approvals = clinics?.reduce((s, c) => s + (c.approvals_count || 0), 0) || 0;
      const paidContracts = clinics?.reduce((s, c) => s + (c.paid_count || 0), 0) || 0;

      // Commission totals for this partner
      const { data: comms } = await supabaseAdmin
        .from('partner_commissions')
        .select('commission_amount')
        .eq('beneficiary_partner_id', partner.id);
      const paidAmount = comms?.reduce((s, c) => s + Number(c.commission_amount || 0), 0) || 0;

      // Rates
      const approvalRate = consultations > 0 ? (approvals / consultations) * 100 : 0;
      const paidRate = approvals > 0 ? (paidContracts / approvals) * 100 : 0;

      // SEH calc
      const activationRate = totalClinics > 0 ? (activeClinics / totalClinics) * 100 : 0;
      const pilarActivation = Math.min(activationRate, 100);
      const pilarVolume = Math.min((consultations / 100) * 100, 100);
      const pilarConversion = (approvalRate * 0.5 + paidRate * 0.5);
      const seh = (pilarActivation * weights.activation) + (pilarVolume * weights.volume) + (pilarConversion * weights.conversion);
      const sehScore = Math.min(Math.max(seh, 0), 100);

      // Potential lost (approved but not paid)
      const potentialLost = (approvals - paidContracts) * (paidAmount / Math.max(paidContracts, 1));

      // Upsert daily metric
      await supabaseAdmin.from('partner_metrics_daily').upsert({
        partner_id: partner.id,
        metric_date: today,
        total_clinics_direct: totalClinics,
        active_clinics: activeClinics,
        qualified_clinics: qualifiedClinics,
        consultations,
        approvals,
        paid_contracts: paidContracts,
        paid_amount: paidAmount,
        approval_rate: approvalRate,
        paid_rate: paidRate,
        seh_score: sehScore,
        potential_lost_amount: potentialLost > 0 ? potentialLost : 0,
      }, { onConflict: 'partner_id,metric_date' });

      // Update partner SEH
      let newLevel = 'BRONZE';
      if (sehScore >= 85) newLevel = 'ELITE';
      else if (sehScore >= 70) newLevel = 'OURO';
      else if (sehScore >= 50) newLevel = 'PRATA';

      await supabaseAdmin.from('partners').update({
        seh_score: sehScore,
        current_level: newLevel,
      }).eq('id', partner.id);

      metricsProcessed++;

      // --- ALERT GENERATION ---

      // 1. Inactive clinics alert
      const inactiveClinics = clinics?.filter(c => !c.is_active) || [];
      if (inactiveClinics.length > 0 && totalClinics > 0 && (inactiveClinics.length / totalClinics) > 0.5) {
        await supabaseAdmin.from('partner_alerts').insert({
          partner_id: partner.id,
          alert_type: 'CLINIC_INACTIVITY',
          title: `${inactiveClinics.length} clínicas inativas`,
          description: `Mais de 50% das clínicas do partner estão inativas (${inactiveClinics.length}/${totalClinics}).`,
          severity: 'HIGH',
        });
        alertsGenerated++;
      }

      // 2. SEH drop alert — compare with previous day
      const { data: prevMetric } = await supabaseAdmin
        .from('partner_metrics_daily')
        .select('seh_score')
        .eq('partner_id', partner.id)
        .lt('metric_date', today)
        .order('metric_date', { ascending: false })
        .limit(1)
        .single();

      if (prevMetric && (Number(prevMetric.seh_score) - sehScore) >= (alertRules.seh_drop_threshold || 10)) {
        await supabaseAdmin.from('partner_alerts').insert({
          partner_id: partner.id,
          alert_type: 'SEH_DROP',
          title: `Queda de SEH: ${Number(prevMetric.seh_score).toFixed(1)} → ${sehScore.toFixed(1)}`,
          description: `O SEH caiu ${(Number(prevMetric.seh_score) - sehScore).toFixed(1)} pontos em relação ao dia anterior.`,
          severity: 'CRITICAL',
        });
        alertsGenerated++;
      }

      // 3. Low conversion alert
      if (consultations > 10 && approvalRate < 20) {
        await supabaseAdmin.from('partner_alerts').insert({
          partner_id: partner.id,
          alert_type: 'LOW_CONVERSION',
          title: `Taxa de aprovação muito baixa: ${approvalRate.toFixed(1)}%`,
          description: `Com ${consultations} consultas, apenas ${approvalRate.toFixed(1)}% foram aprovadas.`,
          severity: 'MEDIUM',
        });
        alertsGenerated++;
      }
    }

    // --- MASTER NETWORK METRICS ---
    const { data: masters } = await supabaseAdmin
      .from('partners')
      .select('id')
      .eq('type', 'MASTER')
      .eq('status', 'ACTIVE');

    for (const master of (masters || [])) {
      const { data: network } = await supabaseAdmin
        .from('partner_network')
        .select('child_partner_id, is_active')
        .eq('parent_partner_id', master.id);

      const childIds = (network || []).map(n => n.child_partner_id);
      const activeNetworkPartners = (network || []).filter(n => n.is_active).length;

      if (childIds.length === 0) continue;

      // Sum child metrics
      const { data: childMetrics } = await supabaseAdmin
        .from('partner_metrics_daily')
        .select('*')
        .in('partner_id', childIds)
        .eq('metric_date', today);

      const agg = (childMetrics || []).reduce((acc, m) => ({
        clinics_total: acc.clinics_total + (m.total_clinics_direct || 0),
        clinics_active: acc.clinics_active + (m.active_clinics || 0),
        consultations: acc.consultations + (m.consultations || 0),
        approvals: acc.approvals + (m.approvals || 0),
        paid_contracts: acc.paid_contracts + (m.paid_contracts || 0),
        paid_amount: acc.paid_amount + Number(m.paid_amount || 0),
      }), { clinics_total: 0, clinics_active: 0, consultations: 0, approvals: 0, paid_contracts: 0, paid_amount: 0 });

      // Override commissions for this master
      const { data: overrideComms } = await supabaseAdmin
        .from('partner_commissions')
        .select('commission_amount')
        .eq('beneficiary_partner_id', master.id)
        .eq('commission_type', 'OVERRIDE');
      const overrideAmount = overrideComms?.reduce((s, c) => s + Number(c.commission_amount || 0), 0) || 0;

      // IDR = (active partners / total) * 100
      const idr = childIds.length > 0 ? (activeNetworkPartners / childIds.length) * 100 : 0;

      await supabaseAdmin.from('master_network_metrics').upsert({
        master_partner_id: master.id,
        metric_date: today,
        total_network_partners: childIds.length,
        active_network_partners: activeNetworkPartners,
        network_clinics_total: agg.clinics_total,
        network_clinics_active: agg.clinics_active,
        network_consultations: agg.consultations,
        network_approvals: agg.approvals,
        network_paid_contracts: agg.paid_contracts,
        network_paid_amount: agg.paid_amount,
        idr_score: idr,
        override_amount: overrideAmount,
      }, { onConflict: 'master_partner_id,metric_date' });
    }

    return new Response(
      JSON.stringify({ success: true, metricsProcessed, alertsGenerated }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Daily metrics job error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
