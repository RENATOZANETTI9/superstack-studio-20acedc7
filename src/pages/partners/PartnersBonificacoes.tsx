import { useState, useEffect, useMemo, useCallback } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { CalendarClock, Download, Copy, Gift, Inbox } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { isAdminRole, MIMO_TIERS, getMimoTier, BRINDE_DESCRIPTIONS, PARTNER_RULES } from '@/lib/partner-rules';
import { endOfMonth, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import BonificacaoFilters from '@/components/partners/BonificacaoFilters';
import BonificacaoSummaryCards from '@/components/partners/BonificacaoSummaryCards';
import BonificacaoTiersInfo from '@/components/partners/BonificacaoTiersInfo';
import BonificacaoMimosTab from '@/components/partners/BonificacaoMimosTab';
import BonificacaoPixTab from '@/components/partners/BonificacaoPixTab';
import BonificacaoCommissionsTab from '@/components/partners/BonificacaoCommissionsTab';
import BonificacaoEvolutionChart from '@/components/partners/BonificacaoEvolutionChart';

const PartnersBonificacoes = () => {
  const { role, user } = useAuth();
  const [commissions, setCommissions] = useState<any[]>([]);
  const [incentives, setIncentives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [filterClinic, setFilterClinic] = useState('ALL');
  const [filterAttendant, setFilterAttendant] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Clinic relations for name display + ownership check
  const [clinicRelations, setClinicRelations] = useState<any[]>([]);
  const [myPartner, setMyPartner] = useState<any>(null);

  const isAdmin = isAdminRole(role);
  const isMasterPartner = role === 'master_partner';
  const isPartner = role === 'partner';
  // Partners and master_partners can mark mimos as delivered (they pay them)
  const canMarkMimoDelivered = isPartner || isMasterPartner || isAdmin;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    // Fetch partner record for current user
    const partnerPromise = user
      ? supabase.from('partners').select('id, type').eq('user_id', user.id).maybeSingle()
      : Promise.resolve({ data: null });

    // Server-side period boundary: default to last 90 days when no explicit filter
    const fromISO = (dateFrom ?? new Date(Date.now() - 90 * 86400000)).toISOString();
    const toISO = dateTo ? new Date(dateTo.getTime() + 86400000).toISOString() : new Date().toISOString();

    const [comRes, incRes, partnerRes, clinicRes] = await Promise.all([
      supabase.from('partner_commissions')
        .select('id, partner_id, beneficiary_partner_id, commission_type, reference_month, net_paid_amount, commission_rate, commission_amount, status, paid_at, approved_at, clinic_external_id, created_at')
        .gte('created_at', fromISO).lte('created_at', toISO)
        .order('created_at', { ascending: false })
        .limit(1000),
      supabase.from('attendant_incentives')
        .select('id, clinic_user_id, clinic_external_id, incentive_type, reference_month, reference_week, incentive_amount, status, pix_key, pix_tier, consultations_generated, paid_amount_generated, paid_at, created_at')
        .gte('created_at', fromISO).lte('created_at', toISO)
        .order('created_at', { ascending: false })
        .limit(1000),
      partnerPromise,
      supabase.from('partner_clinic_relations')
        .select('clinic_external_id, clinic_name, partner_id')
        .limit(2000),
    ]);
    const firstErr = comRes.error || incRes.error || clinicRes.error;
    if (firstErr) setLoadError(firstErr.message);
    setCommissions(comRes.data || []);
    setIncentives(incRes.data || []);
    setMyPartner((partnerRes as any).data ?? null);
    setClinicRelations(clinicRes.data || []);
    setLoading(false);
  }, [user, dateFrom, dateTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Build a map: clinic_external_id -> { name, partner_id }
  const clinicMap = useMemo(() => {
    const map: Record<string, { name: string; partnerId: string }> = {};
    for (const rel of clinicRelations) {
      if (rel.clinic_external_id) {
        map[rel.clinic_external_id] = { name: rel.clinic_name, partnerId: rel.partner_id };
      }
    }
    return map;
  }, [clinicRelations]);

  // Network partner IDs (partners in my network if I'm master_partner)
  const [networkPartnerIds, setNetworkPartnerIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!myPartner || !isMasterPartner) return;
    supabase
      .from('partner_network')
      .select('child_partner_id')
      .eq('parent_partner_id', myPartner.id)
      .eq('is_active', true)
      .then(({ data }) => {
        setNetworkPartnerIds(new Set((data || []).map(d => d.child_partner_id)));
      });
  }, [myPartner, isMasterPartner]);

  /**
   * Clinic name display rules:
   * - Admin: full name always
   * - Partner: full name (all their clinics)
   * - Master Partner: full name for own clinics, abbreviated for network partner clinics
   */
  const getClinicDisplay = useCallback((clinicId: string | null): string => {
    if (!clinicId) return '—';
    const info = clinicMap[clinicId];
    if (!info) return clinicId;

    // Admin sees everything
    if (isAdmin) return info.name;

    // If master_partner and clinic belongs to a network partner → abbreviate
    if (isMasterPartner && myPartner && info.partnerId !== myPartner.id && networkPartnerIds.has(info.partnerId)) {
      const words = info.name.split(' ');
      if (words.length <= 1) return info.name.substring(0, 3) + '...';
      return words[0] + ' ' + words.slice(1).map(w => w[0] + '.').join(' ');
    }

    return info.name;
  }, [clinicMap, isAdmin, isMasterPartner, myPartner, networkPartnerIds]);

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

  // Próximo pagamento PIX (data + valor)
  const nextPixDate = format(endOfMonth(new Date()), 'dd/MM/yyyy', { locale: ptBR });
  const daysUntilPix = Math.max(
    0,
    Math.ceil((endOfMonth(new Date()).getTime() - Date.now()) / 86400000),
  );
  const currentMonthKey = format(new Date(), 'yyyy-MM');
  const paidThisMonth = commissions
    .filter(c => (c.reference_month || '').startsWith(currentMonthKey))
    .reduce((s, c) => s + Number(c.net_paid_amount || 0), 0);
  const nextPixTier = PARTNER_RULES.PIX_TIERS.find(
    t => paidThisMonth >= t.min && paidThisMonth <= t.max,
  );

  const clinicNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const [id, info] of Object.entries(clinicMap)) {
      map[id] = info.name;
    }
    return map;
  }, [clinicMap]);

  const hasActiveFilters = filterClinic !== 'ALL' || filterAttendant !== 'ALL' || filterStatus !== 'ALL' || !!dateFrom || !!dateTo;

  // Real payment history (last months with PAID commissions/PIX incentives)
  const paymentHistory = useMemo(() => {
    const buckets = new Map<string, { total: number; count: number }>();
    for (const c of commissions) {
      if (c.status !== 'PAID') continue;
      const key = c.reference_month;
      if (!key) continue;
      const b = buckets.get(key) || { total: 0, count: 0 };
      b.total += Number(c.commission_amount || 0);
      b.count += 1;
      buckets.set(key, b);
    }
    for (const i of incentives) {
      if (i.status !== 'PAID') continue;
      const key = i.reference_month;
      if (!key) continue;
      const b = buckets.get(key) || { total: 0, count: 0 };
      b.total += Number(i.incentive_amount || 0);
      b.count += 1;
      buckets.set(key, b);
    }
    return [...buckets.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .slice(0, 3)
      .map(([mes, v]) => ({ mes, ...v }));
  }, [commissions, incentives]);

  const hasNextPix = !!nextPixTier && paidThisMonth > 0;

  const clearFilters = () => {
    setDateFrom(undefined); setDateTo(undefined);
    setFilterClinic('ALL'); setFilterAttendant('ALL'); setFilterStatus('ALL');
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
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bonificações e Incentivos</h1>
          <p className="text-muted-foreground">Gestão de bonificações de partners e incentivos de atendentes Help Ude</p>
        </div>

        <BonificacaoFilters
          dateFrom={dateFrom} dateTo={dateTo}
          filterClinic={filterClinic} filterAttendant={filterAttendant} filterStatus={filterStatus}
          clinicIds={clinicIds} attendantIds={attendantIds} clinicNameMap={clinicNameMap}
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

        <BonificacaoEvolutionChart commissions={filteredCommissions} />

        <Tabs defaultValue="resumo">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="resumo" className="text-xs sm:text-sm">📊 Resumo</TabsTrigger>
            <TabsTrigger value="pix-atendente" className="text-xs sm:text-sm">💸 PIX por Atendente</TabsTrigger>
            <TabsTrigger value="mimo-ativo" className="text-xs sm:text-sm">🎁 Mimo Ativo (Campanhas)</TabsTrigger>
          </TabsList>

          <TabsContent value="resumo" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-primary" /> Próximo pagamento PIX
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <p className="text-sm text-muted-foreground">{nextPixDate}</p>
                      {!hasNextPix ? (
                        <>
                          <p className="text-2xl font-bold text-muted-foreground">—</p>
                          <p className="text-xs text-muted-foreground">Sem pagamentos apurados neste mês — aguardando primeiro ciclo</p>
                        </>
                      ) : (
                        <p className="text-2xl font-bold text-primary">
                          {nextPixTier!.pix}
                        </p>
                      )}
                    </div>
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                      {daysUntilPix === 0 ? 'Hoje' : `Em ${daysUntilPix} dia${daysUntilPix === 1 ? '' : 's'}`}
                    </Badge>
                  </div>
                  <Button variant="outline" size="sm">Ver detalhes</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Histórico de Pagamentos</CardTitle>
                </CardHeader>
                <CardContent>
                  {paymentHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm flex flex-col items-center gap-2">
                      <Inbox className="h-8 w-8 opacity-30" />
                      Sem pagamentos registrados — aguardando primeiro ciclo
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mês</TableHead>
                          <TableHead>Total Pago</TableHead>
                          <TableHead>Itens</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paymentHistory.map(r => (
                          <TableRow key={r.mes}>
                            <TableCell>{r.mes}</TableCell>
                            <TableCell>R$ {r.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                            <TableCell>{r.count}</TableCell>
                            <TableCell><Badge className="bg-green-100 text-green-700 hover:bg-green-100">Pago ✅</Badge></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="pix-atendente" className="space-y-4">
            <PixPorAtendenteTab
              items={pixIncentives}
              getClinicDisplay={getClinicDisplay}
            />
          </TabsContent>

          <TabsContent value="mimo-ativo" className="space-y-4">
            <MimoAtivoTab items={mimoIncentives} getClinicDisplay={getClinicDisplay} />
          </TabsContent>
        </Tabs>

        <Tabs defaultValue="mimos">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="mimos" className="text-xs sm:text-sm">🎁 Mimos Semanais</TabsTrigger>
            <TabsTrigger value="pix" className="text-xs sm:text-sm">💰 PIX Mensal</TabsTrigger>
            <TabsTrigger value="bonificacoes" className="text-xs sm:text-sm">📊 Bonificações</TabsTrigger>
          </TabsList>

          <TabsContent value="mimos">
            <BonificacaoMimosTab
              items={mimoIncentives}
              loading={loading}
              hasActiveFilters={hasActiveFilters}
              canMarkDelivered={canMarkMimoDelivered}
              getClinicDisplay={getClinicDisplay}
              onRefresh={fetchData}
            />
          </TabsContent>

          <TabsContent value="pix">
            <BonificacaoPixTab
              items={pixIncentives}
              hasActiveFilters={hasActiveFilters}
              isAdmin={isAdmin}
              getClinicDisplay={getClinicDisplay}
              onRefresh={fetchData}
            />
          </TabsContent>

          <TabsContent value="bonificacoes">
            <BonificacaoCommissionsTab
              items={filteredCommissions}
              hasActiveFilters={hasActiveFilters}
              isAdmin={isAdmin}
              getClinicDisplay={getClinicDisplay}
              onRefresh={fetchData}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

const PixPorAtendenteTab = ({ items, getClinicDisplay }: { items: any[]; getClinicDisplay: (id: string | null) => string }) => {
  const rows = items.map(i => ({
    id: i.id,
    atendente: i.clinic_user_id || '—',
    clinica: getClinicDisplay(i.clinic_external_id),
    gerado: Number(i.paid_amount_generated || 0),
    pix: Number(i.incentive_amount || 0),
    pixKey: i.pix_key || '',
    status: i.status,
  }));
  const totalGerado = rows.reduce((s, r) => s + r.gerado, 0);
  const totalPix = rows.reduce((s, r) => s + r.pix, 0);

  const exportarCSV = () => {
    const header = 'Atendente,Clínica,Chave PIX,Valor\n';
    const csvRows = rows.map(r => `${r.atendente},${r.clinica},${r.pixKey},${r.pix.toFixed(2)}`).join('\n');
    const blob = new Blob([header + csvRows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pix-atendentes-${new Date().toISOString().slice(0, 7)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exportado para pagamento');
  };

  const copiarLista = () => {
    const txt = rows.map(r => `${r.atendente} (${r.clinica}) — R$ ${r.pix.toFixed(2).replace('.', ',')}`).join('\n');
    navigator.clipboard.writeText(txt);
    toast.success('Lista copiada para a área de transferência');
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Pagamentos PIX por Atendente</CardTitle>
        <p className="text-xs text-muted-foreground">Baseado em incentivos apurados no período selecionado</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm flex flex-col items-center gap-2">
            <Inbox className="h-8 w-8 opacity-30" />
            Sem dados ainda — nenhum PIX apurado para atendentes no período
          </div>
        ) : (
          <>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={exportarCSV} className="bg-primary hover:bg-primary/90">
                <Download className="h-4 w-4 mr-2" /> Exportar para Pagamento
              </Button>
              <Button variant="outline" onClick={copiarLista}>
                <Copy className="h-4 w-4 mr-2" /> Copiar Lista
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Atendente</TableHead>
                    <TableHead>Clínica</TableHead>
                    <TableHead className="text-right">Valor gerado</TableHead>
                    <TableHead className="text-right">PIX a receber</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium text-xs">{r.atendente}</TableCell>
                      <TableCell className="text-xs">{r.clinica}</TableCell>
                      <TableCell className="text-right">R$ {r.gerado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right font-semibold text-primary">R$ {r.pix.toFixed(2).replace('.', ',')}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{r.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/40 font-semibold">
                    <TableCell colSpan={2}>Total</TableCell>
                    <TableCell className="text-right">R$ {totalGerado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right text-primary">R$ {totalPix.toFixed(2).replace('.', ',')}</TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

const formatMimoRange = (min: number, max: number) =>
  Number.isFinite(max) ? `${min}-${max} sims` : `${min}+ sims`;

const tipoAtingido = (sims: number) => getMimoTier(sims)?.label ?? null;

const MimoAtivoTab = ({ items, getClinicDisplay }: { items: any[]; getClinicDisplay: (id: string | null) => string }) => {
  // Aggregate simulations per clinic from mimo incentives
  const byClinic = new Map<string, number>();
  for (const i of items) {
    const key = i.clinic_external_id || 'unknown';
    byClinic.set(key, (byClinic.get(key) || 0) + Number(i.consultations_generated || 0));
  }
  const clinicas = [...byClinic.entries()].map(([id, sims]) => ({ id, nome: getClinicDisplay(id), sims }));

  return (
  <div className="space-y-4">
    <Card className="border-primary/30">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Gift className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">Faixas de Mimo Semanal</CardTitle>
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">ATIVA</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Faixas configuradas do sistema · Simulações contabilizadas por incentivo apurado</p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Faixa</TableHead>
                <TableHead>Brinde</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MIMO_TIERS.map(t => (
                <TableRow key={t.label}>
                  <TableCell className="font-medium">{t.label}</TableCell>
                  <TableCell>{formatMimoRange(t.min, t.max)}</TableCell>
                  <TableCell>{BRINDE_DESCRIPTIONS[t.level]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Status atual das clínicas</CardTitle>
      </CardHeader>
      <CardContent>
        {clinicas.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm flex flex-col items-center gap-2">
            <Inbox className="h-8 w-8 opacity-30" />
            Sem dados ainda — nenhuma clínica com simulações apuradas no período
          </div>
        ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clinicas.map(c => {
            const tipo = tipoAtingido(c.sims);
            const proximo = MIMO_TIERS.find(t => c.sims < t.min);
            const pct = proximo ? Math.min((c.sims / proximo.min) * 100, 100) : 100;
            return (
              <div key={c.id} className="rounded-lg border p-3 space-y-2 bg-card shadow-sm">
                <div className="flex justify-between items-center">
                  <p className="font-medium text-sm">{c.nome}</p>
                  {tipo ? (
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/10">{tipo} {!proximo && '✅'}</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">Ainda sem Mimo</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{c.sims} simulações acumuladas</p>
                <Progress value={pct} className="h-2" />
                <p className="text-[11px] text-muted-foreground">
                  {proximo ? `Em progresso para ${proximo.label}` : 'Tipo máximo atingido'}
                </p>
              </div>
            );
          })}
        </div>
        )}
      </CardContent>
    </Card>
  </div>
  );
};

export default PartnersBonificacoes;
