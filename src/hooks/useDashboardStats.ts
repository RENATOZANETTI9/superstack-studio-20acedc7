import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { ContractStatus } from '@/types/contracts';
import { startOfDay, startOfWeek, startOfMonth, startOfYear, isAfter } from 'date-fns';

export type PeriodFilter = 'hoje' | 'semana' | 'mes' | 'ano' | 'total';

export interface DashboardStats {
  totalConsultas: number;
  aprovadas: number;
  recusadas: number;
  taxaConversao: number;
  aguardandoAssinatura: number;
  pendenciasGerais: number;
  creditosPagos: number;
  creditosExpirados: number;
  creditosCancelados: number;
  valorTotalLiberado: number;
  valorTotalPago: number;
  ticketMedio: number;
  totalGatilhos: number;
  rcsEnviados: number;
  emailsEnviados: number;
  ligacoesIA: number;
  gatilhosRestantes: number;
  gatilhosLimite: number;
  totalInteracoes: number;
  interacoesPorTipo: Record<string, number>;
}

export interface ContractsByMonth {
  name: string;
  aprovados: number;
  pagos: number;
  cancelados: number;
}

function getPeriodStart(period: PeriodFilter): Date | null {
  const now = new Date();
  switch (period) {
    case 'hoje': return startOfDay(now);
    case 'semana': return startOfWeek(now, { weekStartsOn: 1 });
    case 'mes': return startOfMonth(now);
    case 'ano': return startOfYear(now);
    case 'total': return null;
  }
}

const GATILHOS_LIMIT = 50;

export function useDashboardStats() {
  const { user } = useAuth();
  const [allContracts, setAllContracts] = useState<any[]>([]);
  const [allHistory, setAllHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodFilter>('total');
  const [alertShown, setAlertShown] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [contractsRes, historyRes] = await Promise.all([
      supabase.from('contracts').select('*').order('created_at', { ascending: false }),
      supabase.from('contract_history').select('*').order('date', { ascending: false }),
    ]);

    if (contractsRes.data) setAllContracts(contractsRes.data);
    if (historyRes.data) setAllHistory(historyRes.data);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Filter by period
  const contracts = useMemo(() => {
    const start = getPeriodStart(period);
    if (!start) return allContracts;
    return allContracts.filter(c => isAfter(new Date(c.created_at), start));
  }, [allContracts, period]);

  const history = useMemo(() => {
    const start = getPeriodStart(period);
    if (!start) return allHistory;
    return allHistory.filter(h => isAfter(new Date(h.date || h.created_at), start));
  }, [allHistory, period]);

  const stats = useMemo<DashboardStats>(() => {
    const totalConsultas = contracts.length;
    const aprovadas = contracts.filter(c => c.proposal_status === 'Aprovada').length;
    const recusadas = contracts.filter(c => c.proposal_status === 'Recusada').length;
    const taxaConversao = totalConsultas > 0 ? Math.round((aprovadas / totalConsultas) * 100) : 0;

    const byStatus = (s: ContractStatus) => contracts.filter(c => c.contract_status === s).length;
    const aguardandoAssinatura = byStatus('AGUARDANDO_ASSINATURA');
    const pendenciasGerais = byStatus('PENDENCIAS_GERAIS');
    const creditosPagos = byStatus('PAGO');
    const creditosExpirados = byStatus('EXPIRADO');
    const creditosCancelados = byStatus('CANCELADO');

    const valorTotalLiberado = contracts.reduce((sum, c) => sum + Number(c.amount_released || 0), 0);
    const pagoContracts = contracts.filter(c => c.contract_status === 'PAGO');
    const valorTotalPago = pagoContracts.reduce((sum, c) => sum + Number(c.amount_released || 0), 0);
    const ticketMedio = totalConsultas > 0 ? Math.round(valorTotalLiberado / totalConsultas) : 0;

    // Marketing - always use ALL history for gatilhos balance (not filtered)
    const allRcs = allHistory.filter(h => h.type === 'RCS' || h.type === 'Mensagem').length;
    const allEmails = allHistory.filter(h => h.type === 'E-mail').length;
    const allLigacoes = allHistory.filter(h => h.type === 'Ligação').length;
    const allTotal = allRcs + allEmails + allLigacoes;

    // Filtered marketing for display
    const rcsEnviados = history.filter(h => h.type === 'RCS' || h.type === 'Mensagem').length;
    const emailsEnviados = history.filter(h => h.type === 'E-mail').length;
    const ligacoesIA = history.filter(h => h.type === 'Ligação').length;
    const totalGatilhos = rcsEnviados + emailsEnviados + ligacoesIA;

    const gatilhosRestantes = Math.max(0, GATILHOS_LIMIT - allTotal);

    const interacoesPorTipo: Record<string, number> = {};
    history.forEach(h => {
      interacoesPorTipo[h.type] = (interacoesPorTipo[h.type] || 0) + 1;
    });

    return {
      totalConsultas, aprovadas, recusadas, taxaConversao,
      aguardandoAssinatura, pendenciasGerais, creditosPagos, creditosExpirados, creditosCancelados,
      valorTotalLiberado, valorTotalPago, ticketMedio,
      totalGatilhos, rcsEnviados, emailsEnviados, ligacoesIA,
      gatilhosRestantes, gatilhosLimite: GATILHOS_LIMIT,
      totalInteracoes: history.length, interacoesPorTipo,
    };
  }, [contracts, history, allHistory]);

  // Alert when gatilhos reach 10% remaining
  useEffect(() => {
    if (alertShown || loading) return;
    const threshold = GATILHOS_LIMIT * 0.1; // 10%
    if (stats.gatilhosRestantes <= threshold && stats.gatilhosRestantes > 0) {
      toast.warning(
        `⚠️ Atenção: Apenas ${stats.gatilhosRestantes} gatilhos de marketing restantes! (${Math.round((stats.gatilhosRestantes / GATILHOS_LIMIT) * 100)}% do limite)`,
        { duration: 8000 }
      );
      setAlertShown(true);
    } else if (stats.gatilhosRestantes === 0 && stats.totalGatilhos > 0) {
      toast.error(
        '🚫 Seus gatilhos de marketing acabaram! Entre em contato para aumentar seu limite.',
        { duration: 10000 }
      );
      setAlertShown(true);
    }
  }, [stats.gatilhosRestantes, stats.totalGatilhos, alertShown, loading]);

  const contractsByMonth = useMemo<ContractsByMonth[]>(() => {
    const months: Record<string, { aprovados: number; pagos: number; cancelados: number }> = {};
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    contracts.forEach(c => {
      const date = new Date(c.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
      if (!months[key]) months[key] = { aprovados: 0, pagos: 0, cancelados: 0 };
      months[key].aprovados++;
      if (c.contract_status === 'PAGO') months[key].pagos++;
      if (c.contract_status === 'CANCELADO') months[key].cancelados++;
    });

    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, data]) => ({
        name: monthNames[parseInt(key.split('-')[1])],
        ...data,
      }));
  }, [contracts]);

  const pipelineDistribution = useMemo(() => [
    { name: 'Aguardando', value: stats.aguardandoAssinatura, color: 'hsl(var(--primary))' },
    { name: 'Pendências', value: stats.pendenciasGerais, color: 'hsl(var(--warning))' },
    { name: 'Pagos', value: stats.creditosPagos, color: 'hsl(var(--success))' },
    { name: 'Expirados', value: stats.creditosExpirados, color: 'hsl(var(--muted-foreground))' },
    { name: 'Cancelados', value: stats.creditosCancelados, color: 'hsl(var(--destructive))' },
  ].filter(d => d.value > 0), [stats]);

  const marketingDistribution = useMemo(() => [
    { name: 'RCS', value: stats.rcsEnviados, color: 'hsl(var(--secondary))' },
    { name: 'Email', value: stats.emailsEnviados, color: 'hsl(var(--primary))' },
    { name: 'Ligações IA', value: stats.ligacoesIA, color: 'hsl(270, 50%, 60%)' },
  ], [stats]);

  return {
    stats,
    contracts,
    history,
    contractsByMonth,
    pipelineDistribution,
    marketingDistribution,
    loading,
    period,
    setPeriod,
    refresh: fetchData,
  };
}
