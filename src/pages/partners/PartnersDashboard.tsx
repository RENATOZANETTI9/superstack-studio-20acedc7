import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, Building2, TrendingUp, DollarSign, AlertTriangle, 
  Target, Activity, Info, Phone, MapPin, Inbox
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import PartnerCharts from '@/components/partners/PartnerCharts';
import { usePartnerAlertRealtime } from '@/hooks/usePartnerAlertRealtime';
import { isRepresentanteRole } from '@/lib/partner-rules';
import { toast } from 'sonner';

type Period = 'hoje' | '7d' | '30d' | '90d';

const PERIOD_DAYS: Record<Period, number> = { hoje: 1, '7d': 7, '30d': 30, '90d': 90 };

const periodStartISO = (p: Period) => {
  const days = PERIOD_DAYS[p];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (days - 1));
  return d.toISOString().slice(0, 10);
};

function alertSeverityStyles(type: string, severity: string) {
  if (type === 'SEM_ATIVIDADE_HOJE') return { border: 'border-orange-300', bg: 'bg-orange-50', icon: 'text-orange-500', badge: 'bg-orange-100 text-orange-700' };
  if (type === 'NOVA_CLINICA_SEM_ATIVACAO') return { border: 'border-red-300', bg: 'bg-red-50', icon: 'text-red-500', badge: 'bg-red-100 text-red-700' };
  if (type === 'META_SEMANA_EM_RISCO') return { border: 'border-yellow-300', bg: 'bg-yellow-50', icon: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-700' };
  if (severity === 'CRITICAL') return { border: 'border-red-300', bg: 'bg-red-50', icon: 'text-red-500', badge: 'bg-red-100 text-red-700' };
  if (severity === 'HIGH') return { border: 'border-orange-300', bg: 'bg-orange-50', icon: 'text-orange-500', badge: 'bg-orange-100 text-orange-700' };
  return { border: 'border-yellow-300', bg: 'bg-yellow-50', icon: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-700' };
}

const PartnersDashboard = () => {
  const { user, role } = useAuth();
  usePartnerAlertRealtime();
  const [partners, setPartners] = useState<any[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('7d');
  const [contactAlert, setContactAlert] = useState<any | null>(null);
  const [contactNote, setContactNote] = useState('');

  useEffect(() => { fetchData(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [period]);

  const fetchData = async () => {
    setLoading(true);
    setLoadError(null);
    const startDate = periodStartISO(period);

    const partnerRes = await supabase
      .from('partners')
      .select('id, status, seh_score, type, user_id, created_at')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(50);
    const partnerData = partnerRes.data || [];
    setPartners(partnerData);

    const isRep = isRepresentanteRole(role as any);
    const partnerId = partnerData[0]?.id;
    const clinicsBase = supabase
      .from('partner_clinic_relations')
      .select('id, partner_id, clinic_external_id, clinic_name, is_active, is_qualified')
      .limit(500);
    const clinicsRes = (isRep && partnerId)
      ? await clinicsBase.eq('partner_id', partnerId)
      : await clinicsBase;

    const [metricsRes, alertsRes, commissionsRes] = await Promise.all([
      supabase.from('partner_metrics_daily')
        .select('partner_id, metric_date, consultations, seh_score')
        .gte('metric_date', startDate)
        .order('metric_date', { ascending: false })
        .limit(500),
      supabase.from('partner_alerts')
        .select('id, partner_id, alert_type, severity, title, description, alert_date, resolved_at')
        .is('resolved_at', null)
        .gte('alert_date', startDate)
        .order('alert_date', { ascending: false })
        .limit(20),
      supabase.from('partner_commissions')
        .select('id, commission_amount, status, reference_month, created_at')
        .gte('reference_month', startDate.slice(0, 7))
        .order('created_at', { ascending: false })
        .limit(100),
    ]);

    const firstErr = partnerRes.error || clinicsRes.error || metricsRes.error || alertsRes.error || commissionsRes.error;
    if (firstErr) setLoadError(firstErr.message);
    setClinics(clinicsRes.data || []);
    setMetrics(metricsRes.data || []);
    setAlerts(alertsRes.data || []);
    setCommissions(commissionsRes.data || []);
    setLoading(false);
  };

  const allAlerts = alerts;

  const totalPartners = partners.length;
  const activePartners = partners.filter(p => p.status === 'ACTIVE').length;
  const totalClinics = clinics.length;
  const activeClinics = clinics.filter(c => c.is_active).length;
  const totalBonificacoes = commissions.reduce((sum, c) => sum + Number(c.commission_amount || 0), 0);
  const pendingAlerts = allAlerts.length;
  const avgSeh = partners.length > 0 
    ? (partners.reduce((sum, p) => sum + Number(p.seh_score || 0), 0) / partners.length).toFixed(1) 
    : '0';

  // Hoje KPIs — derivados de partner_metrics_daily (data == hoje).
  const todayKey = new Date().toISOString().slice(0, 10);
  const todaysMetrics = metrics.filter((m: any) => (m.metric_date || '').slice(0, 10) === todayKey);
  const totalToday = todaysMetrics.reduce((s: number, m: any) => s + Number(m.consultations || 0), 0);
  const clinicsActiveToday = todaysMetrics.filter((m: any) => Number(m.consultations || 0) > 0).length;
  const clinicsCriticalToday = 0;
  const hasTodayData = todaysMetrics.length > 0;

  const handleRegisterContact = () => {
    toast.success('Contato registrado', { description: contactNote || 'Sem observações.' });
    setContactAlert(null);
    setContactNote('');
  };

  const handleAddToRoute = (clinicName: string | null) => {
    toast.success(`${clinicName || 'Clínicas'} adicionada(s) à rota da semana`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {loadError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 flex items-center justify-between gap-3">
            <span>Erro ao carregar dados: {loadError}</span>
            <Button size="sm" variant="outline" onClick={fetchData}>Tentar novamente</Button>
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Meu Painel · Partners</h1>
            <p className="text-sm text-muted-foreground">Monitoramento de clínicas e performance operacional</p>
          </div>
          <Button onClick={fetchData} variant="outline" size="sm">Atualizar dados</Button>
        </div>

        {/* Period selector */}
        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <TabsList>
            <TabsTrigger value="hoje" className="text-xs sm:text-sm">Hoje</TabsTrigger>
            <TabsTrigger value="7d" className="text-xs sm:text-sm">7 dias</TabsTrigger>
            <TabsTrigger value="30d" className="text-xs sm:text-sm">30 dias</TabsTrigger>
            <TabsTrigger value="90d" className="text-xs sm:text-sm">90 dias</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* KPI Cards */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {[0,1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
          </div>
        ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {period === 'hoje' ? (
            <>
              <Card><CardContent className="pt-4 sm:pt-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-blue-500/10"><Activity className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" /></div>
                  <div><p className="text-[10px] sm:text-sm text-muted-foreground">Simulações hoje</p><p className="text-lg sm:text-2xl font-bold">{totalToday}</p></div>
                </div>
              </CardContent></Card>
              <Card><CardContent className="pt-4 sm:pt-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-green-500/10"><Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" /></div>
                  <div><p className="text-[10px] sm:text-sm text-muted-foreground">Clínicas ativas hoje</p><p className="text-lg sm:text-2xl font-bold">{clinicsActiveToday}/{todaysMetrics.length}</p></div>
                </div>
              </CardContent></Card>
              <Card><CardContent className="pt-4 sm:pt-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-red-500/10"><AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" /></div>
                  <div><p className="text-[10px] sm:text-sm text-muted-foreground">Clínicas críticas</p><p className="text-lg sm:text-2xl font-bold">{clinicsCriticalToday}</p></div>
                </div>
              </CardContent></Card>
              <Card><CardContent className="pt-4 sm:pt-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-yellow-500/10"><AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" /></div>
                  <div><p className="text-[10px] sm:text-sm text-muted-foreground">Alertas pendentes</p><p className="text-lg sm:text-2xl font-bold">{pendingAlerts}</p></div>
                </div>
              </CardContent></Card>
              <Card><CardContent className="pt-4 sm:pt-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10"><Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary" /></div>
                  <div><p className="text-[10px] sm:text-sm text-muted-foreground">Desempenho Médio</p><p className="text-lg sm:text-2xl font-bold">{avgSeh}</p></div>
                </div>
              </CardContent></Card>
            </>
          ) : (
            <>
              <Card><CardContent className="pt-4 sm:pt-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-green-500/10"><Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" /></div>
                  <div><p className="text-[10px] sm:text-sm text-muted-foreground">Clínicas</p><p className="text-lg sm:text-2xl font-bold">{totalClinics}</p><p className="text-[10px] sm:text-xs text-muted-foreground">{activeClinics} ativas</p></div>
                </div>
              </CardContent></Card>
              <Card><CardContent className="pt-4 sm:pt-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-blue-500/10"><Target className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" /></div>
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="text-[10px] sm:text-sm text-muted-foreground">Desempenho Médio</p>
                      <Tooltip>
                        <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                         <TooltipContent className="max-w-[280px]">
                           <p className="text-xs font-medium mb-1">Score de Eficiência Help Ude (0-100)</p>
                           <ul className="text-xs mt-1 space-y-0.5">
                             <li>• <strong>Volume (50%)</strong>: simulações vs meta</li>
                             <li>• <strong>Conversão (50%)</strong>: aprovação + pagamento</li>
                           </ul>
                         </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold">{avgSeh}</p><p className="text-[10px] sm:text-xs text-muted-foreground">Volume + Conversão</p>
                  </div>
                </div>
              </CardContent></Card>
              <Card><CardContent className="pt-4 sm:pt-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-yellow-500/10"><DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" /></div>
                  <div><p className="text-[10px] sm:text-sm text-muted-foreground">Bonificações</p><p className="text-lg sm:text-2xl font-bold">R$ {totalBonificacoes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p><p className="text-[10px] sm:text-xs text-muted-foreground">Acumulado</p></div>
                </div>
              </CardContent></Card>
              <Card><CardContent className="pt-4 sm:pt-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-red-500/10"><AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" /></div>
                  <div><p className="text-[10px] sm:text-sm text-muted-foreground">Alertas</p><p className="text-lg sm:text-2xl font-bold">{pendingAlerts}</p><p className="text-[10px] sm:text-xs text-muted-foreground">Pendentes</p></div>
                </div>
              </CardContent></Card>
            </>
          )}
        </div>
        )}

        {period === 'hoje' && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Atividade do dia · Clínicas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!hasTodayData ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Inbox className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-medium">Sem dados ainda — nenhuma atividade registrada hoje</p>
                  <p className="text-xs mt-1">A produção do dia aparecerá aqui assim que as clínicas registrarem simulações.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {todaysMetrics.map((m: any) => (
                    <div key={m.partner_id + '_' + m.metric_date} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                      <p className="font-medium text-sm">{m.partner_id}</p>
                      <p className="text-sm font-bold">{m.consultations || 0} simulações</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <PartnerCharts metrics={metrics} commissions={commissions} />

        {/* Alertas */}
        <Card>
          <CardHeader><CardTitle className="text-base sm:text-lg">Alertas Pendentes ({pendingAlerts})</CardTitle></CardHeader>
          <CardContent>
            {allAlerts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Inbox className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Sem dados ainda — nenhum alerta pendente no período selecionado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allAlerts.map((alert: any) => {
                  const styles = alertSeverityStyles(alert.alert_type, alert.severity);
                  return (
                    <div key={alert.id} className={`flex flex-col sm:flex-row sm:items-start gap-3 p-3 sm:p-4 rounded-lg border-2 ${styles.border} ${styles.bg}`}>
                      <AlertTriangle className={`h-5 w-5 mt-0.5 shrink-0 ${styles.icon}`} />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm">{alert.title}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{alert.description}</p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <Badge variant="outline" className={`text-[10px] ${styles.badge} border-0`}>{alert.alert_type}</Badge>
                          <Badge variant="outline" className="text-[10px]">{alert.severity}</Badge>
                        </div>
                      </div>
                      <div className="flex flex-row sm:flex-col gap-2 shrink-0">
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => setContactAlert(alert)}>
                          <Phone className="h-3 w-3" /> Registrar Contato
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => handleAddToRoute(alert.clinic_name)}>
                          <MapPin className="h-3 w-3" /> Adicionar à Rota
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Modal */}
        <Dialog open={!!contactAlert} onOpenChange={(o) => { if (!o) { setContactAlert(null); setContactNote(''); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar contato</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{contactAlert?.title}</p>
              <Textarea
                placeholder="Anote o que foi conversado, próximos passos, data da próxima visita..."
                value={contactNote}
                onChange={(e) => setContactNote(e.target.value)}
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => { setContactAlert(null); setContactNote(''); }}>Cancelar</Button>
              <Button onClick={handleRegisterContact}>Salvar contato</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default PartnersDashboard;
