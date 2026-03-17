import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, Gift, TrendingUp } from 'lucide-react';

const statusColors: Record<string, string> = {
  CALCULATED: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-yellow-100 text-yellow-800',
  READY_FOR_PAYOUT: 'bg-orange-100 text-orange-800',
  PAID: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const PartnersCommissions = () => {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [incentives, setIncentives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [comRes, incRes] = await Promise.all([
      supabase.from('partner_commissions').select('*').order('created_at', { ascending: false }),
      supabase.from('attendant_incentives').select('*').order('created_at', { ascending: false }),
    ]);
    
    setCommissions(comRes.data || []);
    setIncentives(incRes.data || []);
    setLoading(false);
  };

  const totalDirect = commissions.filter(c => c.commission_type === 'DIRECT').reduce((s, c) => s + Number(c.commission_amount), 0);
  const totalOverride = commissions.filter(c => c.commission_type === 'OVERRIDE').reduce((s, c) => s + Number(c.commission_amount), 0);
  const totalIncentives = incentives.reduce((s, i) => s + Number(i.incentive_amount || 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Comissões e Incentivos</h1>
          <p className="text-muted-foreground">Gestão financeira do módulo Partners</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <DollarSign className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Comissão Direta</p>
                  <p className="text-xl font-bold">R$ {totalDirect.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Override de Rede</p>
                  <p className="text-xl font-bold">R$ {totalOverride.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Gift className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Incentivos Atendentes</p>
                  <p className="text-xl font-bold">R$ {totalIncentives.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="commissions">
          <TabsList>
            <TabsTrigger value="commissions">Comissões</TabsTrigger>
            <TabsTrigger value="incentives">Incentivos Atendentes</TabsTrigger>
          </TabsList>

          <TabsContent value="commissions">
            <Card>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
                  </div>
                ) : commissions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>Nenhuma comissão registrada</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="pb-3">Tipo</th>
                          <th className="pb-3">Mês Ref.</th>
                          <th className="pb-3">Valor Base</th>
                          <th className="pb-3">Taxa</th>
                          <th className="pb-3">Comissão</th>
                          <th className="pb-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {commissions.map(c => (
                          <tr key={c.id} className="border-b">
                            <td className="py-3"><Badge variant="outline">{c.commission_type}</Badge></td>
                            <td className="py-3">{c.reference_month}</td>
                            <td className="py-3">R$ {Number(c.net_paid_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            <td className="py-3">{(Number(c.commission_rate) * 100).toFixed(2)}%</td>
                            <td className="py-3 font-bold text-green-600">R$ {Number(c.commission_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            <td className="py-3"><Badge className={statusColors[c.status] || ''}>{c.status}</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="incentives">
            <Card>
              <CardContent className="pt-6">
                {incentives.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Gift className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>Nenhum incentivo registrado</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="pb-3">Tipo</th>
                          <th className="pb-3">Mês Ref.</th>
                          <th className="pb-3">CPFs</th>
                          <th className="pb-3">Consultas</th>
                          <th className="pb-3">Incentivo</th>
                          <th className="pb-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {incentives.map(i => (
                          <tr key={i.id} className="border-b">
                            <td className="py-3"><Badge variant="outline">{i.incentive_type}</Badge></td>
                            <td className="py-3">{i.reference_month}</td>
                            <td className="py-3">{i.cpfs_generated}</td>
                            <td className="py-3">{i.consultations_generated}</td>
                            <td className="py-3 font-bold">R$ {Number(i.incentive_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            <td className="py-3"><Badge className={statusColors[i.status] || ''}>{i.status}</Badge></td>
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

export default PartnersCommissions;
