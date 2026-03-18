import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, Gift } from 'lucide-react';
import { COMMISSION_STATUS_LABELS, COMMISSION_STATUS_COLORS, formatCurrency } from '@/lib/partner-rules';
import BonificacaoFilters from '@/components/partners/BonificacaoFilters';
import BonificacaoSummaryCards from '@/components/partners/BonificacaoSummaryCards';
import BonificacaoTiersInfo from '@/components/partners/BonificacaoTiersInfo';

const PartnersBonificacoes = () => {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [incentives, setIncentives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [filterClinic, setFilterClinic] = useState('ALL');
  const [filterAttendant, setFilterAttendant] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

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

  const clinicIds = useMemo(() => [...new Set([
    ...incentives.map(i => i.clinic_external_id),
    ...commissions.map(c => c.clinic_external_id),
  ].filter(Boolean) as string[])], [incentives, commissions]);

  const attendantIds = useMemo(() => [...new Set(incentives.map(i => i.clinic_user_id).filter(Boolean))], [incentives]);

  const applyDateFilter = (item: any) => {
    const d = new Date(item.created_at);
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > new Date(dateTo.getTime() + 86400000)) return false;
    return true;
  };

  const filteredCommissions = useMemo(() => commissions.filter(c => {
    if (!applyDateFilter(c)) return false;
    if (filterClinic !== 'ALL' && c.clinic_external_id !== filterClinic) return false;
    if (filterStatus !== 'ALL' && c.status !== filterStatus) return false;
    return true;
  }), [commissions, dateFrom, dateTo, filterClinic, filterStatus]);

  const filteredIncentives = useMemo(() => incentives.filter(i => {
    if (!applyDateFilter(i)) return false;
    if (filterClinic !== 'ALL' && i.clinic_external_id !== filterClinic) return false;
    if (filterAttendant !== 'ALL' && i.clinic_user_id !== filterAttendant) return false;
    if (filterStatus !== 'ALL' && i.status !== filterStatus) return false;
    return true;
  }), [incentives, dateFrom, dateTo, filterClinic, filterAttendant, filterStatus]);

  const mimoIncentives = filteredIncentives.filter(i => i.incentive_type === 'MIMO_SEMANAL');
  const pixIncentives = filteredIncentives.filter(i => i.incentive_type === 'PIX_MENSAL');

  const totalDirect = filteredCommissions.filter(c => c.commission_type === 'DIRECT').reduce((s, c) => s + Number(c.commission_amount), 0);
  const totalOverride = filteredCommissions.filter(c => c.commission_type === 'OVERRIDE').reduce((s, c) => s + Number(c.commission_amount), 0);
  const totalPix = pixIncentives.reduce((s, i) => s + Number(i.incentive_amount || 0), 0);

  const hasActiveFilters = filterClinic !== 'ALL' || filterAttendant !== 'ALL' || filterStatus !== 'ALL' || !!dateFrom || !!dateTo;

  const clearFilters = () => {
    setDateFrom(undefined); setDateTo(undefined);
    setFilterClinic('ALL'); setFilterAttendant('ALL'); setFilterStatus('ALL');
  };

  const renderTable = (headers: string[], rows: React.ReactNode) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b text-left">
          {headers.map(h => <th key={h} className="pb-3 whitespace-nowrap pr-4">{h}</th>)}
        </tr></thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bonificações e Incentivos</h1>
          <p className="text-muted-foreground">Gestão de bonificações de partners e incentivos de atendentes Help Ude</p>
        </div>

        <BonificacaoFilters
          dateFrom={dateFrom} dateTo={dateTo}
          filterClinic={filterClinic} filterAttendant={filterAttendant} filterStatus={filterStatus}
          clinicIds={clinicIds} attendantIds={attendantIds}
          onDateFromChange={setDateFrom} onDateToChange={setDateTo}
          onFilterClinicChange={setFilterClinic} onFilterAttendantChange={setFilterAttendant}
          onFilterStatusChange={setFilterStatus}
          onClearFilters={clearFilters} hasActiveFilters={hasActiveFilters}
        />

        <BonificacaoSummaryCards
          totalDirect={totalDirect} totalOverride={totalOverride}
          totalPix={totalPix} totalMimos={mimoIncentives.length}
        />

        <BonificacaoTiersInfo />

        <Tabs defaultValue="mimos">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="mimos" className="text-xs sm:text-sm">🎁 Mimos Semanais</TabsTrigger>
            <TabsTrigger value="pix" className="text-xs sm:text-sm">💰 PIX Mensal</TabsTrigger>
            <TabsTrigger value="bonificacoes" className="text-xs sm:text-sm">📊 Bonificações</TabsTrigger>
          </TabsList>

          <TabsContent value="mimos">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">Mimos Semanais por Simulação</CardTitle>
                    <CardDescription>Pago pelo partner · Avaliação semanal</CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs w-fit">🕐 Semanal · {mimoIncentives.length} registros</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" /></div>
                ) : mimoIncentives.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Gift className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>Nenhum mimo registrado {hasActiveFilters ? 'com os filtros aplicados' : ''}</p>
                  </div>
                ) : renderTable(
                  ['Mês Ref.', 'Semana', 'Clínica', 'Simulações', 'Produção', 'Faixa Mimo', 'Status'],
                  mimoIncentives.map(i => (
                    <tr key={i.id} className="border-b hover:bg-accent/30">
                      <td className="py-3">{i.reference_month}</td>
                      <td className="py-3">Semana {i.reference_week}</td>
                      <td className="py-3 text-xs">{i.clinic_external_id || '—'}</td>
                      <td className="py-3 font-medium">{i.cpfs_generated}</td>
                      <td className="py-3">{i.consultations_generated} consultas</td>
                      <td className="py-3"><Badge variant="secondary" className="font-medium">{i.pix_tier || '—'}</Badge></td>
                      <td className="py-3"><Badge className={COMMISSION_STATUS_COLORS[i.status] || ''}>{COMMISSION_STATUS_LABELS[i.status] || i.status}</Badge></td>
                    </tr>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pix">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">PIX por Contrato Pago</CardTitle>
                    <CardDescription>Pago pela Help Ude · Avaliação mensal</CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs w-fit">📅 Mensal · {pixIncentives.length} registros</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {pixIncentives.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>Nenhum incentivo PIX registrado {hasActiveFilters ? 'com os filtros aplicados' : ''}</p>
                  </div>
                ) : renderTable(
                  ['Mês Ref.', 'Clínica', 'Produção Paga', 'Faixa', 'Valor PIX', 'Status'],
                  pixIncentives.map(i => (
                    <tr key={i.id} className="border-b hover:bg-accent/30">
                      <td className="py-3">{i.reference_month}</td>
                      <td className="py-3 text-xs">{i.clinic_external_id || '—'}</td>
                      <td className="py-3">R$ {formatCurrency(Number(i.paid_amount_generated || 0))}</td>
                      <td className="py-3"><Badge variant="secondary">{i.pix_tier || '—'}</Badge></td>
                      <td className="py-3 font-bold text-green-600">R$ {formatCurrency(Number(i.incentive_amount || 0))}</td>
                      <td className="py-3"><Badge className={COMMISSION_STATUS_COLORS[i.status] || ''}>{COMMISSION_STATUS_LABELS[i.status] || i.status}</Badge></td>
                    </tr>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bonificacoes">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">Bonificações do Partner</CardTitle>
                    <CardDescription>Bonificação direta (1,6%) e de rede/override (0,2%)</CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs w-fit">{filteredCommissions.length} registros</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {filteredCommissions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>Nenhuma bonificação registrada {hasActiveFilters ? 'com os filtros aplicados' : ''}</p>
                  </div>
                ) : renderTable(
                  ['Tipo', 'Mês Ref.', 'Clínica', 'Valor Base', 'Taxa', 'Bonificação', 'Status'],
                  filteredCommissions.map(c => (
                    <tr key={c.id} className="border-b hover:bg-accent/30">
                      <td className="py-3"><Badge variant="outline">{c.commission_type === 'DIRECT' ? 'Direta' : 'Rede'}</Badge></td>
                      <td className="py-3">{c.reference_month}</td>
                      <td className="py-3 text-xs">{c.clinic_external_id || '—'}</td>
                      <td className="py-3">R$ {formatCurrency(Number(c.net_paid_amount))}</td>
                      <td className="py-3">{(Number(c.commission_rate) * 100).toFixed(2)}%</td>
                      <td className="py-3 font-bold text-green-600">R$ {formatCurrency(Number(c.commission_amount))}</td>
                      <td className="py-3"><Badge className={COMMISSION_STATUS_COLORS[c.status] || ''}>{COMMISSION_STATUS_LABELS[c.status] || c.status}</Badge></td>
                    </tr>
                  ))
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
