import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Calculator, Target, DollarSign, Info, Lock, EyeOff } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { isAdminRole, isPartnerRole, TYPE_COLORS, PARTNER_RULES, formatCurrency } from '@/lib/partner-rules';

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

  // Recalculate consultations when clinics change
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

  // SEH Calculation - only Volume + Conversion
  const metaSimulacoes = clinics * ref.SIMULATIONS_PER_DAY * ref.WORKING_DAYS; // expected simulations
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Calculator className="h-6 w-6" /> Simulador de Projeção
          </h1>
          <p className="text-muted-foreground mt-1">
            Simule cenários de ganho e performance.
            {isPartner && (
              <span className="inline-flex items-center gap-1 ml-2 text-amber-600">
                <Lock className="h-3 w-3" /> Alguns parâmetros estratégicos são ocultos para este perfil.
              </span>
            )}
          </p>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-foreground">
              <strong>💡 Como usar:</strong> Ajuste os parâmetros para simular diferentes cenários. 
              O SEH considera <strong>Volume de Simulações ({(weights.volume * 100).toFixed(0)}%)</strong> e <strong>Conversão ({(weights.conversion * 100).toFixed(0)}%)</strong>.
              {isPartner && ' Você pode editar: quantidade de clínicas, simulações/mês e ticket médio.'}
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                Parâmetros de Simulação
              </CardTitle>
              <CardDescription>
                {isPartner 
                  ? 'Ajuste os campos editáveis para simular cenários operacionais.'
                  : 'Todos os parâmetros estão disponíveis para simulação completa.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    Clínicas Vinculadas
                    <Tooltip>
                      <TooltipTrigger><Info className="h-3 w-3" /></TooltipTrigger>
                      <TooltipContent>Quantidade total de clínicas vinculadas ao partner</TooltipContent>
                    </Tooltip>
                  </label>
                  <Input type="number" value={clinics} onChange={e => setClinics(Number(e.target.value))} min={0} />
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    Simulações/Mês
                    <Tooltip>
                      <TooltipTrigger><Info className="h-3 w-3" /></TooltipTrigger>
                      <TooltipContent>Volume mensal de simulações (ref: {ref.SIMULATIONS_PER_DAY} por clínica/dia × {ref.WORKING_DAYS} dias úteis)</TooltipContent>
                    </Tooltip>
                  </label>
                  <Input type="number" value={consultationsMonth} onChange={e => setConsultationsMonth(Number(e.target.value))} min={0} />
                </div>

                {!isPartner ? (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      Taxa Aprovação (%)
                      <Tooltip>
                        <TooltipTrigger><Info className="h-3 w-3" /></TooltipTrigger>
                        <TooltipContent>Percentual de simulações que viram propostas aprovadas (ref: {ref.APPROVAL_RATE * 100}%)</TooltipContent>
                      </Tooltip>
                    </label>
                    <Input type="number" value={approvalRate} onChange={e => setApprovalRate(Number(e.target.value))} min={0} max={100} />
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-3 rounded-lg bg-muted/50 text-muted-foreground text-xs">
                    <EyeOff className="h-3 w-3 mr-1" /> Parâmetro restrito
                  </div>
                )}

                {!isPartner ? (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      Taxa Pagamento (%)
                      <Tooltip>
                        <TooltipTrigger><Info className="h-3 w-3" /></TooltipTrigger>
                        <TooltipContent>Percentual de aprovados que se tornam pagos (ref: {ref.PAID_RATE * 100}%)</TooltipContent>
                      </Tooltip>
                    </label>
                    <Input type="number" value={paidRate} onChange={e => setPaidRate(Number(e.target.value))} min={0} max={100} />
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-3 rounded-lg bg-muted/50 text-muted-foreground text-xs">
                    <EyeOff className="h-3 w-3 mr-1" /> Parâmetro restrito
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    Ticket Médio (R$)
                    <Tooltip>
                      <TooltipTrigger><Info className="h-3 w-3" /></TooltipTrigger>
                      <TooltipContent>Valor médio por contrato pago (ref: R$ {formatCurrency(ref.AVG_TICKET)})</TooltipContent>
                    </Tooltip>
                  </label>
                  <Input type="number" value={avgTicket} onChange={e => setAvgTicket(Number(e.target.value))} min={0} />
                </div>
              </div>

              {isPartner && (
                <p className="text-xs text-muted-foreground p-2 bg-muted/50 rounded-lg">
                  🔒 Os campos <strong>taxa de aprovação e pagamento</strong> são parâmetros estratégicos e não estão disponíveis para edição neste perfil. Valores padrão do sistema são utilizados.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Results Panel */}
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Target className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Score SEH Projetado</p>
                      <p className="text-3xl font-bold">{sehScore.toFixed(1)}</p>
                    </div>
                  </div>
                  <Badge className={TYPE_COLORS[level === 'ELITE' || level === 'OURO' ? 'MASTER' : 'PARTNER']}>{level}</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      Pilar Volume ({(weights.volume * 100).toFixed(0)}%)
                      <Tooltip><TooltipTrigger><Info className="h-3 w-3" /></TooltipTrigger><TooltipContent>Simulações realizadas vs meta ({metaSimulacoes}/mês)</TooltipContent></Tooltip>
                    </span>
                    <span className="font-medium">{pilarVolume.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      Pilar Conversão ({(weights.conversion * 100).toFixed(0)}%)
                      <Tooltip><TooltipTrigger><Info className="h-3 w-3" /></TooltipTrigger><TooltipContent>Média entre taxa de aprovação e taxa de pagamento</TooltipContent></Tooltip>
                    </span>
                    <span className="font-medium">{pilarConversion.toFixed(1)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <DollarSign className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Projeção Financeira</p>
                    <p className="text-xs text-muted-foreground">Taxa de bonificação direta: {(rates.direct * 100).toFixed(1)}%</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                    <span className="text-sm">Simulações/Mês</span>
                    <span className="font-bold">{consultationsMonth}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                    <span className="text-sm">Propostas Aprovadas</span>
                    <span className="font-bold">{approvedContracts}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                    <span className="text-sm">Contratos Pagos/Mês</span>
                    <span className="font-bold">{paidContracts}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                    <span className="text-sm">Valor Pago/Mês</span>
                    <span className="font-bold">R$ {formatCurrency(totalPaidValue)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <span className="text-sm font-medium">Bonificação Direta/Mês</span>
                    <span className="font-bold text-green-600">R$ {formatCurrency(directCommission)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <span className="text-sm font-medium">Projeção Anual</span>
                    <span className="font-bold text-green-600 text-lg">R$ {formatCurrency(yearlyProjection)}</span>
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
