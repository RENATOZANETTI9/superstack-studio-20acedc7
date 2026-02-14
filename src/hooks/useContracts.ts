import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Contract, ContractHistoryItem, ScheduledReturn, ContractStatus } from '@/types/contracts';

export function useContracts() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContracts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar contratos');
      console.error(error);
    } else {
      setContracts((data || []).map(row => ({
        ...row,
        contract_status: row.contract_status as ContractStatus,
      })));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchContracts(); }, [fetchContracts]);

  const updateContract = async (id: string, updates: Partial<Contract>) => {
    const { error } = await supabase
      .from('contracts')
      .update(updates)
      .eq('id', id);
    if (error) {
      toast.error('Erro ao atualizar contrato');
      console.error(error);
      return false;
    }
    await fetchContracts();
    return true;
  };

  const regenerateContract = async (contractId: string) => {
    const success = await updateContract(contractId, {
      contract_status: 'AGUARDANDO_ASSINATURA' as ContractStatus,
      signature_link: `https://assinatura.exemplo.com/${contractId}-regenerated-${Date.now()}`,
      link_generated_at: new Date().toISOString(),
      expired_at: undefined,
    } as any);
    if (success) toast.success('Crédito regenerado com sucesso!');
    return success;
  };

  return { contracts, loading, fetchContracts, updateContract, regenerateContract, setContracts };
}

export function useContractHistory(contractId: string | undefined) {
  const { user } = useAuth();
  const [history, setHistory] = useState<ContractHistoryItem[]>([]);
  const [scheduledReturns, setScheduledReturns] = useState<ScheduledReturn[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!contractId || !user) return;
    setLoading(true);

    const [histRes, retRes] = await Promise.all([
      supabase
        .from('contract_history')
        .select('*')
        .eq('contract_id', contractId)
        .order('date', { ascending: false }),
      supabase
        .from('scheduled_returns')
        .select('*')
        .eq('contract_id', contractId)
        .order('created_at', { ascending: false }),
    ]);

    if (histRes.data) setHistory(histRes.data as ContractHistoryItem[]);
    if (retRes.data) setScheduledReturns(retRes.data as ScheduledReturn[]);
    setLoading(false);
  }, [contractId, user]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const addHistoryItem = async (item: Omit<ContractHistoryItem, 'id' | 'created_at'>) => {
    if (!user) return false;
    const { error } = await supabase.from('contract_history').insert({
      contract_id: item.contract_id,
      date: item.date,
      user_name: item.user_name,
      type: item.type,
      status: item.status,
      observation: item.observation,
      user_id: user.id,
    });
    if (error) {
      toast.error('Erro ao salvar registro');
      console.error(error);
      return false;
    }
    await fetchHistory();
    return true;
  };

  const addScheduledReturn = async (ret: { contract_id: string; date: string; time: string }) => {
    if (!user) return false;
    const { error } = await supabase.from('scheduled_returns').insert({
      ...ret,
      user_id: user.id,
    });
    if (error) {
      toast.error('Erro ao agendar retorno');
      console.error(error);
      return false;
    }
    await fetchHistory();
    return true;
  };

  const completeReturn = async (returnId: string) => {
    const { error } = await supabase
      .from('scheduled_returns')
      .update({ completed: true })
      .eq('id', returnId);
    if (error) {
      toast.error('Erro ao atualizar retorno');
      return false;
    }
    await fetchHistory();
    return true;
  };

  return { history, scheduledReturns, loading, addHistoryItem, addScheduledReturn, completeReturn, fetchHistory };
}
