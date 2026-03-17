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
  Star, Target, ArrowUpRight, ArrowDownRight, Activity
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import PartnerCharts from '@/components/partners/PartnerCharts';
import { usePartnerAlertRealtime } from '@/hooks/usePartnerAlertRealtime';

const levelColors: Record<string, string> = {
  BRONZE: 'bg-amber-700 text-white',
  PRATA: 'bg-gray-400 text-white',
  OURO: 'bg-yellow-500 text-white',
  ELITE: 'bg-purple-600 text-white',
};

const PartnersDashboard = () => {
  const { user } = useAuth();
  usePartnerAlertRealtime();
  const [partners, setPartners] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [partnersRes, metricsRes, alertsRes, commissionsRes] = await Promise.all([
        supabase.from('partners').select('*').order('created_at', { ascending: false }),
        supabase.from('partner_metrics_daily').select('*').order('metric_date', { ascending: false }).limit(30),
        supabase.from('partner_alerts').select('*').is('resolved_at', null).order('alert_date', { ascending: false }).limit(10),
        supabase.from('partner_commissions').select('*').order('created_at', { ascending: false }).limit(20),
      ]);
      
      setPartners(partnersRes.data || []);
      setMetrics(metricsRes.data || []);
      setAlerts(alertsRes.data || []);
      setCommissions(commissionsRes.data || []);
    } catch (error) {
      console.error('Error fetching partner data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPartners = partners.length;
  const activePartners = partners.filter(p => p.status === 'ACTIVE').length;
  const totalCommissions = commissions.reduce((sum, c) => sum + Number(c.commission_amount || 0), 0);
  const pendingAlerts = alerts.length;

  const avgSeh = partners.length > 0 
    ? (partners.reduce((sum, p) => sum + Number(p.seh_score || 0), 0) / partners.length).toFixed(1) 
    : '0';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">HelpU Partners</h1>
            <p className="text-muted-foreground">Gestão de parceiros e performance</p>
          </div>
          <Button onClick={fetchData} variant="outline" size="sm">
            Atualizar dados
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
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
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Building2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Clínicas</p>
                  <p className="text-2xl font-bold">—</p>
                  <p className="text-xs text-muted-foreground">Vinculadas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Target className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">SEH Médio</p>
                  <p className="text-2xl font-bold">{avgSeh}</p>
                  <p className="text-xs text-muted-foreground">Score 0-100</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <DollarSign className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Comissões</p>
                  <p className="text-2xl font-bold">R$ {totalCommissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <p className="text-xs text-muted-foreground">Acumulado</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Alertas</p>
                  <p className="text-2xl font-bold">{pendingAlerts}</p>
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="partners" className="space-y-4">
          <TabsList>
            <TabsTrigger value="partners">Partners</TabsTrigger>
            <TabsTrigger value="alerts">Alertas</TabsTrigger>
            <TabsTrigger value="commissions">Comissões</TabsTrigger>
          </TabsList>

          <TabsContent value="partners">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Lista de Partners</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
                  </div>
                ) : partners.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">Nenhum partner cadastrado</p>
                    <p className="text-sm">Os partners aparecerão aqui após o cadastro.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {partners.map(partner => (
                      <div key={partner.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{partner.legal_name}</p>
                            <p className="text-sm text-muted-foreground">{partner.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={levelColors[partner.current_level] || 'bg-muted'}>
                            {partner.current_level}
                          </Badge>
                          <div className="text-right">
                            <p className="text-sm font-medium">SEH: {Number(partner.seh_score || 0).toFixed(1)}</p>
                            <Badge variant={partner.status === 'ACTIVE' ? 'default' : 'secondary'}>
                              {partner.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Alertas Pendentes</CardTitle>
              </CardHeader>
              <CardContent>
                {alerts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">Nenhum alerta pendente</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alerts.map(alert => (
                      <div key={alert.id} className="flex items-start gap-3 p-4 rounded-lg border">
                        <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                          alert.severity === 'CRITICAL' ? 'text-red-500' :
                          alert.severity === 'HIGH' ? 'text-orange-500' :
                          'text-yellow-500'
                        }`} />
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

          <TabsContent value="commissions">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Comissões</CardTitle>
              </CardHeader>
              <CardContent>
                {commissions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">Nenhuma comissão registrada</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {commissions.map(c => (
                      <div key={c.id} className="flex items-center justify-between p-4 rounded-lg border">
                        <div>
                          <p className="font-medium">{c.commission_type}</p>
                          <p className="text-sm text-muted-foreground">Ref: {c.reference_month}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            R$ {Number(c.commission_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <Badge variant={c.status === 'PAID' ? 'default' : 'secondary'}>
                            {c.status}
                          </Badge>
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
