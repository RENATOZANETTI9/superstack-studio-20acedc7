import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, Building2, TrendingUp, DollarSign, AlertTriangle, 
  Target, Activity, Info
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import PartnerCharts from '@/components/partners/PartnerCharts';
import { usePartnerAlertRealtime } from '@/hooks/usePartnerAlertRealtime';

const typeColors: Record<string, string> = {
  PARTNER: 'bg-primary text-white',
  MASTER: 'bg-purple-600 text-white',
};

const sehPillars = [
  { name: 'Volume', weight: '50%', desc: 'Simulações realizadas vs meta mensal' },
  { name: 'Conversão', weight: '50%', desc: 'Média entre taxa de aprovação e taxa de pagamento' },
];

const PartnersDashboard = () => {
  const { user } = useAuth();
  usePartnerAlertRealtime();
  const [partners, setPartners] = useState<any[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const [partnersRes, clinicsRes, metricsRes, alertsRes, commissionsRes] = await Promise.all([
      supabase.from('partners').select('*').order('created_at', { ascending: false }),
      supabase.from('partner_clinic_relations').select('*'),
      supabase.from('partner_metrics_daily').select('*').order('metric_date', { ascending: false }).limit(200),
      supabase.from('partner_alerts').select('*').is('resolved_at', null).order('alert_date', { ascending: false }).limit(10),
      supabase.from('partner_commissions').select('*').order('created_at', { ascending: false }).limit(50),
    ]);
    setPartners(partnersRes.data || []);
    setClinics(clinicsRes.data || []);
    setMetrics(metricsRes.data || []);
    setAlerts(alertsRes.data || []);
    setCommissions(commissionsRes.data || []);
    setLoading(false);
  };

  const totalPartners = partners.length;
  const activePartners = partners.filter(p => p.status === 'ACTIVE').length;
  const totalClinics = clinics.length;
  const activeClinics = clinics.filter(c => c.is_active).length;
  const totalBonificacoes = commissions.reduce((sum, c) => sum + Number(c.commission_amount || 0), 0);
  const pendingAlerts = alerts.length;
  const avgSeh = partners.length > 0 
    ? (partners.reduce((sum, p) => sum + Number(p.seh_score || 0), 0) / partners.length).toFixed(1) 
    : '0';


  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Help Ude Partners</h1>
            <p className="text-muted-foreground">Gestão de parceiros e performance</p>
          </div>
          <Button onClick={fetchData} variant="outline" size="sm">Atualizar dados</Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card><CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><Users className="h-5 w-5 text-primary" /></div>
              <div><p className="text-sm text-muted-foreground">Partners</p><p className="text-2xl font-bold">{totalPartners}</p><p className="text-xs text-muted-foreground">{activePartners} ativos</p></div>
            </div>
          </CardContent></Card>
          <Card><CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10"><Building2 className="h-5 w-5 text-green-500" /></div>
              <div><p className="text-sm text-muted-foreground">Clínicas</p><p className="text-2xl font-bold">{totalClinics}</p><p className="text-xs text-muted-foreground">{activeClinics} ativas</p></div>
            </div>
          </CardContent></Card>
          <Card><CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10"><Target className="h-5 w-5 text-blue-500" /></div>
              <div>
                <div className="flex items-center gap-1">
                  <p className="text-sm text-muted-foreground">SEH Médio</p>
                  <Tooltip>
                    <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                     <TooltipContent className="max-w-[280px]">
                       <p className="text-xs font-medium mb-1">Score de Eficiência Help Ude (0-100)</p>
                       <p className="text-xs">Métrica composta que avalia a performance do partner:</p>
                       <ul className="text-xs mt-1 space-y-0.5">
                         <li>• <strong>Volume (50%)</strong>: simulações realizadas vs meta</li>
                         <li>• <strong>Conversão (50%)</strong>: taxa de aprovação + pagamento</li>
                       </ul>
                     </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-2xl font-bold">{avgSeh}</p><p className="text-xs text-muted-foreground">Score 0-100</p>
              </div>
            </div>
          </CardContent></Card>
          <Card><CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10"><DollarSign className="h-5 w-5 text-yellow-500" /></div>
              <div><p className="text-sm text-muted-foreground">Bonificações</p><p className="text-2xl font-bold">R$ {totalBonificacoes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p><p className="text-xs text-muted-foreground">Acumulado</p></div>
            </div>
          </CardContent></Card>
          <Card><CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10"><AlertTriangle className="h-5 w-5 text-red-500" /></div>
              <div><p className="text-sm text-muted-foreground">Alertas</p><p className="text-2xl font-bold">{pendingAlerts}</p><p className="text-xs text-muted-foreground">Pendentes</p></div>
            </div>
          </CardContent></Card>
        </div>

        {/* Distribution by Type */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Distribuição por Tipo</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-purple-500/10">
                <span className="text-sm">Master Partners</span>
                <span className="text-lg font-bold text-purple-600">{partners.filter(p => p.type === 'MASTER').length}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10">
                <span className="text-sm">Partners</span>
                <span className="text-lg font-bold">{partners.filter(p => p.type === 'PARTNER').length}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
                <span className="text-sm">Clínicas Qualificadas</span>
                <span className="text-lg font-bold text-green-600">{clinics.filter(c => c.is_qualified).length}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Clínicas Inativas</span>
                <span className="text-lg font-bold text-muted-foreground">{clinics.filter(c => !c.is_active).length}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 p-2 bg-purple-50 rounded border border-purple-200">
              💡 Para se tornar <strong>Master Partner</strong>, a rede do partner precisa atingir <strong>R$ 30.000,00</strong> em créditos pagos para procedimentos.
            </p>
          </CardContent>
        </Card>

        <PartnerCharts metrics={metrics} commissions={commissions} />

        <Tabs defaultValue="partners" className="space-y-4">
          <TabsList>
            <TabsTrigger value="partners">Partners</TabsTrigger>
            <TabsTrigger value="alerts">Alertas ({pendingAlerts})</TabsTrigger>
          </TabsList>

          <TabsContent value="partners">
            <Card>
              <CardHeader><CardTitle className="text-lg">Lista de Partners</CardTitle></CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" /></div>
                ) : partners.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground"><Users className="h-12 w-12 mx-auto mb-4 opacity-30" /><p>Nenhum partner cadastrado</p></div>
                ) : (
                  <div className="space-y-3">
                    {partners.map(partner => {
                      const pClinics = clinics.filter(c => c.partner_id === partner.id);
                      const active = pClinics.filter(c => c.is_active).length;
                      return (
                        <div key={partner.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10"><Users className="h-5 w-5 text-primary" /></div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{partner.legal_name}</p>
                                <Badge variant="outline" className={`text-xs ${partner.type === 'MASTER' ? 'border-purple-500 text-purple-700' : ''}`}>{partner.type === 'MASTER' ? 'Master' : 'Partner'}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{partner.email} · {active} clínicas ativas</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={typeColors[partner.type] || 'bg-muted'}>{partner.type === 'MASTER' ? 'Master Partner' : 'Partner'}</Badge>
                            <div className="text-right">
                              <p className="text-sm font-medium">SEH: {Number(partner.seh_score || 0).toFixed(1)}</p>
                              <Badge variant={partner.status === 'ACTIVE' ? 'default' : partner.status === 'SUSPENDED' ? 'destructive' : 'secondary'}>
                                {partner.status === 'ACTIVE' ? 'Ativo' : partner.status === 'PENDING' ? 'Pendente' : 'Suspenso'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts">
            <Card>
              <CardHeader><CardTitle className="text-lg">Alertas Pendentes</CardTitle></CardHeader>
              <CardContent>
                {alerts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground"><Activity className="h-12 w-12 mx-auto mb-4 opacity-30" /><p>Nenhum alerta pendente</p></div>
                ) : (
                  <div className="space-y-3">
                    {alerts.map(alert => (
                      <div key={alert.id} className="flex items-start gap-3 p-4 rounded-lg border">
                        <AlertTriangle className={`h-5 w-5 mt-0.5 ${alert.severity === 'CRITICAL' ? 'text-red-500' : alert.severity === 'HIGH' ? 'text-orange-500' : 'text-yellow-500'}`} />
                        <div>
                          <p className="font-medium">{alert.title}</p>
                          <p className="text-sm text-muted-foreground">{alert.description}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline">{alert.alert_type}</Badge>
                            <Badge variant="outline">{alert.severity}</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default PartnersDashboard;
