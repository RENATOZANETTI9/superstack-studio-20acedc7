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
import { Progress } from '@/components/ui/progress';
import PartnerCharts from '@/components/partners/PartnerCharts';
import { usePartnerAlertRealtime } from '@/hooks/usePartnerAlertRealtime';

const levelColors: Record<string, string> = {
  BRONZE: 'bg-amber-700 text-white',
  PRATA: 'bg-gray-400 text-white',
  OURO: 'bg-yellow-500 text-white',
  ELITE: 'bg-purple-600 text-white',
};

const levelRanges = [
  { level: 'ELITE', min: 85, max: 100, color: 'bg-purple-600', desc: 'Acesso total, taxa máxima, mentoria exclusiva' },
  { level: 'OURO', min: 70, max: 84.9, color: 'bg-yellow-500', desc: 'Dashboard premium, taxa preferencial' },
  { level: 'PRATA', min: 50, max: 69.9, color: 'bg-gray-400', desc: 'Relatórios avançados, prioridade no suporte' },
  { level: 'BRONZE', min: 0, max: 49.9, color: 'bg-amber-700', desc: 'Acesso básico, link de cadastro de clínicas' },
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

  // Level distribution
  const levelDist = { ELITE: 0, OURO: 0, PRATA: 0, BRONZE: 0 };
  partners.forEach(p => { if (levelDist[p.current_level as keyof typeof levelDist] !== undefined) levelDist[p.current_level as keyof typeof levelDist]++; });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">HelpU Partners</h1>
            <p className="text-muted-foreground">Gestão de parceiros e performance</p>
          </div>
          <Button onClick={fetchData} variant="outline" size="sm">Atualizar dados</Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10"><Users className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Partners</p>
                  <p className="text-2xl font-bold">{totalPartners}</p>
                  <p className="text-xs text-muted-foreground">{activePartners} ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10"><Building2 className="h-5 w-5 text-green-500" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Clínicas</p>
                  <p className="text-2xl font-bold">{totalClinics}</p>
                  <p className="text-xs text-muted-foreground">{activeClinics} ativas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10"><Target className="h-5 w-5 text-blue-500" /></div>
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-sm text-muted-foreground">SEH Médio</p>
                    <Tooltip>
                      <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent className="max-w-[280px]">
                        <p className="text-xs font-medium mb-1">Score de Eficiência HelpU (0-100)</p>
                        <p className="text-xs">Métrica composta que avalia a performance do partner em 3 pilares:</p>
                        <ul className="text-xs mt-1 space-y-0.5">
                          <li>• <strong>Ativação (30%)</strong>: % de clínicas ativas</li>
                          <li>• <strong>Volume (35%)</strong>: consultas por mês</li>
                          <li>• <strong>Conversão (35%)</strong>: taxa de aprovação + pagamento</li>
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-2xl font-bold">{avgSeh}</p>
                  <p className="text-xs text-muted-foreground">Score 0-100</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10"><DollarSign className="h-5 w-5 text-yellow-500" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Bonificações</p>
                  <p className="text-2xl font-bold">R$ {totalBonificacoes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <p className="text-xs text-muted-foreground">Acumulado</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10"><AlertTriangle className="h-5 w-5 text-red-500" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Alertas</p>
                  <p className="text-2xl font-bold">{pendingAlerts}</p>
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SEH Level Guide + Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" /> Níveis de Partner (SEH)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {levelRanges.map(lr => (
                <div key={lr.level} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  <Badge className={`${lr.color} text-white min-w-[70px] justify-center`}>{lr.level}</Badge>
                  <div className="flex-1">
                    <p className="text-sm font-medium">SEH {lr.min}–{lr.max}</p>
                    <p className="text-xs text-muted-foreground">{lr.desc}</p>
                  </div>
                  <span className="text-lg font-bold">{levelDist[lr.level as keyof typeof levelDist]}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Distribuição por Tipo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Master Partners</span>
                <span className="text-lg font-bold">{partners.filter(p => p.type === 'MASTER').length}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
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
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <PartnerCharts metrics={metrics} commissions={commissions} />

        {/* Tabs */}
        <Tabs defaultValue="partners" className="space-y-4">
          <TabsList>
            <TabsTrigger value="partners">Partners</TabsTrigger>
            <TabsTrigger value="alerts">Alertas ({pendingAlerts})</TabsTrigger>
            <TabsTrigger value="bonificacoes">Bonificações</TabsTrigger>
          </TabsList>

          <TabsContent value="partners">
            <Card>
              <CardHeader><CardTitle className="text-lg">Lista de Partners</CardTitle></CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" /></div>
                ) : partners.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>Nenhum partner cadastrado</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {partners.map(partner => {
                      const pClinics = clinics.filter(c => c.partner_id === partner.id);
                      const active = pClinics.filter(c => c.is_active).length;
                      return (
                        <div key={partner.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                              <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{partner.legal_name}</p>
                                <Badge variant="outline" className="text-xs">{partner.type === 'MASTER' ? 'Master' : 'Partner'}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{partner.email} · {active} clínicas ativas</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={levelColors[partner.current_level] || 'bg-muted'}>{partner.current_level}</Badge>
                            <div className="text-right">
                              <p className="text-sm font-medium">SEH: {Number(partner.seh_score || 0).toFixed(1)}</p>
                              <Badge variant={partner.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                {partner.status === 'ACTIVE' ? 'Ativo' : partner.status}
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
                  <div className="text-center py-12 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>Nenhum alerta pendente</p>
                  </div>
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

          <TabsContent value="bonificacoes">
            <Card>
              <CardHeader><CardTitle className="text-lg">Bonificações Recentes</CardTitle></CardHeader>
              <CardContent>
                {commissions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>Nenhuma bonificação registrada</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {commissions.slice(0, 10).map(c => (
                      <div key={c.id} className="flex items-center justify-between p-4 rounded-lg border">
                        <div>
                          <p className="font-medium">{c.commission_type === 'DIRECT' ? 'Direta' : c.commission_type === 'OVERRIDE' ? 'Rede (Override)' : c.commission_type}</p>
                          <p className="text-sm text-muted-foreground">Ref: {c.reference_month}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">R$ {Number(c.commission_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          <Badge variant={c.status === 'PAID' ? 'default' : 'secondary'}>{c.status === 'PAID' ? 'Pago' : c.status === 'APPROVED' ? 'Aprovado' : 'Calculado'}</Badge>
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
