import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get all active clinics with their partner info
    const { data: clinics, error: clinicsErr } = await supabase
      .from("partner_clinic_relations")
      .select("id, clinic_name, partner_id, is_active")
      .eq("is_active", true);

    if (clinicsErr) throw clinicsErr;

    // Get metrics for last 4 weeks
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const { data: metrics, error: metricsErr } = await supabase
      .from("partner_metrics_daily")
      .select("partner_id, metric_date, consultations")
      .gte("metric_date", fourWeeksAgo.toISOString().split("T")[0])
      .order("metric_date", { ascending: true });

    if (metricsErr) throw metricsErr;

    // Group metrics by partner and week
    const partnerWeeklyMetrics: Record<string, Record<string, number>> = {};
    for (const m of metrics || []) {
      const d = new Date(m.metric_date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const weekKey = weekStart.toISOString().split("T")[0];

      if (!partnerWeeklyMetrics[m.partner_id])
        partnerWeeklyMetrics[m.partner_id] = {};
      partnerWeeklyMetrics[m.partner_id][weekKey] =
        (partnerWeeklyMetrics[m.partner_id][weekKey] || 0) +
        Number(m.consultations || 0);
    }

    const alertsToCreate: any[] = [];

    // For each clinic, check if there's a 2-week consecutive decline
    for (const clinic of clinics || []) {
      const pMetrics = partnerWeeklyMetrics[clinic.partner_id];
      if (!pMetrics) continue;

      const weeks = Object.keys(pMetrics).sort();
      if (weeks.length < 3) continue; // Need at least 3 weeks to detect 2-week decline

      // Count active clinics for this partner to estimate per-clinic volume
      const partnerClinics =
        (clinics || []).filter(
          (c: any) => c.partner_id === clinic.partner_id && c.is_active
        ).length || 1;

      const weeklyValues = weeks.map(
        (w) => Math.round(pMetrics[w] / partnerClinics)
      );

      // Check last 2 weeks vs the one before
      const len = weeklyValues.length;
      const w1 = weeklyValues[len - 3]; // 2 weeks ago
      const w2 = weeklyValues[len - 2]; // last week
      const w3 = weeklyValues[len - 1]; // current week

      // 2 consecutive declines: w1 > w2 > w3 (each drop > 10%)
      if (w1 > 0 && w2 > 0) {
        const drop1 = ((w1 - w2) / w1) * 100;
        const drop2 = ((w2 - w3) / w2) * 100;

        if (drop1 > 10 && drop2 > 10) {
          // Check if alert already exists for this clinic this week
          const thisWeekStart = new Date();
          thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());

          const { data: existing } = await supabase
            .from("partner_alerts")
            .select("id")
            .eq("partner_id", clinic.partner_id)
            .eq("clinic_relation_id", clinic.id)
            .eq("alert_type", "SIMULATION_DECLINE")
            .gte("alert_date", thisWeekStart.toISOString().split("T")[0])
            .is("resolved_at", null)
            .limit(1);

          if (!existing || existing.length === 0) {
            alertsToCreate.push({
              partner_id: clinic.partner_id,
              clinic_relation_id: clinic.id,
              alert_type: "SIMULATION_DECLINE",
              title: `Queda de simulações: ${clinic.clinic_name}`,
              description: `A clínica ${clinic.clinic_name} apresenta queda consecutiva de simulações por 2 semanas. Volume semanal: ${w1} → ${w2} → ${w3} simulações.`,
              severity: drop1 > 30 || drop2 > 30 ? "HIGH" : "MEDIUM",
              metadata: {
                clinic_name: clinic.clinic_name,
                weekly_volumes: { week_minus_2: w1, week_minus_1: w2, current_week: w3 },
                drop_percent_1: Math.round(drop1),
                drop_percent_2: Math.round(drop2),
              },
            });
          }
        }
      }
    }

    // Insert alerts
    let insertedCount = 0;
    if (alertsToCreate.length > 0) {
      const { error: insertErr } = await supabase
        .from("partner_alerts")
        .insert(alertsToCreate);
      if (insertErr) throw insertErr;
      insertedCount = alertsToCreate.length;
    }

    return new Response(
      JSON.stringify({
        success: true,
        clinics_analyzed: (clinics || []).length,
        alerts_created: insertedCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
