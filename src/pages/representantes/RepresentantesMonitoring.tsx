import { useState, useEffect } from 'react';
import { MOCK_ALERTS, MOCK_COMMISSIONS, MOCK_CONFIG_HISTORY, withMockFallback } from '@/lib/mock-data';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessMonitoring } from '@/lib/partner-rules';
import {
  Activity, AlertTriangle, CheckCircle, Clock, Download,
  RefreshCw, Shield, TrendingUp, XCircle
} from 'lucide-react';

const PartnersMonitoring = () => {
  const navigate = useNavigate();
  const { user, role, isLoading: authLoading } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [configHistory, setConfigHistory] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect non-admin users
  useEffect(() => {
    if (!authLoading && role && !canAccessMonitoring(role as any)) {
      navigate('/dashboard/partners');
    }
  }, [role, authLoading, navigate]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const [alertsRes, historyRes, commsRes] = await Promise.all([
      supabase.from('partner_alerts').select('*').order('alert_date', { ascending: false }).limit(50),
      supabase.from('partner_config_history').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('partner_commissions').select('*').order('created_at', { ascending: false }).limit(100),
    ]);
    setAlerts(withMockFallback(alertsRes.data, MOCK_ALERTS));
    setConfigHistory(withMockFallback(historyRes.data, MOCK_CONFIG_HISTORY));
    setCommissions(withMockFallback(commsRes.data, MOCK_COMMISSIONS));
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Monitoramento & Auditoria</h1>
            <p className="text-muted-foreground">Saúde operacional, alertas e logs de auditoria</p>
          </div>
          <Button onClick={fetchData} variant="outline" size="sm"><RefreshCw className="h-4 w-4 mr-2" /> Atualizar</Button>
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
                  <div className="text-center py-12 text-muted-foreground"><Shield className="h-12 w-12 mx-auto mb-4 opacity-30" /><p>Nenhum alerta registrado</p></div>
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
                  <div className="text-center py-12 text-muted-foreground"><Shield className="h-12 w-12 mx-auto mb-4 opacity-30" /><p>Nenhuma alteração registrada</p></div>
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
                  <div className="text-center py-12 text-muted-foreground"><TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-30" /><p>Nenhuma bonificação registrada</p></div>
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
                              {c.status === 'CALCULATED' && <Button size="sm" variant="outline" onClick={async () => { await supabase.from('partner_commissions').update({ status: 'APPROVED', approved_at: new Date().toISOString() }).eq('id', c.id); fetchData(); }}>Aprovar</Button>}
                              {c.status === 'APPROVED' && <Button size="sm" variant="default" onClick={async () => { await supabase.from('partner_commissions').update({ status: 'PAID', paid_at: new Date().toISOString() }).eq('id', c.id); fetchData(); }}>Pagar</Button>}
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
