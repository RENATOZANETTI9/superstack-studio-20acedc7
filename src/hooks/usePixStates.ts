import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Proposal, PixState, PixKeyType } from '@/components/dashboard/ProposalPipeline';
import { toast } from 'sonner';

type Row = {
  proposal_id: string;
  pix_key_type: PixKeyType | null;
  pix_key_value: string | null;
  pix_phase: 'idle' | 'generating' | 'ready' | 'analyzing';
  biometric_link: string | null;
};

export interface PixStateExtended extends PixState {
  value?: string;
  link?: string;
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

  const submitPixKey = useCallback(
    async (proposal: Proposal, type: PixKeyType, value: string) => {
      setLoadingMap((m) => ({ ...m, [proposal.id]: true }));
      setPixStateMap((prev) => ({
        ...prev,
        [proposal.id]: { type, value, phase: 'generating' },
      }));
      await persist(proposal, {
        pix_key_type: type,
        pix_key_value: value,
        pix_phase: 'generating',
      });

      if (type === 'cpf') {
        toast.info('Obrigado, aguarde. Estamos gerando o link de assinatura/biometria.');
        setTimeout(async () => {
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
          setLoadingMap((m) => ({ ...m, [proposal.id]: false }));
          toast.success('Link de biometria pronto para assinatura.');
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
        toast.info(
          'Obrigado, aguarde. A proposta foi enviada para análise e retornará automaticamente quando estiver pronta para assinatura.'
        );
        setTimeout(async () => {
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
          setLoadingMap((m) => ({ ...m, [proposal.id]: false }));
          toast.success('Proposta retornou da análise: pronta para assinatura.');
        }, 5000);
      }
    },
    [persist]
  );

  return { pixStateMap, loadingMap, loaded, submitPixKey };
}