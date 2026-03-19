import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp, TrendingDown, Minus,
  Building2, BarChart3
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts';
import ClinicFilters from './ClinicFilters';

interface Props {
  /** If set, only show clinics belonging to this partner */
  partnerId?: string;
  /** If set, show clinics for this partner + network */
  masterPartnerId?: string;
}

type Trend = 'up' | 'stable' | 'down';

interface ClinicAnalysis {
  id: string;
  clinic_name: string;
  partner_id: string;
  partner_name?: string;
  is_active: boolean;
  consultations_count: number;
  weeklyData: { week: string; count: number }[];
  trend: Trend;
  trendPercent: number;
  avgDaily: number;
}

const trendConfig: Record<Trend, { icon: typeof TrendingUp; label: string; color: string; badgeClass: string }> = {
  up: { icon: TrendingUp, label: 'Em alta', color: 'hsl(var(--chart-2))', badgeClass: 'bg-green-100 text-green-800' },
  stable: { icon: Minus, label: 'Estável', color: 'hsl(var(--chart-4))', badgeClass: 'bg-blue-100 text-blue-800' },
  down: { icon: TrendingDown, label: 'Em queda', color: 'hsl(var(--destructive))', badgeClass: 'bg-red-100 text-red-800' },
};

const ClinicSimulationAnalysis = ({ partnerId, masterPartnerId }: Props) => {
  const [clinics, setClinics] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [networkPartnerIds, setNetworkPartnerIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [trendFilter, setTrendFilter] = useState<Trend | 'all'>('all');
  const [period, setPeriod] = useState<'7' | '30' | '90'>('30');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [selectedPartnerId, setSelectedPartnerId] = useState('all');

  useEffect(() => { fetchData(); }, [partnerId, masterPartnerId, period, dateFrom, dateTo, selectedPartnerId]);

  const fetchData = async () => {
    setLoading(true);

    // Determine relevant partner IDs
    let relevantPartnerIds: string[] = [];
    
    // UI filter takes precedence when not in partner-scoped mode
    if (!partnerId && !masterPartnerId && selectedPartnerId !== 'all') {
      // Check if selected is a master partner to include their network
      const selectedPartner = (await supabase.from('partners').select('id, type').eq('id', selectedPartnerId).maybeSingle()).data;
      if (selectedPartner?.type === 'MASTER') {
        const { data: network } = await supabase
          .from('partner_network')
          .select('child_partner_id')
          .eq('parent_partner_id', selectedPartnerId)
          .eq('is_active', true);
        relevantPartnerIds = [selectedPartnerId, ...(network || []).map(n => n.child_partner_id)];
      } else {
        relevantPartnerIds = [selectedPartnerId];
      }
    } else if (masterPartnerId) {
      const { data: network } = await supabase
        .from('partner_network')
        .select('child_partner_id')
        .eq('parent_partner_id', masterPartnerId)
        .eq('is_active', true);
      relevantPartnerIds = [masterPartnerId, ...(network || []).map(n => n.child_partner_id)];
      setNetworkPartnerIds(relevantPartnerIds);
    } else if (partnerId) {
      relevantPartnerIds = [partnerId];
    }

    // Fetch clinics
    let clinicsQuery = supabase.from('partner_clinic_relations').select('*');
    if (relevantPartnerIds.length > 0) {
      clinicsQuery = clinicsQuery.in('partner_id', relevantPartnerIds);
    }
    const { data: clinicsData } = await clinicsQuery;

    // Fetch partners for names + filter dropdown
    const { data: partnersData } = await supabase.from('partners').select('id, legal_name, type');

    // Fetch metrics filtered by date range or period
    let sinceDate: string;
    let untilDate: string | undefined;
    if (dateFrom) {
      sinceDate = dateFrom.toISOString().split('T')[0];
      untilDate = dateTo ? dateTo.toISOString().split('T')[0] : undefined;
    } else {
      const d = new Date();
      d.setDate(d.getDate() - Number(period));
      sinceDate = d.toISOString().split('T')[0];
    }
    
    let metricsQuery = supabase.from('partner_metrics_daily').select('*').gte('metric_date', sinceDate).order('metric_date', { ascending: true }).limit(1000);
    if (untilDate) {
      metricsQuery = metricsQuery.lte('metric_date', untilDate);
    }
    if (relevantPartnerIds.length > 0) {
      metricsQuery = metricsQuery.in('partner_id', relevantPartnerIds);
    }
    const { data: metricsData } = await metricsQuery;

    setClinics(clinicsData || []);
    setPartners(partnersData || []);
    setMetrics(metricsData || []);
    setLoading(false);
  };

  const partnerNameMap = useMemo(() => {
    const m: Record<string, string> = {};
    partners.forEach(p => { m[p.id] = p.legal_name; });
    return m;
  }, [partners]);

  // Build weekly data per clinic (approximate from partner metrics split by clinic count)
  const clinicAnalyses: ClinicAnalysis[] = useMemo(() => {
    if (!clinics.length) return [];

    // Group metrics by partner and week
    const partnerMetricsByWeek: Record<string, Record<string, { consultations: number; days: number }>> = {};
    metrics.forEach(m => {
      const d = new Date(m.metric_date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      if (!partnerMetricsByWeek[m.partner_id]) partnerMetricsByWeek[m.partner_id] = {};
      if (!partnerMetricsByWeek[m.partner_id][weekKey]) partnerMetricsByWeek[m.partner_id][weekKey] = { consultations: 0, days: 0 };
      partnerMetricsByWeek[m.partner_id][weekKey].consultations += Number(m.consultations || 0);
      partnerMetricsByWeek[m.partner_id][weekKey].days += 1;
    });

    return clinics.map(clinic => {
      const pMetrics = partnerMetricsByWeek[clinic.partner_id] || {};
      const clinicsForPartner = clinics.filter(c => c.partner_id === clinic.partner_id && c.is_active).length || 1;

      const weeks = Object.keys(pMetrics).sort();
      const weeklyData = weeks.map(w => ({
        week: new Date(w).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        count: Math.round(pMetrics[w].consultations / clinicsForPartner),
      }));

      // Calculate trend (last 2 weeks vs previous 2 weeks)
      let trend: Trend = 'stable';
      let trendPercent = 0;
      if (weeklyData.length >= 2) {
        const recent = weeklyData.slice(-2).reduce((s, w) => s + w.count, 0);
        const previous = weeklyData.slice(-4, -2).reduce((s, w) => s + w.count, 0) || recent;
        if (previous > 0) {
          trendPercent = ((recent - previous) / previous) * 100;
          if (trendPercent > 10) trend = 'up';
          else if (trendPercent < -10) trend = 'down';
          else trend = 'stable';
        }
      }

      const totalDays = Object.values(pMetrics).reduce((s, w) => s + w.days, 0) || 1;
      const totalConsultations = Object.values(pMetrics).reduce((s, w) => s + w.consultations, 0);
      const avgDaily = Math.round((totalConsultations / clinicsForPartner) / totalDays * 10) / 10;

      return {
        id: clinic.id,
        clinic_name: clinic.clinic_name,
        partner_id: clinic.partner_id,
        partner_name: partnerNameMap[clinic.partner_id],
        is_active: clinic.is_active,
        consultations_count: clinic.consultations_count,
        weeklyData,
        trend,
        trendPercent: Math.round(trendPercent),
        avgDaily,
      };
    });
  }, [clinics, metrics, partnerNameMap]);

  const filtered = useMemo(() => {
    return clinicAnalyses
      .filter(c => trendFilter === 'all' || c.trend === trendFilter)
      .filter(c => !search || c.clinic_name.toLowerCase().includes(search.toLowerCase()) || c.partner_name?.toLowerCase().includes(search.toLowerCase()));
  }, [clinicAnalyses, search, trendFilter]);

  // Aggregated weekly chart
  const aggregatedWeekly = useMemo(() => {
    const weekMap: Record<string, number> = {};
    clinicAnalyses.forEach(c => {
      c.weeklyData.forEach(w => {
        weekMap[w.week] = (weekMap[w.week] || 0) + w.count;
      });
    });
    return Object.entries(weekMap).map(([week, count]) => ({ week, count }));
  }, [clinicAnalyses]);

  const trendCounts = useMemo(() => ({
    up: clinicAnalyses.filter(c => c.trend === 'up').length,
    stable: clinicAnalyses.filter(c => c.trend === 'stable').length,
    down: clinicAnalyses.filter(c => c.trend === 'down').length,
  }), [clinicAnalyses]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Filter */}
      <Tabs value={period} onValueChange={(v) => setPeriod(v as '7' | '30' | '90')}>
        <TabsList>
          <TabsTrigger value="7">7 dias</TabsTrigger>
          <TabsTrigger value="30">30 dias</TabsTrigger>
          <TabsTrigger value="90">90 dias</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6 text-center">
          <Building2 className="h-8 w-8 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold">{clinicAnalyses.length}</p>
          <p className="text-xs text-muted-foreground">Total Clínicas</p>
        </CardContent></Card>
        <Card className="cursor-pointer hover:ring-2 ring-green-500/50" onClick={() => setTrendFilter(f => f === 'up' ? 'all' : 'up')}>
          <CardContent className="pt-6 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold text-green-600">{trendCounts.up}</p>
            <p className="text-xs text-muted-foreground">Em Alta</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:ring-2 ring-blue-500/50" onClick={() => setTrendFilter(f => f === 'stable' ? 'all' : 'stable')}>
          <CardContent className="pt-6 text-center">
            <Minus className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold text-blue-600">{trendCounts.stable}</p>
            <p className="text-xs text-muted-foreground">Estável</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:ring-2 ring-red-500/50" onClick={() => setTrendFilter(f => f === 'down' ? 'all' : 'down')}>
          <CardContent className="pt-6 text-center">
            <TrendingDown className="h-8 w-8 mx-auto mb-2 text-destructive" />
            <p className="text-2xl font-bold text-destructive">{trendCounts.down}</p>
            <p className="text-xs text-muted-foreground">Em Queda</p>
          </CardContent>
        </Card>
      </div>

      {/* Aggregated Chart */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Evolução Semanal de Simulações (Agregado)</CardTitle></CardHeader>
        <CardContent>
          {aggregatedWeekly.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={aggregatedWeekly}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="week" className="text-xs" />
                <YAxis className="text-xs" />
                <ReTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Bar dataKey="count" name="Simulações" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">Sem dados de métricas disponíveis</p>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <ClinicFilters
        search={search}
        onSearchChange={setSearch}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        partners={partners}
        selectedPartnerId={selectedPartnerId}
        onPartnerChange={setSelectedPartnerId}
        hidePartnerFilter={!!partnerId || !!masterPartnerId}
        onRefresh={fetchData}
      />

      {trendFilter !== 'all' && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Filtro: {trendConfig[trendFilter].label}</Badge>
          <Button variant="ghost" size="sm" onClick={() => setTrendFilter('all')}>Limpar filtro</Button>
        </div>
      )}

      {/* Clinic Cards */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Nenhuma clínica encontrada</p>
          </CardContent></Card>
        ) : (
          filtered.map(clinic => {
            const cfg = trendConfig[clinic.trend];
            const TrendIcon = cfg.icon;
            return (
              <Card key={clinic.id} className="overflow-hidden">
                <div className="flex flex-col lg:flex-row">
                  <div className="flex-1 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{clinic.clinic_name}</h3>
                        {clinic.partner_name && <p className="text-xs text-muted-foreground">Partner: {clinic.partner_name}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={cfg.badgeClass}>
                          <TrendIcon className="h-3 w-3 mr-1" />
                          {cfg.label} ({clinic.trendPercent > 0 ? '+' : ''}{clinic.trendPercent}%)
                        </Badge>
                        <Badge variant={clinic.is_active ? 'default' : 'secondary'}>
                          {clinic.is_active ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-2 rounded-lg bg-muted/50">
                        <p className="text-lg font-bold">{clinic.consultations_count}</p>
                        <p className="text-xs text-muted-foreground">Simulações Total</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-muted/50">
                        <p className="text-lg font-bold">{clinic.avgDaily}</p>
                        <p className="text-xs text-muted-foreground">Média/Dia</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-muted/50">
                        <p className="text-lg font-bold">{clinic.weeklyData.length}</p>
                        <p className="text-xs text-muted-foreground">Semanas Ativas</p>
                      </div>
                    </div>
                  </div>
                  <div className="lg:w-[300px] p-4 border-t lg:border-t-0 lg:border-l border-border">
                    {clinic.weeklyData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={120}>
                        <LineChart data={clinic.weeklyData}>
                          <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                          <YAxis hide />
                          <ReTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }} />
                          <Line type="monotone" dataKey="count" stroke={cfg.color} strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[120px] text-muted-foreground text-sm">Sem dados</div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ClinicSimulationAnalysis;
