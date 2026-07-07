import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SystemConfigRow {
  config_value: any;
  updated_at: string;
  updated_by: string | null;
}

export function useSystemConfig(configKey: string) {
  return useQuery({
    queryKey: ['system-config', configKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_system_config')
        .select('config_value')
        .eq('config_key', configKey)
        .eq('is_active', true)
        .single();
      if (error) throw error;
      return data?.config_value;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetch full row (value + metadata) for the admin editor. */
export function useSystemConfigFull(configKey: string) {
  return useQuery<SystemConfigRow | null>({
    queryKey: ['system-config-full', configKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_system_config')
        .select('config_value, updated_at, updated_by')
        .eq('config_key', configKey)
        .single();
      if (error) throw error;
      return data as SystemConfigRow;
    },
  });
}

export function useUpdateSystemConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ configKey, value }: { configKey: string; value: any }) => {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes?.user?.id ?? null;
      // Lê valor atual para gravar em audit log.
      const { data: current } = await supabase
        .from('partner_system_config')
        .select('config_value')
        .eq('config_key', configKey)
        .maybeSingle();
      const oldValue = (current as any)?.config_value ?? null;
      const { error } = await supabase
        .from('partner_system_config')
        .update({ config_value: value, updated_by: uid, updated_at: new Date().toISOString() })
        .eq('config_key', configKey);
      if (error) throw error;
      // Audit log — não bloqueia o fluxo em caso de falha.
      try {
        await supabase.from('system_config_change_log').insert({
          config_key: configKey,
          old_value: oldValue,
          new_value: value,
          changed_by: uid,
        });
      } catch (e) {
        console.warn('[audit] falha ao registrar system_config_change_log', e);
      }
    },
    onSuccess: () => {
      // Invalidação ampla: força refetch imediato em qualquer componente
      // que consuma useSystemConfig, ignorando o staleTime de 5min.
      qc.invalidateQueries({ queryKey: ['system-config'] });
      qc.invalidateQueries({ queryKey: ['system-config-full'] });
    },
  });
}