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
      const { error } = await supabase
        .from('partner_system_config')
        .update({ config_value: value, updated_by: uid, updated_at: new Date().toISOString() })
        .eq('config_key', configKey);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['system-config', vars.configKey] });
      qc.invalidateQueries({ queryKey: ['system-config-full', vars.configKey] });
    },
  });
}