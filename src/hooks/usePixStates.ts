import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Proposal, PixState, PixKeyType } from '@/components/dashboard/ProposalPipeline';
import { toast } from 'sonner';

type Row = {
  proposal_id: string;
  pix_key_type: PixKeyType | null;
  pix_key_value: string | null;
  pix_phase: 'idle' | 'generating' | 'ready' | 'analyzing' | 'error';
  biometric_link: string | null;
};

export interface PixStateExtended extends PixState {
  value?: string;
  link?: string;
  error?: string;
}

export function usePixStates(proposals: Proposal[]) {
  const [pixStateMap, setPixStateMap] = useState<Record<string, PixStateExtended>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);

  // Load persisted states
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        setLoaded(true);
        return;
      }
      const { data, error } = await supabase
        .from('proposal_pix_states')
        .select('proposal_id, pix_key_type, pix_key_value, pix_phase, biometric_link')
        .eq('user_id', auth.user.id);
      if (cancelled) return;
      if (error) {
        console.error('Failed to load pix states', error);
      } else if (data) {
        const map: Record<string, PixStateExtended> = {};
        (data as Row[]).forEach((r) => {
          map[r.proposal_id] = {
            type: r.pix_key_type ?? undefined,
            phase: r.pix_phase,
            value: r.pix_key_value ?? undefined,
            link: r.biometric_link ?? undefined,
          };
        });
        setPixStateMap(map);
      }
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(
    async (proposal: Proposal, patch: Partial<Row>) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const row = {
        user_id: auth.user.id,
        proposal_id: proposal.id,
        patient_name: proposal.name,
        cpf: proposal.cpf,
        value: proposal.value ?? null,
        proposal_status: proposal.status,
        ...patch,
      };
      const { error } = await supabase
        .from('proposal_pix_states')
        .upsert(row, { onConflict: 'user_id,proposal_id' });
      if (error) console.error('Failed to persist pix state', error);
    },
    []
  );

  const writeAudit = useCallback(
    async (
      proposal: Proposal,
      params: {
        from_phase?: string;
        to_phase: string;
        pix_key_type?: string | null;
        pix_key_value?: string | null;
        biometric_link?: string | null;
        error_message?: string | null;
      }
    ) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      await supabase.from('proposal_pix_audit').insert({
        user_id: auth.user.id,
        proposal_id: proposal.id,
        actor_id: auth.user.id,
        actor_email: auth.user.email ?? null,
        ...params,
      });
    },
    []
  );

  const submitPixKey = useCallback(
    async (proposal: Proposal, type: PixKeyType, value: string) => {
      setLoadingMap((m) => ({ ...m, [proposal.id]: true }));
      const prevPhase = pixStateMap[proposal.id]?.phase ?? 'idle';
      setPixStateMap((prev) => ({
        ...prev,
        [proposal.id]: { type, value, phase: 'generating' },
      }));
      await persist(proposal, {
        pix_key_type: type,
        pix_key_value: value,
        pix_phase: 'generating',
      });
      await writeAudit(proposal, {
        from_phase: prevPhase,
        to_phase: 'generating',
        pix_key_type: type,
        pix_key_value: value,
      });

      if (type === 'cpf') {
        toast.info('Obrigado, aguarde. Estamos gerando o link de assinatura/biometria.');
        setTimeout(async () => {
          try {
            const link = `https://biometria.helpude.com/sign/${proposal.id}`;
            setPixStateMap((prev) => ({
              ...prev,
              [proposal.id]: { type, value, phase: 'ready', link },
            }));
            await persist(proposal, {
              pix_key_type: type,
              pix_key_value: value,
              pix_phase: 'ready',
              biometric_link: link,
            });
            await writeAudit(proposal, {
              from_phase: 'generating',
              to_phase: 'ready',
              pix_key_type: type,
              pix_key_value: value,
              biometric_link: link,
            });
            toast.success('Link de biometria pronto para assinatura.');
          } catch (e: any) {
            const msg = e?.message ?? 'Falha ao gerar o link de biometria.';
            setPixStateMap((prev) => ({
              ...prev,
              [proposal.id]: { type, value, phase: 'error', error: msg },
            }));
            await persist(proposal, { pix_phase: 'error' });
            await writeAudit(proposal, {
              from_phase: 'generating',
              to_phase: 'error',
              pix_key_type: type,
              pix_key_value: value,
              error_message: msg,
            });
            toast.error(msg);
          } finally {
            setLoadingMap((m) => ({ ...m, [proposal.id]: false }));
          }
        }, 1800);
      } else {
        setPixStateMap((prev) => ({
          ...prev,
          [proposal.id]: { type, value, phase: 'analyzing' },
        }));
        await persist(proposal, {
          pix_key_type: type,
          pix_key_value: value,
          pix_phase: 'analyzing',
        });
        await writeAudit(proposal, {
          from_phase: 'generating',
          to_phase: 'analyzing',
          pix_key_type: type,
          pix_key_value: value,
        });
        toast.info(
          'Obrigado, aguarde. A proposta foi enviada para análise e retornará automaticamente quando estiver pronta para assinatura.'
        );
        setTimeout(async () => {
          try {
            const link = `https://biometria.helpude.com/sign/${proposal.id}`;
            setPixStateMap((prev) => ({
              ...prev,
              [proposal.id]: { type, value, phase: 'ready', link },
            }));
            await persist(proposal, {
              pix_key_type: type,
              pix_key_value: value,
              pix_phase: 'ready',
              biometric_link: link,
            });
            await writeAudit(proposal, {
              from_phase: 'analyzing',
              to_phase: 'ready',
              pix_key_type: type,
              pix_key_value: value,
              biometric_link: link,
            });
            toast.success('Proposta retornou da análise: pronta para assinatura.');
          } catch (e: any) {
            const msg = e?.message ?? 'Falha ao concluir a análise.';
            setPixStateMap((prev) => ({
              ...prev,
              [proposal.id]: { type, value, phase: 'error', error: msg },
            }));
            await persist(proposal, { pix_phase: 'error' });
            await writeAudit(proposal, {
              from_phase: 'analyzing',
              to_phase: 'error',
              pix_key_type: type,
              pix_key_value: value,
              error_message: msg,
            });
            toast.error(msg);
          } finally {
            setLoadingMap((m) => ({ ...m, [proposal.id]: false }));
          }
        }, 5000);
      }
    },
    [persist, writeAudit, pixStateMap]
  );

  const retry = useCallback(
    async (proposal: Proposal) => {
      const st = pixStateMap[proposal.id];
      if (!st?.type || !st.value) {
        toast.error('Informe novamente a chave Pix para tentar de novo.');
        return;
      }
      await submitPixKey(proposal, st.type, st.value);
    },
    [pixStateMap, submitPixKey]
  );

  const resetPix = useCallback(
    async (proposal: Proposal) => {
      const prev = pixStateMap[proposal.id]?.phase ?? 'idle';
      setPixStateMap((m) => ({ ...m, [proposal.id]: { phase: 'idle' } }));
      await persist(proposal, {
        pix_key_type: null,
        pix_key_value: null,
        pix_phase: 'idle',
        biometric_link: null,
      });
      await writeAudit(proposal, { from_phase: prev, to_phase: 'idle' });
    },
    [persist, writeAudit, pixStateMap]
  );

  return { pixStateMap, loadingMap, loaded, submitPixKey, retry, resetPix };
}