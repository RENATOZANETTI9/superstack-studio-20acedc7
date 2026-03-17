import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, Gift, TrendingUp, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const statusLabels: Record<string, string> = {
  CALCULATED: 'Calculado',
  APPROVED: 'Aprovado',
  READY_FOR_PAYOUT: 'Pronto p/ Pagamento',
  PAID: 'Pago',
  CANCELLED: 'Cancelado',
};

const statusColors: Record<string, string> = {
  CALCULATED: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-yellow-100 text-yellow-800',
  READY_FOR_PAYOUT: 'bg-orange-100 text-orange-800',
  PAID: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const PartnersBonificacoes = () => {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [incentives, setIncentives] = useState<any[]>([]);
  const [pixTiers, setPixTiers] = useState<any>(null);
  const [paidTiers, setPaidTiers] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [comRes, incRes, configRes] = await Promise.all([
      supabase.from('partner_commissions').select('*').order('created_at', { ascending: false }),
      supabase.from('attendant_incentives').select('*').order('created_at', { ascending: false }),
      supabase.from('partner_system_config').select('config_key, config_value').in('config_key', ['faixas_incentivo_pix_volume', 'faixas_incentivo_pix_contrato_pago']),
    ]);
    
    setCommissions(comRes.data || []);
    setIncentives(incRes.data || []);
    
    (configRes.data || []).forEach((c: any) => {
      if (c.config_key === 'faixas_incentivo_pix_volume') setPixTiers(c.config_value);
      if (c.config_key === 'faixas_incentivo_pix_contrato_pago') setPaidTiers(c.config_value);
    });
    
    setLoading(false);
  };

  const totalDirect = commissions.filter(c => c.commission_type === 'DIRECT').reduce((s, c) => s + Number(c.commission_amount), 0);
  const totalOverride = commissions.filter(c => c.commission_type === 'OVERRIDE').reduce((s, c) => s + Number(c.commission_amount), 0);
  const totalIncentives = incentives.reduce((s, i) => s + Number(i.incentive_amount || 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bonificações e Incentivos</h1>
          <p className="text-muted-foreground">Gestão financeira de bonificações de partners e incentivos de atendentes</p>
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
                  <div className="flex items-center gap-1">
                    <p className="text-sm text-muted-foreground">Bonificação Direta</p>
                    <Tooltip>
                      <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent><p className="max-w-[200px] text-xs">1,6% sobre valor líquido pago dos contratos das clínicas vinculadas ao partner</p></TooltipContent>
                    </Tooltip>
                  </div>
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
                  <div className="flex items-center gap-1">
                    <p className="text-sm text-muted-foreground">Bonificação de Rede</p>
                    <Tooltip>
                      <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent><p className="max-w-[200px] text-xs">0,2% override sobre contratos pagos dos partners indicados na rede</p></TooltipContent>
                    </Tooltip>
                  </div>
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

        {/* Tiers info */}
        {(pixTiers || paidTiers) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pixTiers && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Faixas PIX por Volume de Simulações</CardTitle>
                  <CardDescription className="text-xs">Pago pelo partner ao atendente</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.values(pixTiers).map((tier: any, i: number) => (
                      <div key={i} className="flex justify-between items-center p-2 rounded bg-muted/50 text-sm">
                        <span>{tier.min_simulacoes}–{tier.max_simulacoes || '∞'} simulações</span>
                        <Badge variant="outline">R$ {tier.valor},00</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            {paidTiers && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Faixas PIX por Contrato Pago</CardTitle>
                  <CardDescription className="text-xs">Pago pela HelpU ao atendente (exclusivo sobre contrato pago)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.values(paidTiers).map((tier: any, i: number) => (
                      <div key={i} className="flex justify-between items-center p-2 rounded bg-muted/50 text-sm">
                        <span>{tier.label}</span>
                        <Badge variant="outline">{(tier.percentual * 100).toFixed(2)}%</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <Tabs defaultValue="bonificacoes">
          <TabsList>
            <TabsTrigger value="bonificacoes">Bonificações Partner</TabsTrigger>
            <TabsTrigger value="incentivos-pix">Incentivos PIX Atendente</TabsTrigger>
          </TabsList>

          <TabsContent value="bonificacoes">
            <Card>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
                  </div>
                ) : commissions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>Nenhuma bonificação registrada</p>
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
                          <th className="pb-3">Bonificação</th>
                          <th className="pb-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {commissions.map(c => (
                          <tr key={c.id} className="border-b">
                            <td className="py-3">
                              <Badge variant="outline">
                                {c.commission_type === 'DIRECT' ? 'Direta' : c.commission_type === 'OVERRIDE' ? 'Rede' : c.commission_type}
                              </Badge>
                            </td>
                            <td className="py-3">{c.reference_month}</td>
                            <td className="py-3">R$ {Number(c.net_paid_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            <td className="py-3">{(Number(c.commission_rate) * 100).toFixed(2)}%</td>
                            <td className="py-3 font-bold text-green-600">R$ {Number(c.commission_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            <td className="py-3"><Badge className={statusColors[c.status] || ''}>{statusLabels[c.status] || c.status}</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="incentivos-pix">
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
                          <th className="pb-3">Origem</th>
                          <th className="pb-3">Mês Ref.</th>
                          <th className="pb-3">Simulações</th>
                          <th className="pb-3">Consultas</th>
                          <th className="pb-3">Incentivo</th>
                          <th className="pb-3">Faixa</th>
                          <th className="pb-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {incentives.map(i => (
                          <tr key={i.id} className="border-b">
                            <td className="py-3">
                              <Badge variant="outline">
                                {i.incentive_type === 'PIX_MENSAL' ? 'PIX Mensal' : 'Mimo Semanal'}
                              </Badge>
                            </td>
                            <td className="py-3 text-xs text-muted-foreground">
                              {i.incentive_type === 'PIX_MENSAL' ? 'Partner (volume)' : 'HelpU (contrato pago)'}
                            </td>
                            <td className="py-3">{i.reference_month}</td>
                            <td className="py-3">{i.cpfs_generated}</td>
                            <td className="py-3">{i.consultations_generated}</td>
                            <td className="py-3 font-bold">R$ {Number(i.incentive_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            <td className="py-3"><Badge variant="secondary">{i.pix_tier || '—'}</Badge></td>
                            <td className="py-3"><Badge className={statusColors[i.status] || ''}>{statusLabels[i.status] || i.status}</Badge></td>
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

export default PartnersBonificacoes;
