import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Calculator, Target, DollarSign, Info, Lock, EyeOff } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { isAdminRole, isPartnerRole, LEVEL_COLORS, PARTNER_RULES, formatCurrency } from '@/lib/partner-rules';

const PartnersSimulator = () => {
  const { role } = useAuth();
  const isAdmin = isAdminRole(role as any);
  const isPartner = isPartnerRole(role as any);

  const [clinics, setClinics] = useState(5);
  const [activationRate, setActivationRate] = useState(80);
  const [consultationsMonth, setConsultationsMonth] = useState(50);
  const [approvalRate, setApprovalRate] = useState(60);
  const [paidRate, setPaidRate] = useState(70);
  const [avgTicket, setAvgTicket] = useState(5000);
  const [weights, setWeights] = useState(PARTNER_RULES.SEH_WEIGHTS);
  const [rates, setRates] = useState({ direct: PARTNER_RULES.COMMISSION_RATE_DIRECT, override: PARTNER_RULES.COMMISSION_RATE_OVERRIDE });

  useEffect(() => { loadConfig(); }, []);

  const loadConfig = async () => {
    const { data: sehConfig } = await supabase
      .from('partner_system_config')
      .select('config_value')
      .eq('config_key', 'seh_weights')
      .single();
    if (sehConfig?.config_value) {
      const w = sehConfig.config_value as any;
      setWeights({ activation: w.activation || 0.30, volume: w.volume || 0.35, conversion: w.conversion || 0.35 });
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

  const activeClinics = Math.round(clinics * (activationRate / 100));
  const approvedContracts = Math.round(consultationsMonth * (approvalRate / 100));
  const paidContracts = Math.round(approvedContracts * (paidRate / 100));
  const totalPaidValue = paidContracts * avgTicket;

  const pilarActivation = Math.min(activationRate, 100);
  const pilarVolume = Math.min((consultationsMonth / 100) * 100, 100);
  const pilarConversion = (approvalRate * 0.5 + paidRate * 0.5);
  const seh = (pilarActivation * weights.activation) + (pilarVolume * weights.volume) + (pilarConversion * weights.conversion);
  const sehScore = Math.min(Math.max(seh, 0), 100);

  let level = 'BRONZE';
  if (sehScore >= 85) level = 'ELITE';
  else if (sehScore >= 70) level = 'OURO';
  else if (sehScore >= 50) level = 'PRATA';

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

        {/* Help context */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-foreground">
              <strong>💡 Como usar:</strong> Ajuste os parâmetros à esquerda para simular diferentes cenários. 
              Os resultados de SEH e projeção financeira são calculados em tempo real.
              {isPartner && ' Você pode editar: quantidade de clínicas, consultas por mês e ticket médio.'}
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
                  ? 'Ajuste os campos editáveis abaixo para simular diferentes cenários operacionais.'
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

                {/* Hidden for partner/master_partner */}
                {!isPartner ? (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      Taxa de Ativação (%)
                      <Tooltip>
                        <TooltipTrigger><Info className="h-3 w-3" /></TooltipTrigger>
                        <TooltipContent>Percentual de clínicas que se mantêm ativas</TooltipContent>
                      </Tooltip>
                    </label>
                    <Input type="number" value={activationRate} onChange={e => setActivationRate(Number(e.target.value))} min={0} max={100} />
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-3 rounded-lg bg-muted/50 text-muted-foreground text-xs">
                    <EyeOff className="h-3 w-3 mr-1" /> Parâmetro restrito
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    Consultas/Mês
                    <Tooltip>
                      <TooltipTrigger><Info className="h-3 w-3" /></TooltipTrigger>
                      <TooltipContent>Volume mensal estimado de consultas geradas</TooltipContent>
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
                        <TooltipContent>Percentual de consultas que se tornam aprovadas</TooltipContent>
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
                        <TooltipContent>Percentual de aprovados que se tornam pagos</TooltipContent>
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
                      <TooltipContent>Valor médio por contrato pago</TooltipContent>
                    </Tooltip>
                  </label>
                  <Input type="number" value={avgTicket} onChange={e => setAvgTicket(Number(e.target.value))} min={0} />
                </div>
              </div>

              {isPartner && (
                <p className="text-xs text-muted-foreground p-2 bg-muted/50 rounded-lg">
                  🔒 Os campos <strong>taxa de ativação, aprovação e pagamento</strong> são parâmetros estratégicos e não estão disponíveis para edição neste perfil. Valores padrão do sistema são utilizados na simulação.
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
                  <Badge className={LEVEL_COLORS[level]}>{level}</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      Pilar Ativação ({(weights.activation * 100).toFixed(0)}%)
                      <Tooltip><TooltipTrigger><Info className="h-3 w-3" /></TooltipTrigger><TooltipContent>% de clínicas que permanecem ativas</TooltipContent></Tooltip>
                    </span>
                    <span className="font-medium">{pilarActivation.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      Pilar Volume ({(weights.volume * 100).toFixed(0)}%)
                      <Tooltip><TooltipTrigger><Info className="h-3 w-3" /></TooltipTrigger><TooltipContent>Consultas geradas por mês (base 100)</TooltipContent></Tooltip>
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
                    <p className="text-xs text-muted-foreground">Baseado na taxa de bonificação direta de {(rates.direct * 100).toFixed(1)}%</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                    <span className="text-sm">Clínicas Ativas</span>
                    <span className="font-bold">{activeClinics}</span>
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
