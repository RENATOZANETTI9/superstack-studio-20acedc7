import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Calculator, TrendingUp, DollarSign, Target } from 'lucide-react';

const PartnersSimulator = () => {
  const [clinics, setClinics] = useState(5);
  const [activationRate, setActivationRate] = useState(80);
  const [consultationsMonth, setConsultationsMonth] = useState(50);
  const [approvalRate, setApprovalRate] = useState(60);
  const [paidRate, setPaidRate] = useState(70);
  const [avgTicket, setAvgTicket] = useState(5000);
  const [weights, setWeights] = useState({ activation: 0.30, volume: 0.35, conversion: 0.35 });
  const [rates, setRates] = useState({ direct: 0.016, override: 0.002 });

  useEffect(() => {
    loadConfig();
  }, []);

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

  // Calculations
  const activeClinics = Math.round(clinics * (activationRate / 100));
  const approvedContracts = Math.round(consultationsMonth * (approvalRate / 100));
  const paidContracts = Math.round(approvedContracts * (paidRate / 100));
  const totalPaidValue = paidContracts * avgTicket;

  // SEH
  const pilarActivation = Math.min(activationRate, 100);
  const pilarVolume = Math.min((consultationsMonth / 100) * 100, 100);
  const pilarConversion = (approvalRate * 0.5 + paidRate * 0.5);
  const seh = (pilarActivation * weights.activation) + (pilarVolume * weights.volume) + (pilarConversion * weights.conversion);
  const sehScore = Math.min(Math.max(seh, 0), 100);

  let level = 'BRONZE';
  if (sehScore >= 85) level = 'ELITE';
  else if (sehScore >= 70) level = 'OURO';
  else if (sehScore >= 50) level = 'PRATA';

  const levelColors: Record<string, string> = {
    BRONZE: 'bg-amber-700 text-white',
    PRATA: 'bg-gray-400 text-white',
    OURO: 'bg-yellow-500 text-white',
    ELITE: 'bg-purple-600 text-white',
  };

  // Commissions
  const directCommission = totalPaidValue * rates.direct;
  const monthlyProjection = directCommission;
  const yearlyProjection = monthlyProjection * 12;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Simulador de Projeção</h1>
          <p className="text-muted-foreground">Simule cenários de ganho e performance do Partner</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                Parâmetros de Simulação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Clínicas Vinculadas</label>
                  <Input type="number" value={clinics} onChange={e => setClinics(Number(e.target.value))} min={0} />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Taxa de Ativação (%)</label>
                  <Input type="number" value={activationRate} onChange={e => setActivationRate(Number(e.target.value))} min={0} max={100} />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Consultas/Mês</label>
                  <Input type="number" value={consultationsMonth} onChange={e => setConsultationsMonth(Number(e.target.value))} min={0} />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Taxa Aprovação (%)</label>
                  <Input type="number" value={approvalRate} onChange={e => setApprovalRate(Number(e.target.value))} min={0} max={100} />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Taxa Pagamento (%)</label>
                  <Input type="number" value={paidRate} onChange={e => setPaidRate(Number(e.target.value))} min={0} max={100} />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Ticket Médio (R$)</label>
                  <Input type="number" value={avgTicket} onChange={e => setAvgTicket(Number(e.target.value))} min={0} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Panel */}
          <div className="space-y-4">
            {/* SEH Score Card */}
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
                  <Badge className={levelColors[level]}>{level}</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pilar Ativação ({(weights.activation * 100).toFixed(0)}%)</span>
                    <span className="font-medium">{pilarActivation.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pilar Volume ({(weights.volume * 100).toFixed(0)}%)</span>
                    <span className="font-medium">{pilarVolume.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pilar Conversão ({(weights.conversion * 100).toFixed(0)}%)</span>
                    <span className="font-medium">{pilarConversion.toFixed(1)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Projection */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <DollarSign className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Projeção Financeira</p>
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
                    <span className="font-bold">R$ {totalPaidValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <span className="text-sm font-medium">Bonificação Direta/Mês</span>
                    <span className="font-bold text-green-600">R$ {directCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <span className="text-sm font-medium">Projeção Anual</span>
                    <span className="font-bold text-green-600 text-lg">R$ {yearlyProjection.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
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
