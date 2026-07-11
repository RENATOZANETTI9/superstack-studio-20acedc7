import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Calculator, Target, DollarSign, Info, Lock, EyeOff, ArrowDown, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { isAdminRole, isPartnerRole, TYPE_COLORS, PARTNER_RULES, formatCurrency } from '@/lib/partner-rules';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  getReferenceMonth,
  getWeekStartISO,
  getWeekBuckets,
  getWeekStart,
  localDateKey,
  measureQuery,
  PERF_BUDGET_MS,
  type PerfSample,
} from './lib/period-helpers';

const PartnersSimulator = () => {
  const { role } = useAuth();
  const isAdmin = isAdminRole(role as any);
  const isPartner = isPartnerRole(role as any);
  const hideRate = role === 'representante' || role === 'attendant';

  const ref = PARTNER_RULES.SEH_REFERENCE;
  const [clinics, setClinics] = useState(5);
  const [consultationsMonth, setConsultationsMonth] = useState(clinics * ref.SIMULATIONS_PER_DAY * ref.WORKING_DAYS);
  const [approvalRate, setApprovalRate] = useState(ref.APPROVAL_RATE * 100);
  const [paidRate, setPaidRate] = useState(ref.PAID_RATE * 100);
  const [avgTicket, setAvgTicket] = useState(ref.AVG_TICKET);
  const [weights, setWeights] = useState(PARTNER_RULES.SEH_WEIGHTS);

  // Fonte única: system config no banco. Recalcula automaticamente ao carregar/atualizar.
  const { data: directCfg } = useSystemConfig('taxa_bonificacao_direta');
  const { data: overrideCfg } = useSystemConfig('taxa_bonificacao_rede');
  const { data: repCfg } = useSystemConfig('taxa_comissao_representante');

  const rates = useMemo(() => {
    const d = (directCfg as any)?.rate;
    const o = (overrideCfg as any)?.rate;
    const r = (repCfg as any)?.rate;
    return {
      direct: typeof d === 'number' ? d : PARTNER_RULES.COMMISSION_RATE_DIRECT,
      override: typeof o === 'number' ? o : PARTNER_RULES.COMMISSION_RATE_OVERRIDE,
      representante: typeof r === 'number' ? r : PARTNER_RULES.SIMULATOR_COMMISSION_RATE_FALLBACK,
    };
  }, [directCfg, overrideCfg, repCfg]);

  useEffect(() => { loadSehWeights(); }, []);

  useEffect(() => {
    setConsultationsMonth(clinics * ref.SIMULATIONS_PER_DAY * ref.WORKING_DAYS);
  }, [clinics]);

  const loadSehWeights = async () => {
    const { data: sehConfig } = await supabase
      .from('partner_system_config')
      .select('config_value')
      .eq('config_key', 'seh_weights')
      .single();
    if (sehConfig?.config_value) {
      const w = sehConfig.config_value as any;
      if (w.volume !== undefined && w.conversion !== undefined) {
        setWeights({ volume: w.volume, conversion: w.conversion });
      }
    }
  };

  // SEH Calculation
  const metaSimulacoes = clinics * ref.SIMULATIONS_PER_DAY * ref.WORKING_DAYS;
  const pilarVolume = metaSimulacoes > 0 ? Math.min((consultationsMonth / metaSimulacoes) * 100, 100) : 0;
  const pilarConversion = (approvalRate * 0.5 + paidRate * 0.5);
  const seh = (pilarVolume * weights.volume) + (pilarConversion * weights.conversion);
  const sehScore = Math.min(Math.max(seh, 0), 100);

  let level = 'BRONZE';
  if (sehScore >= 85) level = 'ELITE';
  else if (sehScore >= 70) level = 'OURO';
  else if (sehScore >= 50) level = 'PRATA';

  // Financial projection
  const approvedContracts = Math.round(consultationsMonth * (approvalRate / 100));
  const paidContracts = Math.round(approvedContracts * (paidRate / 100));
  const totalPaidValue = paidContracts * avgTicket;
  // Projeção usa a taxa de comissão do representante configurada em Parâmetros do Sistema
  // (chave: taxa_comissao_representante). Fallback: PARTNER_RULES.SIMULATOR_COMMISSION_RATE_FALLBACK.
  const directCommission = totalPaidValue * rates.representante;
  const yearlyProjection = directCommission * 12;

  const nextMonthsProjection = [0, 1, 2].map(i => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1 + i);
    return {
      label: d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      value: directCommission,
    };
  });

  // Funnel data
  const funnelSteps = [
    { label: 'Simulações/Mês', value: consultationsMonth, color: 'bg-blue-500', textColor: 'text-blue-700', bgLight: 'bg-blue-50' },
    { label: `Aprovados (${ref.APPROVAL_RATE * 100}%)`, value: approvedContracts, color: 'bg-amber-500', textColor: 'text-amber-700', bgLight: 'bg-amber-50' },
    { label: `Pagos (${ref.PAID_RATE * 100}%)`, value: paidContracts, color: 'bg-green-500', textColor: 'text-green-700', bgLight: 'bg-green-50' },
    { label: 'Valor Total', value: totalPaidValue, color: 'bg-emerald-600', textColor: 'text-emerald-700', bgLight: 'bg-emerald-50', isCurrency: true },
  ];

  const maxVal = Math.max(consultationsMonth, 1);

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <Calculator className="h-5 w-5 sm:h-6 sm:w-6" /> Simulador de Projeção
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Simule cenários de ganho e performance.
            {isPartner && (
              <span className="inline-flex items-center gap-1 ml-2 text-amber-600">
                <Lock className="h-3 w-3" /> Alguns parâmetros estratégicos são ocultos.
              </span>
            )}
          </p>
        </div>

        <Tabs defaultValue="nova" className="space-y-4 sm:space-y-6">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="nova" className="text-xs sm:text-sm">🧮 Nova Simulação</TabsTrigger>
            <TabsTrigger value="real" className="text-xs sm:text-sm">📈 Real vs. Projetado</TabsTrigger>
          </TabsList>

          <TabsContent value="nova" className="space-y-4 sm:space-y-6">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-3 pb-3 sm:pt-4 sm:pb-4">
            <p className="text-xs sm:text-sm text-foreground">
              <strong>💡 Como usar:</strong> Ajuste os parâmetros para simular cenários. 
              Volume ({(weights.volume * 100).toFixed(0)}%) e Conversão ({(weights.conversion * 100).toFixed(0)}%).
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Input Panel */}
          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Calculator className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Parâmetros
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {isPartner ? 'Ajuste os campos editáveis.' : 'Todos os parâmetros disponíveis.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1">
                    Clínicas
                    <Tooltip>
                      <TooltipTrigger><Info className="h-3 w-3" /></TooltipTrigger>
                      <TooltipContent>Clínicas vinculadas ao partner</TooltipContent>
                    </Tooltip>
                  </label>
                  <Input type="number" value={clinics} onChange={e => setClinics(Number(e.target.value))} min={0} className="h-9" />
                </div>

                <div>
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1">
                    Simulações/Mês
                    <Tooltip>
                      <TooltipTrigger><Info className="h-3 w-3" /></TooltipTrigger>
                      <TooltipContent>Ref: {ref.SIMULATIONS_PER_DAY}/clínica/dia × {ref.WORKING_DAYS} dias</TooltipContent>
                    </Tooltip>
                  </label>
                  <Input type="number" value={consultationsMonth} onChange={e => setConsultationsMonth(Number(e.target.value))} min={0} className="h-9" />
                </div>

                {!isPartner ? (
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1">
                      Aprovação (%)
                      <Tooltip>
                        <TooltipTrigger><Info className="h-3 w-3" /></TooltipTrigger>
                        <TooltipContent>Ref: {ref.APPROVAL_RATE * 100}%</TooltipContent>
                      </Tooltip>
                    </label>
                    <Input type="number" value={approvalRate} onChange={e => setApprovalRate(Number(e.target.value))} min={0} max={100} className="h-9" />
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-2 rounded-lg bg-muted/50 text-muted-foreground text-xs">
                    <EyeOff className="h-3 w-3 mr-1" /> Restrito
                  </div>
                )}

                {!isPartner ? (
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1">
                      Pagamento (%)
                      <Tooltip>
                        <TooltipTrigger><Info className="h-3 w-3" /></TooltipTrigger>
                        <TooltipContent>Ref: {ref.PAID_RATE * 100}%</TooltipContent>
                      </Tooltip>
                    </label>
                    <Input type="number" value={paidRate} onChange={e => setPaidRate(Number(e.target.value))} min={0} max={100} className="h-9" />
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-2 rounded-lg bg-muted/50 text-muted-foreground text-xs">
                    <EyeOff className="h-3 w-3 mr-1" /> Restrito
                  </div>
                )}

                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1">
                    Ticket Médio (R$)
                    <Tooltip>
                      <TooltipTrigger><Info className="h-3 w-3" /></TooltipTrigger>
                      <TooltipContent>Ref: R$ {formatCurrency(ref.AVG_TICKET)}</TooltipContent>
                    </Tooltip>
                  </label>
                  <Input type="number" value={avgTicket} onChange={e => setAvgTicket(Number(e.target.value))} min={0} className="h-9" />
                </div>
              </div>

              {isPartner && (
                <p className="text-[10px] sm:text-xs text-muted-foreground p-2 bg-muted/50 rounded-lg">
                  🔒 Taxas de aprovação e pagamento são parâmetros estratégicos restritos.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Results Panel */}
          <div className="space-y-4">
            {/* Funnel Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Funil de Conversão
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="space-y-1">
                  {funnelSteps.map((step, i) => {
                    const widthPercent = step.isCurrency
                      ? 30
                      : Math.max((step.value / maxVal) * 100, 8);
                    return (
                      <div key={step.label}>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-full">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[10px] sm:text-xs text-muted-foreground">{step.label}</span>
                              <span className={`text-xs sm:text-sm font-bold ${step.textColor}`}>
                                {step.isCurrency ? `R$ ${formatCurrency(step.value)}` : step.value.toLocaleString('pt-BR')}
                              </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-6 sm:h-8 flex items-center overflow-hidden">
                              <div
                                className={`${step.color} h-full rounded-full transition-all duration-500 flex items-center justify-center min-w-[2rem]`}
                                style={{ width: `${widthPercent}%` }}
                              >
                                <span className="text-[9px] sm:text-[10px] text-white font-medium truncate px-1">
                                  {step.isCurrency ? `R$ ${formatCurrency(step.value)}` : step.value}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        {i < funnelSteps.length - 1 && (
                          <div className="flex justify-center py-0.5">
                            <ArrowDown className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Financial Results */}
            <Card>
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex items-center gap-3 mb-3 sm:mb-4">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Projeção Financeira</p>
                    {!hideRate && (
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      Taxa: {(rates.representante * 100).toFixed(2)}%
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-3.5 h-3.5 text-muted-foreground inline ml-1 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>Taxa de comissão do representante configurada em Parâmetros do Sistema.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between items-center p-2 sm:p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <span className="text-xs sm:text-sm font-medium">Bonificação/Mês</span>
                    <span className="font-bold text-green-600 text-sm sm:text-base">R$ {formatCurrency(directCommission)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 sm:p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                    <span className="text-xs sm:text-sm font-medium">Projeção próximos 90 dias</span>
                    <span className="text-xs text-muted-foreground">mês a mês</span>
                  </div>
                  {nextMonthsProjection.map(m => (
                    <div key={m.label} className="flex justify-between items-center px-3 py-1.5 rounded-lg hover:bg-muted/30">
                      <span className="text-xs sm:text-sm text-muted-foreground capitalize">{m.label}</span>
                      <span className="font-bold text-green-600 text-sm sm:text-base">R$ {formatCurrency(m.value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* SEH Score */}
            <Card>
              {isAdmin && (
                <Card className="border-amber-200 bg-amber-50/50">
                  <CardContent className="pt-3 pb-3">
                    <p className="text-xs text-amber-800">
                      <strong>⚙️ Auditoria de cálculo:</strong> Meta de referência = {ref.SIMULATIONS_PER_DAY} sim/clínica/dia × {ref.WORKING_DAYS} dias úteis = <strong>{ref.SIMULATIONS_PER_DAY * ref.WORKING_DAYS} simulações/clínica/mês</strong>.
                      Parâmetro fixo durante os primeiros 60 dias de operação real. Após isso, o sistema calculará automaticamente com base nos dados reais de cada clínica.
                    </p>
                  </CardContent>
                </Card>
              )}
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Target className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">SEH Projetado</p>
                      <p className="text-2xl sm:text-3xl font-bold">{sehScore.toFixed(1)}</p>
                    </div>
                  </div>
                  <Badge className={TYPE_COLORS[level === 'ELITE' || level === 'OURO' ? 'MASTER' : 'PARTNER']}>{level}</Badge>
                </div>
                <div className="space-y-1 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Volume ({(weights.volume * 100).toFixed(0)}%)</span>
                    <span className="font-medium">{pilarVolume.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Conversão ({(weights.conversion * 100).toFixed(0)}%)</span>
                    <span className="font-medium">{pilarConversion.toFixed(1)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
          </TabsContent>

          <TabsContent value="real" className="space-y-4">
            <RealVsProjetadoTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

const RealVsProjetadoTab = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState({ calculated: 0, paid: 0, paidAmount: 0 });
  const [weekData, setWeekData] = useState<Array<{ dia: string; Pago: number }>>([]);
  const [clinics, setClinics] = useState<Array<{ id: string; nome: string; status: string }>>([]);
  const [timings, setTimings] = useState<PerfSample[]>([]);

  // Local-timezone helpers (avoid UTC drift for month/week windows).
  const now = new Date();
  const referenceMonth = getReferenceMonth(now);
  const monthLabel = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const weekStartISO = getWeekStartISO(now);
  const weekStartLocal = getWeekStart(now);
  const tzName =
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'local';
  const tzOffsetMin = -now.getTimezoneOffset();
  const tzOffsetLabel = `${tzOffsetMin >= 0 ? '+' : '-'}${String(
    Math.floor(Math.abs(tzOffsetMin) / 60),
  ).padStart(2, '0')}:${String(Math.abs(tzOffsetMin) % 60).padStart(2, '0')}`;
  const fmt = (d: Date) =>
    d.toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  const monthStartLocal = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
  const monthEndLocal = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user?.id) { setLoading(false); return; }
      setLoading(true);

      const { data: partnerRow } = await supabase
        .from('partners')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      const pid = partnerRow?.id ?? null;
      if (cancelled) return;
      setPartnerId(pid);

      if (!pid) { setLoading(false); return; }

      // Server-side filters: minimal payload, use new indexes. Each query is
      // timed so we surface regressions (>PERF_BUDGET_MS) in the console.
      const [monthTimed, weekTimed, portfolioTimed] = await Promise.all([
        measureQuery('commissions.month', async () =>
          await supabase
            .from('partner_commissions')
            .select('status, commission_amount')
            .eq('beneficiary_partner_id', pid)
            .eq('reference_month', referenceMonth)
            .in('status', ['CALCULATED', 'APPROVED', 'PAID']),
        ),
        measureQuery('commissions.week', async () =>
          await supabase
            .from('partner_commissions')
            .select('commission_amount, paid_at')
            .eq('beneficiary_partner_id', pid)
            .eq('status', 'PAID')
            .gte('paid_at', weekStartISO),
        ),
        measureQuery('portfolio.clinics', async () =>
          await supabase
            .from('portfolio_clinics')
            .select('id, nome, status')
            .eq('partner_id', pid)
            .order('created_at', { ascending: false })
            .limit(10),
        ),
      ]);
      const monthRes = monthTimed.result;
      const weekRes = weekTimed.result;
      const portfolioRes = portfolioTimed.result;

      const samples: PerfSample[] = [monthTimed.sample, weekTimed.sample, portfolioTimed.sample];
      setTimings(samples);

      // Persist every breach into perf_alerts for later auditing.
      const breaches = samples.filter((s) => s.overBudget);
      if (breaches.length > 0) {
        void supabase.from('perf_alerts').insert(
          breaches.map((b) => ({
            user_id: user.id,
            source: 'client:PartnersSimulator',
            label: b.label,
            duration_ms: b.ms,
            budget_ms: PERF_BUDGET_MS,
            context: { partnerId: pid, referenceMonth, weekStartISO, tz: tzName },
          })),
        );
      }

      if (cancelled) return;

      const monthRows = monthRes.data || [];
      const calculated = monthRows.filter((c: any) => c.status === 'CALCULATED' || c.status === 'APPROVED').length;
      const paidRows = monthRows.filter((c: any) => c.status === 'PAID');
      const paidAmount = paidRows.reduce((sum: number, c: any) => sum + Number(c.commission_amount || 0), 0);
      setMetrics({ calculated, paid: paidRows.length, paidAmount });

      // Weekly buckets keyed by local date (last 7 days including today).
      const week = getWeekBuckets(now).map(b => ({ ...b, Pago: 0 }));
      (weekRes.data || []).forEach((c: any) => {
        if (!c.paid_at) return;
        const key = localDateKey(new Date(c.paid_at));
        const bucket = week.find(w => w.dateKey === key);
        if (bucket) bucket.Pago += Number(c.commission_amount || 0);
      });
      setWeekData(week.map(({ dia, Pago }) => ({ dia, Pago })));

      setClinics((portfolioRes.data || []) as any);
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [user?.id, referenceMonth, weekStartISO, tzName]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Carregando dados reais…
        </CardContent>
      </Card>
    );
  }

  if (!partnerId) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Nenhum perfil de partner vinculado a este usuário.
        </CardContent>
      </Card>
    );
  }

  const hasMonthData = metrics.calculated > 0 || metrics.paid > 0 || metrics.paidAmount > 0;
  const hasWeekData = weekData.some(w => w.Pago > 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Período calculado (fuso do usuário)</CardTitle>
          <CardDescription>
            Valores usados para filtrar os contadores e o gráfico. Confira que
            batem com o seu fuso horário atual.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3 text-sm">
            <div className="rounded-md border p-3 space-y-1">
              <p className="text-xs text-muted-foreground">Fuso horário</p>
              <p className="font-medium">{tzName}</p>
              <p className="text-xs text-muted-foreground">UTC {tzOffsetLabel}</p>
            </div>
            <div className="rounded-md border p-3 space-y-1">
              <p className="text-xs text-muted-foreground">Mês de referência</p>
              <p className="font-medium">{referenceMonth}</p>
              <p className="text-xs text-muted-foreground">
                {fmt(monthStartLocal)} → {fmt(monthEndLocal)}
              </p>
            </div>
            <div className="rounded-md border p-3 space-y-1">
              <p className="text-xs text-muted-foreground">Janela semanal (7 dias)</p>
              <p className="font-medium">
                {localDateKey(weekStartLocal)} → {localDateKey(now)}
              </p>
              <p className="text-xs text-muted-foreground">
                início local: {fmt(weekStartLocal)} · ISO enviado: {weekStartISO}
              </p>
            </div>
          </div>
          {timings.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-muted-foreground">Tempo das buscas:</span>
              {timings.map((t) => (
                <Badge
                  key={t.label}
                  variant={t.overBudget ? 'destructive' : 'outline'}
                  className="text-xs"
                >
                  {t.label}: {t.ms.toFixed(0)}ms
                </Badge>
              ))}
              <span className="text-xs text-muted-foreground">
                (orçamento {PERF_BUDGET_MS}ms · alertas salvos em perf_alerts)
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base capitalize">Comissões · {monthLabel}</CardTitle>
        </CardHeader>
        <CardContent>
          {!hasMonthData ? (
            <p className="text-sm text-muted-foreground py-6 text-center capitalize">
              Sem comissões registradas em {monthLabel}
            </p>
          ) : (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
              <div className="rounded-lg border p-3 bg-card shadow-sm space-y-1">
                <p className="text-xs text-muted-foreground">Comissões calculadas</p>
                <p className="text-lg font-bold">{metrics.calculated}</p>
              </div>
              <div className="rounded-lg border p-3 bg-card shadow-sm space-y-1">
                <p className="text-xs text-muted-foreground">Comissões pagas</p>
                <p className="text-lg font-bold">{metrics.paid}</p>
              </div>
              <div className="rounded-lg border p-3 bg-card shadow-sm space-y-1 col-span-2 sm:col-span-1">
                <p className="text-xs text-muted-foreground">Valor pago no mês</p>
                <p className="text-lg font-bold text-green-600">R$ {formatCurrency(metrics.paidAmount)}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Performance Semanal (últimos 7 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          {!hasWeekData ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Nenhuma comissão paga esta semana
            </p>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dia" />
                  <YAxis />
                  <RTooltip formatter={(v: any) => `R$ ${formatCurrency(Number(v))}`} />
                  <Legend />
                  <Bar dataKey="Pago" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Clínicas do Portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          {clinics.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nenhuma clínica no portfolio ainda
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Clínica</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clinics.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.nome}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="capitalize">{c.status || '—'}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PartnersSimulator;
