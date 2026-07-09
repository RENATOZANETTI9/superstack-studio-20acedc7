import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessMonitoring } from '@/lib/partner-rules';
import { logCommissionStatusChange } from '@/lib/commission-audit';
import {
  Activity, AlertTriangle, CheckCircle, Clock, Download,
  RefreshCw, Shield, TrendingUp, XCircle
} from 'lucide-react';

type MonPeriod = '7d' | '30d' | '90d' | 'all';
const MON_PERIOD_DAYS: Record<Exclude<MonPeriod, 'all'>, number> = { '7d': 7, '30d': 30, '90d': 90 };

const PartnersMonitoring = () => {
  const navigate = useNavigate();
  const { user, role, isLoading: authLoading } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [configHistory, setConfigHistory] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [period, setPeriod] = useState<MonPeriod>('30d');

  // Redirect non-admin users
  useEffect(() => {
    if (!authLoading && role && !canAccessMonitoring(role as any)) {
      navigate('/dashboard/partners');
    }
  }, [role, authLoading, navigate]);

  useEffect(() => { fetchData(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [period]);

  const fetchData = async () => {
    setLoading(true);
    setLoadError(null);
    let fromISO: string | null = null;
    if (period !== 'all') {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (MON_PERIOD_DAYS[period] - 1));
      fromISO = d.toISOString();
    }
    let alertsQ = supabase.from('partner_alerts')
      .select('id, partner_id, alert_type, severity, title, description, alert_date, resolved_at, resolved_by')
      .order('alert_date', { ascending: false }).limit(200);
    let historyQ = supabase.from('partner_config_history')
      .select('id, config_key, old_value, new_value, changed_by, created_at')
      .order('created_at', { ascending: false }).limit(200);
    let commsQ = supabase.from('partner_commissions')
      .select('id, commission_type, reference_month, net_paid_amount, commission_rate, commission_amount, status, created_at')
      .order('created_at', { ascending: false }).limit(500);
    if (fromISO) {
      alertsQ = alertsQ.gte('alert_date', fromISO);
      historyQ = historyQ.gte('created_at', fromISO);
      commsQ = commsQ.gte('created_at', fromISO);
    }
    const [alertsRes, historyRes, commsRes] = await Promise.all([alertsQ, historyQ, commsQ]);
    const firstErr = alertsRes.error || historyRes.error || commsRes.error;
    if (firstErr) setLoadError(firstErr.message);
    setAlerts(alertsRes.data || []);
    setConfigHistory(historyRes.data || []);
    setCommissions(commsRes.data || []);
    setLoading(false);
  };

  // Don't render if not authorized
  if (!authLoading && role && !canAccessMonitoring(role as any)) return null;

  const unresolvedAlerts = alerts.filter(a => !a.resolved_at).length;
  const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL' && !a.resolved_at).length;
  const paidCommissions = commissions.filter(c => c.status === 'PAID').length;
  const pendingCommissions = commissions.filter(c => c.status === 'CALCULATED' || c.status === 'APPROVED').length;

  const resolveAlert = async (alertId: string) => {
    await supabase.from('partner_alerts').update({
      resolved_at: new Date().toISOString(),
      resolved_by: user?.id,
      action_taken: 'Resolvido manualmente pelo administrador',
    }).eq('id', alertId);
    fetchData();
  };

  const exportCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csv = [headers.join(','), ...data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const severityColor = (s: string) => {
    if (s === 'CRITICAL') return 'bg-red-100 text-red-800';
    if (s === 'HIGH') return 'bg-orange-100 text-orange-800';
    if (s === 'MEDIUM') return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {loadError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 flex items-center justify-between gap-3">
            <span>Erro ao carregar dados: {loadError}</span>
            <Button size="sm" variant="outline" onClick={fetchData}>Tentar novamente</Button>
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Monitoramento & Auditoria</h1>
            <p className="text-muted-foreground">Saúde operacional, alertas e logs de auditoria</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={(v) => setPeriod(v as MonPeriod)}>
              <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="90d">Últimos 90 dias</SelectItem>
                <SelectItem value="all">Todo o período</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchData} variant="outline" size="sm"><RefreshCw className="h-4 w-4 mr-2" /> Atualizar</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card><CardContent className="pt-6 text-center">
            <AlertTriangle className={`h-8 w-8 mx-auto mb-2 ${criticalAlerts > 0 ? 'text-red-500' : 'text-green-500'}`} />
            <p className="text-2xl font-bold">{criticalAlerts}</p><p className="text-xs text-muted-foreground">Alertas Críticos</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6 text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <p className="text-2xl font-bold">{unresolvedAlerts}</p><p className="text-xs text-muted-foreground">Alertas Pendentes</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6 text-center">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{paidCommissions}</p><p className="text-xs text-muted-foreground">Bonificações Pagas</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6 text-center">
            <Activity className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">{pendingCommissions}</p><p className="text-xs text-muted-foreground">Bonificações Pendentes</p>
          </CardContent></Card>
        </div>

        <Tabs defaultValue="alerts">
          <TabsList>
            <TabsTrigger value="alerts">Alertas</TabsTrigger>
            <TabsTrigger value="audit">Auditoria Config</TabsTrigger>
            <TabsTrigger value="financial">Relatório Financeiro</TabsTrigger>
          </TabsList>

          <TabsContent value="alerts">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Todos os Alertas</CardTitle>
                <Button variant="outline" size="sm" onClick={() => exportCSV(alerts, 'alertas')}><Download className="h-4 w-4 mr-1" /> CSV</Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" /></div>
                ) : alerts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground"><Shield className="h-12 w-12 mx-auto mb-4 opacity-30" /><p>Sem dados ainda — nenhum alerta registrado no período</p></div>
                ) : (
                  <div className="space-y-3">
                    {alerts.map(alert => (
                      <div key={alert.id} className="flex items-start justify-between p-4 rounded-lg border">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className={`h-5 w-5 mt-0.5 ${alert.severity === 'CRITICAL' ? 'text-red-500' : alert.severity === 'HIGH' ? 'text-orange-500' : 'text-yellow-500'}`} />
                          <div>
                            <p className="font-medium">{alert.title}</p>
                            <p className="text-sm text-muted-foreground">{alert.description}</p>
                            <div className="flex gap-2 mt-2">
                              <Badge className={severityColor(alert.severity)}>{alert.severity}</Badge>
                              <Badge variant="outline">{alert.alert_type}</Badge>
                              <span className="text-xs text-muted-foreground">{new Date(alert.alert_date).toLocaleDateString('pt-BR')}</span>
                            </div>
                          </div>
                        </div>
                        {!alert.resolved_at ? (
                          <Button size="sm" variant="outline" onClick={() => resolveAlert(alert.id)}><CheckCircle className="h-4 w-4 mr-1" /> Resolver</Button>
                        ) : (
                          <Badge variant="default" className="bg-green-100 text-green-800">Resolvido</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Log de Alterações de Configuração</CardTitle>
                <Button variant="outline" size="sm" onClick={() => exportCSV(configHistory, 'auditoria_config')}><Download className="h-4 w-4 mr-1" /> CSV</Button>
              </CardHeader>
              <CardContent>
                {configHistory.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground"><Shield className="h-12 w-12 mx-auto mb-4 opacity-30" /><p>Sem dados ainda — nenhuma alteração de configuração registrada</p></div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b text-left"><th className="pb-3">Data</th><th className="pb-3">Chave Config</th><th className="pb-3">Valor Antigo</th><th className="pb-3">Valor Novo</th></tr></thead>
                      <tbody>
                        {configHistory.map(h => (
                          <tr key={h.id} className="border-b">
                            <td className="py-3 text-muted-foreground">{new Date(h.created_at).toLocaleString('pt-BR')}</td>
                            <td className="py-3 font-medium">{h.config_key}</td>
                            <td className="py-3"><pre className="text-xs bg-muted p-1 rounded max-w-[200px] overflow-hidden">{JSON.stringify(h.old_value)}</pre></td>
                            <td className="py-3"><pre className="text-xs bg-muted p-1 rounded max-w-[200px] overflow-hidden">{JSON.stringify(h.new_value)}</pre></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Relatório de Bonificações</CardTitle>
                <Button variant="outline" size="sm" onClick={() => exportCSV(commissions, 'bonificacoes')}><Download className="h-4 w-4 mr-1" /> CSV</Button>
              </CardHeader>
              <CardContent>
                {commissions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground"><TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-30" /><p>Sem dados ainda — nenhuma bonificação calculada ainda</p></div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b text-left">
                        <th className="pb-3">Tipo</th><th className="pb-3">Mês Ref.</th><th className="pb-3">Valor Base</th><th className="pb-3">Taxa</th><th className="pb-3">Bonificação</th><th className="pb-3">Status</th><th className="pb-3">Ações</th>
                      </tr></thead>
                      <tbody>
                        {commissions.map(c => (
                          <tr key={c.id} className="border-b">
                            <td className="py-3"><Badge variant="outline">{c.commission_type === 'DIRECT' ? 'Direta' : 'Rede'}</Badge></td>
                            <td className="py-3">{c.reference_month}</td>
                            <td className="py-3">R$ {Number(c.net_paid_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            <td className="py-3">{(Number(c.commission_rate) * 100).toFixed(2)}%</td>
                            <td className="py-3 font-bold text-green-600">R$ {Number(c.commission_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            <td className="py-3"><Badge className={c.status === 'PAID' ? 'bg-green-100 text-green-800' : c.status === 'APPROVED' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}>{c.status === 'PAID' ? 'Pago' : c.status === 'APPROVED' ? 'Aprovado' : 'Calculado'}</Badge></td>
                            <td className="py-3">
                              {c.status === 'CALCULATED' && <Button size="sm" variant="outline" onClick={async () => {
                                const { error } = await supabase.from('partner_commissions').update({ status: 'APPROVED', approved_at: new Date().toISOString() }).eq('id', c.id);
                                if (!error) await logCommissionStatusChange({ commissionId: c.id, oldStatus: c.status, newStatus: 'APPROVED' });
                                fetchData();
                              }}>Aprovar</Button>}
                              {c.status === 'APPROVED' && <Button size="sm" variant="default" onClick={async () => {
                                const { error } = await supabase.from('partner_commissions').update({ status: 'PAID', paid_at: new Date().toISOString() }).eq('id', c.id);
                                if (!error) await logCommissionStatusChange({ commissionId: c.id, oldStatus: c.status, newStatus: 'PAID' });
                                fetchData();
                              }}>Pagar</Button>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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

export default PartnersMonitoring;
