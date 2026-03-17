import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, Gift, Calendar as CalendarIcon, Filter, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const statusLabels: Record<string, string> = {
  CALCULATED: 'Calculado',
  READY_FOR_PAYOUT: 'Pronto p/ Pagamento',
  PAID: 'Pago',
  CANCELLED: 'Cancelado',
};

const statusColors: Record<string, string> = {
  CALCULATED: 'bg-blue-100 text-blue-800',
  READY_FOR_PAYOUT: 'bg-orange-100 text-orange-800',
  PAID: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const mimoTiers = [
  { min: 0, max: 30, label: '0–30 simulações', mimo: 'Mimo Tipo 1' },
  { min: 31, max: 60, label: '31–60 simulações', mimo: 'Mimo Tipo 2' },
  { min: 61, max: 100, label: '61–100 simulações', mimo: 'Mimo Tipo 3' },
  { min: 101, max: Infinity, label: '101+ simulações', mimo: 'Mimo Tipo 4' },
];

const pixTiers = [
  { min: 5000, max: 10000, label: 'R$ 5.000 – R$ 10.000', pix: 'Valor PIX X' },
  { min: 10001, max: 30000, label: 'R$ 10.001 – R$ 30.000', pix: 'Valor PIX XX' },
  { min: 30001, max: 60000, label: 'R$ 30.001 – R$ 60.000', pix: 'Valor PIX XXX' },
  { min: 60001, max: 120000, label: 'R$ 60.001 – R$ 120.000', pix: 'Valor PIX YYY' },
  { min: 121000, max: 240000, label: 'R$ 121.000 – R$ 240.000', pix: 'Valor PIX YYYY' },
  { min: 240001, max: Infinity, label: 'Acima de R$ 240.000', pix: 'Valor PIX HHH' },
];

const PartnersBonificacoes = () => {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [incentives, setIncentives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [filterClinic, setFilterClinic] = useState('ALL');
  const [filterAttendant, setFilterAttendant] = useState('ALL');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [comRes, incRes] = await Promise.all([
      supabase.from('partner_commissions').select('*').order('created_at', { ascending: false }),
      supabase.from('attendant_incentives').select('*').order('created_at', { ascending: false }),
    ]);
    setCommissions(comRes.data || []);
    setIncentives(incRes.data || []);
    setLoading(false);
  };

  const clinicIds = [...new Set(incentives.map(i => i.clinic_external_id).filter(Boolean))];
  const mimoIncentives = incentives.filter(i => i.incentive_type === 'MIMO_SEMANAL');
  const pixIncentives = incentives.filter(i => i.incentive_type === 'PIX_MENSAL');

  const totalDirect = commissions.filter(c => c.commission_type === 'DIRECT').reduce((s, c) => s + Number(c.commission_amount), 0);
  const totalOverride = commissions.filter(c => c.commission_type === 'OVERRIDE').reduce((s, c) => s + Number(c.commission_amount), 0);
  const totalPix = pixIncentives.reduce((s, i) => s + Number(i.incentive_amount || 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bonificações e Incentivos</h1>
          <p className="text-muted-foreground">Gestão de bonificações de partners e incentivos de atendentes Help Ude</p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtros</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Data início"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} className={cn("p-3 pointer-events-auto")} locale={ptBR} />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "dd/MM/yyyy") : "Data fim"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} className={cn("p-3 pointer-events-auto")} locale={ptBR} />
                </PopoverContent>
              </Popover>
              <Select value={filterClinic} onValueChange={setFilterClinic}>
                <SelectTrigger><SelectValue placeholder="Clínica" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas as Clínicas</SelectItem>
                  {clinicIds.map(id => <SelectItem key={id} value={id!}>{id}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterAttendant} onValueChange={setFilterAttendant}>
                <SelectTrigger><SelectValue placeholder="Atendente" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas as Atendentes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10"><DollarSign className="h-5 w-5 text-green-500" /></div>
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
                <div className="p-2 rounded-lg bg-blue-500/10"><DollarSign className="h-5 w-5 text-blue-500" /></div>
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
                <div className="p-2 rounded-lg bg-purple-500/10"><Gift className="h-5 w-5 text-purple-500" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">PIX Atendentes (Help Ude)</p>
                  <p className="text-xl font-bold">R$ {totalPix.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tiers info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Gift className="h-4 w-4 text-primary" /> Mimos por Volume de Simulações
              </CardTitle>
              <CardDescription className="text-xs">
                📅 <strong>Regra semanal</strong> · 💰 <strong>Pago pelo Partner</strong>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mimoTiers.map((tier, i) => (
                  <div key={i} className="flex justify-between items-center p-2.5 rounded bg-muted/50 text-sm">
                    <span>{tier.label}</span>
                    <Badge variant="outline" className="font-medium">{tier.mimo}</Badge>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3 p-2 bg-amber-50 rounded border border-amber-200">
                ⚠️ Mimos não são valores em dinheiro. São premiações (brindes, vouchers, etc.) definidas pelo partner responsável. A regra é avaliada semanalmente.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-500" /> PIX por Contrato Pago
              </CardTitle>
              <CardDescription className="text-xs">
                📅 <strong>Regra mensal</strong> · 💰 <strong>Pago pela Help Ude</strong>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pixTiers.map((tier, i) => (
                  <div key={i} className="flex justify-between items-center p-2.5 rounded bg-muted/50 text-sm">
                    <span>{tier.label}</span>
                    <Badge variant="outline" className="font-medium">{tier.pix}</Badge>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3 p-2 bg-green-50 rounded border border-green-200">
                💡 Valor fixo em PIX baseado na faixa de produção mensal de contratos pagos. Pago exclusivamente pela Help Ude ao atendente.
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="mimos">
          <TabsList>
            <TabsTrigger value="mimos">🎁 Mimos por Simulação (Semanal)</TabsTrigger>
            <TabsTrigger value="pix">💰 PIX por Contrato Pago (Mensal)</TabsTrigger>
            <TabsTrigger value="bonificacoes">📊 Bonificações Partner</TabsTrigger>
          </TabsList>

          <TabsContent value="mimos">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Mimos Semanais por Simulação</CardTitle>
                    <CardDescription>Pago pelo partner · Avaliação semanal</CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs">🕐 Semanal</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" /></div>
                ) : mimoIncentives.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Gift className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>Nenhum mimo registrado</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b text-left">
                        <th className="pb-3">Mês Ref.</th>
                        <th className="pb-3">Semana</th>
                        <th className="pb-3">Clínica</th>
                        <th className="pb-3">Simulações</th>
                        <th className="pb-3">Produção</th>
                        <th className="pb-3">Faixa Mimo</th>
                        <th className="pb-3">Status</th>
                      </tr></thead>
                      <tbody>
                        {mimoIncentives.map(i => (
                          <tr key={i.id} className="border-b">
                            <td className="py-3">{i.reference_month}</td>
                            <td className="py-3">Semana {i.reference_week}</td>
                            <td className="py-3 text-xs">{i.clinic_external_id || '—'}</td>
                            <td className="py-3 font-medium">{i.cpfs_generated}</td>
                            <td className="py-3">{i.consultations_generated} consultas</td>
                            <td className="py-3"><Badge variant="secondary" className="font-medium">{i.pix_tier || '—'}</Badge></td>
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

          <TabsContent value="pix">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">PIX por Contrato Pago</CardTitle>
                    <CardDescription>Pago pela Help Ude · Avaliação mensal</CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs">📅 Mensal</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {pixIncentives.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>Nenhum incentivo PIX registrado</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b text-left">
                        <th className="pb-3">Mês Ref.</th>
                        <th className="pb-3">Clínica</th>
                        <th className="pb-3">Produção Paga</th>
                        <th className="pb-3">Faixa</th>
                        <th className="pb-3">Valor PIX</th>
                        <th className="pb-3">Status</th>
                      </tr></thead>
                      <tbody>
                        {pixIncentives.map(i => (
                          <tr key={i.id} className="border-b">
                            <td className="py-3">{i.reference_month}</td>
                            <td className="py-3 text-xs">{i.clinic_external_id || '—'}</td>
                            <td className="py-3">R$ {Number(i.paid_amount_generated || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            <td className="py-3"><Badge variant="secondary">{i.pix_tier || '—'}</Badge></td>
                            <td className="py-3 font-bold text-green-600">R$ {Number(i.incentive_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
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

          <TabsContent value="bonificacoes">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Bonificações do Partner</CardTitle>
                <CardDescription>Bonificação direta (1,6%) e de rede/override (0,2%)</CardDescription>
              </CardHeader>
              <CardContent>
                {commissions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>Nenhuma bonificação registrada</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b text-left">
                        <th className="pb-3">Tipo</th>
                        <th className="pb-3">Mês Ref.</th>
                        <th className="pb-3">Valor Base</th>
                        <th className="pb-3">Taxa</th>
                        <th className="pb-3">Bonificação</th>
                        <th className="pb-3">Status</th>
                      </tr></thead>
                      <tbody>
                        {commissions.map(c => (
                          <tr key={c.id} className="border-b">
                            <td className="py-3"><Badge variant="outline">{c.commission_type === 'DIRECT' ? 'Direta' : 'Rede'}</Badge></td>
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
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default PartnersBonificacoes;
