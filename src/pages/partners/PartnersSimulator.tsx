import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Calculator, Target, DollarSign, Info, Lock, EyeOff, ArrowDown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { isAdminRole, isPartnerRole, TYPE_COLORS, PARTNER_RULES, formatCurrency } from '@/lib/partner-rules';
import PartnerOnboarding from '@/components/partners/PartnerOnboarding';

const PartnersSimulator = () => {
  const { role } = useAuth();
  const isAdmin = isAdminRole(role as any);
  const isPartner = isPartnerRole(role as any);

  const ref = PARTNER_RULES.SEH_REFERENCE;
  const [clinics, setClinics] = useState(5);
  const [consultationsMonth, setConsultationsMonth] = useState(clinics * ref.SIMULATIONS_PER_DAY * ref.WORKING_DAYS);
  const [approvalRate, setApprovalRate] = useState(ref.APPROVAL_RATE * 100);
  const [paidRate, setPaidRate] = useState(ref.PAID_RATE * 100);
  const [avgTicket, setAvgTicket] = useState(ref.AVG_TICKET);
  const [weights, setWeights] = useState(PARTNER_RULES.SEH_WEIGHTS);
  const [rates, setRates] = useState({ direct: PARTNER_RULES.COMMISSION_RATE_DIRECT, override: PARTNER_RULES.COMMISSION_RATE_OVERRIDE });

  useEffect(() => { loadConfig(); }, []);

  useEffect(() => {
    setConsultationsMonth(clinics * ref.SIMULATIONS_PER_DAY * ref.WORKING_DAYS);
  }, [clinics]);

  const loadConfig = async () => {
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

    const { data: rateConfigs } = await supabase
      .from('partner_system_config')
      .select('config_key, config_value')
      .eq('category', 'COMMISSION_RATES');
    const r: any = {};
    (rateConfigs || []).forEach((c: any) => { r[c.config_key] = c.config_value?.rate || 0; });
    if (r.commission_rate_direct) setRates(prev => ({ ...prev, direct: r.commission_rate_direct }));
    if (r.commission_rate_override) setRates(prev => ({ ...prev, override: r.commission_rate_override }));
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
  const directCommission = totalPaidValue * rates.direct;
  const yearlyProjection = directCommission * 12;

  // Funnel data
  const funnelSteps = [
    { label: 'Simulações/Mês', value: consultationsMonth, color: 'bg-blue-500', textColor: 'text-blue-700', bgLight: 'bg-blue-50' },
    { label: 'Aprovados (10%)', value: approvedContracts, color: 'bg-amber-500', textColor: 'text-amber-700', bgLight: 'bg-amber-50' },
    { label: 'Pagos (10%)', value: paidContracts, color: 'bg-green-500', textColor: 'text-green-700', bgLight: 'bg-green-50' },
    { label: 'Valor Total', value: totalPaidValue, color: 'bg-emerald-600', textColor: 'text-emerald-700', bgLight: 'bg-emerald-50', isCurrency: true },
  ];

  const maxVal = Math.max(consultationsMonth, 1);

  return (
    <DashboardLayout>
      <PartnerOnboarding />
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
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Taxa: {(rates.direct * 100).toFixed(1)}%</p>
                  </div>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between items-center p-2 sm:p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <span className="text-xs sm:text-sm font-medium">Bonificação/Mês</span>
                    <span className="font-bold text-green-600 text-sm sm:text-base">R$ {formatCurrency(directCommission)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 sm:p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <span className="text-xs sm:text-sm font-medium">Projeção Anual</span>
                    <span className="font-bold text-green-600 text-base sm:text-lg">R$ {formatCurrency(yearlyProjection)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SEH Score */}
            <Card>
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
      </div>
    </DashboardLayout>
  );
};

export default PartnersSimulator;
