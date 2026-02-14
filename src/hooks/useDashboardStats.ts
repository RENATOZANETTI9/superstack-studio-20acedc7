import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { ContractStatus } from '@/types/contracts';

export interface DashboardStats {
  // Consultas (Buscar Crédito)
  totalConsultas: number;
  aprovadas: number;
  recusadas: number;
  taxaConversao: number;

  // Créditos Aprovados (Pipeline)
  aguardandoAssinatura: number;
  pendenciasGerais: number;
  creditosPagos: number;
  creditosExpirados: number;
  creditosCancelados: number;

  // Valores
  valorTotalLiberado: number;
  valorTotalPago: number;
  ticketMedio: number;

  // Marketing Triggers
  totalGatilhos: number;
  rcsEnviados: number;
  emailsEnviados: number;
  ligacoesIA: number;
  gatilhosRestantes: number;

  // History interactions
  totalInteracoes: number;
  interacoesPorTipo: Record<string, number>;
}

export interface ContractsByMonth {
  name: string;
  aprovados: number;
  pagos: number;
  cancelados: number;
}

export interface MarketingByType {
  name: string;
  rcs: number;
  email: number;
  ligacoes: number;
}

export function useDashboardStats() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [contractsRes, historyRes] = await Promise.all([
      supabase.from('contracts').select('*').order('created_at', { ascending: false }),
      supabase.from('contract_history').select('*').order('date', { ascending: false }),
    ]);

    if (contractsRes.data) setContracts(contractsRes.data);
    if (historyRes.data) setHistory(historyRes.data);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

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

    // Marketing - count history interactions by type
    const rcsEnviados = history.filter(h => h.type === 'RCS' || h.type === 'Mensagem').length;
    const emailsEnviados = history.filter(h => h.type === 'E-mail').length;
    const ligacoesIA = history.filter(h => h.type === 'Ligação').length;
    const totalGatilhos = rcsEnviados + emailsEnviados + ligacoesIA;

    // Gatilhos restantes (simulado - 50 por mês por padrão)
    const gatilhosRestantes = Math.max(0, 50 - totalGatilhos);

    const interacoesPorTipo: Record<string, number> = {};
    history.forEach(h => {
      interacoesPorTipo[h.type] = (interacoesPorTipo[h.type] || 0) + 1;
    });

    return {
      totalConsultas,
      aprovadas,
      recusadas,
      taxaConversao,
      aguardandoAssinatura,
      pendenciasGerais,
      creditosPagos,
      creditosExpirados,
      creditosCancelados,
      valorTotalLiberado,
      valorTotalPago,
      ticketMedio,
      totalGatilhos,
      rcsEnviados,
      emailsEnviados,
      ligacoesIA,
      gatilhosRestantes,
      totalInteracoes: history.length,
      interacoesPorTipo,
    };
  }, [contracts, history]);

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
    refresh: fetchData,
  };
}
