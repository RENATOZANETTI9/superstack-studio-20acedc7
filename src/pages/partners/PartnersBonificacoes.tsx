import { useState, useEffect, useMemo, useCallback } from 'react';
import { MOCK_COMMISSIONS, MOCK_INCENTIVES, MOCK_CLINICS, withMockFallbackTracked } from '@/lib/mock-data';
import { MockDataBanner } from '@/components/MockDataBanner';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { CalendarClock, Download, Copy, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { isAdminRole, MIMO_TIERS, getMimoTier } from '@/lib/partner-rules';
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
  const [isMockData, setIsMockData] = useState(false);
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

    // Fetch partner record for current user
    const partnerPromise = user
      ? supabase.from('partners').select('id, type').eq('user_id', user.id).maybeSingle()
      : Promise.resolve({ data: null });

    const [comRes, incRes, partnerRes, clinicRes] = await Promise.all([
      supabase.from('partner_commissions').select('*').order('created_at', { ascending: false }),
      supabase.from('attendant_incentives').select('*').order('created_at', { ascending: false }),
      partnerPromise,
      supabase.from('partner_clinic_relations').select('clinic_external_id, clinic_name, partner_id'),
    ]);

    const com = withMockFallbackTracked(comRes.data, MOCK_COMMISSIONS);
    const inc = withMockFallbackTracked(incRes.data, MOCK_INCENTIVES);
    const clin = withMockFallbackTracked(
      clinicRes.data,
      MOCK_CLINICS.map(c => ({ clinic_external_id: c.clinic_external_id, clinic_name: c.clinic_name, partner_id: c.partner_id })),
    );
    setCommissions(com.data);
    setIncentives(inc.data);
    setMyPartner(partnerRes.data);
    setClinicRelations(clin.data);
    setIsMockData(com.isMock || inc.isMock || clin.isMock);
    setLoading(false);
  }, [user]);

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

  const clinicNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const [id, info] of Object.entries(clinicMap)) {
      map[id] = info.name;
    }
    return map;
  }, [clinicMap]);

  const hasActiveFilters = filterClinic !== 'ALL' || filterAttendant !== 'ALL' || filterStatus !== 'ALL' || !!dateFrom || !!dateTo;

  const clearFilters = () => {
    setDateFrom(undefined); setDateTo(undefined);
    setFilterClinic('ALL'); setFilterAttendant('ALL'); setFilterStatus('ALL');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <MockDataBanner show={isMockData} />
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
                      <p className="text-sm text-muted-foreground">Sexta-feira, 04/07/2026</p>
                      <p className="text-2xl font-bold text-primary">R$ 300,00</p>
                    </div>
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Em 6 dias</Badge>
                  </div>
                  <Button variant="outline" size="sm">Ver detalhes</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Histórico de Pagamentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mês</TableHead>
                        <TableHead>Total Pago</TableHead>
                        <TableHead>Atend.</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        { mes: 'Junho/2026', total: 'R$ 280,00', n: 3 },
                        { mes: 'Maio/2026', total: 'R$ 195,00', n: 2 },
                        { mes: 'Abril/2026', total: 'R$ 120,00', n: 2 },
                      ].map(r => (
                        <TableRow key={r.mes}>
                          <TableCell>{r.mes}</TableCell>
                          <TableCell>{r.total}</TableCell>
                          <TableCell>{r.n}</TableCell>
                          <TableCell><Badge className="bg-green-100 text-green-700 hover:bg-green-100">Pago ✅</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="pix-atendente" className="space-y-4">
            <PixPorAtendenteTab />
          </TabsContent>

          <TabsContent value="mimo-ativo" className="space-y-4">
            <MimoAtivoTab />
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

const PIX_ATENDENTES = [
  { nome: 'Maria Silva', clinica: 'Dental Plus', contratos: 12, gerado: 24000, pix: 85, pct: 35.3 },
  { nome: 'Ana Lima', clinica: 'BH Sorriso', contratos: 9, gerado: 18000, pix: 65, pct: 26.5 },
  { nome: 'Carla Souza', clinica: 'Odonto Minas', contratos: 6, gerado: 12000, pix: 45, pct: 17.6 },
  { nome: 'Patrícia Lima', clinica: 'Saúde Total', contratos: 4, gerado: 8000, pix: 32, pct: 11.8 },
  { nome: 'Fernanda Costa', clinica: 'Dental BH', contratos: 3, gerado: 6000, pix: 24, pct: 8.8 },
];

const PixPorAtendenteTab = () => {
  const total = {
    contratos: PIX_ATENDENTES.reduce((s, a) => s + a.contratos, 0),
    gerado: PIX_ATENDENTES.reduce((s, a) => s + a.gerado, 0),
    pix: PIX_ATENDENTES.reduce((s, a) => s + a.pix, 0),
  };

  const exportarCSV = () => {
    const header = 'Nome,Chave PIX,Valor\n';
    const rows = PIX_ATENDENTES.map(a => `${a.nome},${a.nome.toLowerCase().replace(/\s+/g, '.')}@pix,${a.pix.toFixed(2)}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pix-atendentes-junho-2026.csv';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exportado para pagamento');
  };

  const copiarLista = () => {
    const txt = PIX_ATENDENTES.map(a => `${a.nome} (${a.clinica}) — R$ ${a.pix.toFixed(2).replace('.', ',')}`).join('\n');
    navigator.clipboard.writeText(txt);
    toast.success('Lista copiada para a área de transferência');
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Pagamentos PIX — Junho 2026</CardTitle>
        <p className="text-xs text-muted-foreground">Baseado em contratos pagos no período · Corte: 25/06/2026</p>
      </CardHeader>
      <CardContent className="space-y-4">
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
                <TableHead>Recepcionista</TableHead>
                <TableHead>Clínica</TableHead>
                <TableHead className="text-right">Contratos</TableHead>
                <TableHead className="text-right">Valor gerado</TableHead>
                <TableHead className="text-right">% Total</TableHead>
                <TableHead className="text-right">PIX a receber</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PIX_ATENDENTES.map(a => (
                <TableRow key={a.nome}>
                  <TableCell className="font-medium">{a.nome}</TableCell>
                  <TableCell>{a.clinica}</TableCell>
                  <TableCell className="text-right">{a.contratos}</TableCell>
                  <TableCell className="text-right">R$ {a.gerado.toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="text-right">{a.pct.toFixed(1)}%</TableCell>
                  <TableCell className="text-right font-semibold text-primary">R$ {a.pix.toFixed(2).replace('.', ',')}</TableCell>
                  <TableCell><Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pendente</Badge></TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/40 font-semibold">
                <TableCell colSpan={2}>Total</TableCell>
                <TableCell className="text-right">{total.contratos}</TableCell>
                <TableCell className="text-right">R$ {total.gerado.toLocaleString('pt-BR')}</TableCell>
                <TableCell />
                <TableCell className="text-right text-primary">R$ {total.pix.toFixed(2).replace('.', ',')}</TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

const BRINDES: Record<number, string> = {
  1: 'Brinde Básico (caneta personalizada)',
  2: 'Brinde Intermediário (kit café)',
  3: 'Brinde Premium (mochila)',
  4: 'Brinde Elite (smartwatch)',
};

const formatMimoRange = (min: number, max: number) =>
  Number.isFinite(max) ? `${min}-${max} sims` : `${min}+ sims`;

const CLINICAS_MIMO = [
  { nome: 'Dental Plus', sims: 62 },
  { nome: 'BH Sorriso', sims: 18 },
  { nome: 'OdontoVida', sims: 35 },
  { nome: 'Sorriso Mineiro', sims: 28 },
  { nome: 'Clínica Vida', sims: 12 },
  { nome: 'Odonto Premium', sims: 8 },
];

const tipoAtingido = (sims: number) => getMimoTier(sims)?.label ?? null;

const MimoAtivoTab = () => (
  <div className="space-y-4">
    <Card className="border-primary/30">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Gift className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">Campanhas de Mimo — Semana 27</CardTitle>
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">ATIVA</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Período: 30/06 a 04/07/2026 · Meta: 50 simulações por clínica para atingir Tipo 2</p>
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
                  <TableCell>{BRINDES[t.level]}</TableCell>
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CLINICAS_MIMO.map(c => {
            const tipo = tipoAtingido(c.sims);
            const proximo = MIMO_TIERS.find(t => c.sims < t.min);
            const pct = proximo ? Math.min((c.sims / proximo.min) * 100, 100) : 100;
            return (
              <div key={c.nome} className="rounded-lg border p-3 space-y-2 bg-card shadow-sm">
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
      </CardContent>
    </Card>
  </div>
);

export default PartnersBonificacoes;
