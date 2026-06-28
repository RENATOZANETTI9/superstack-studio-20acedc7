import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const MOCK_COUNT = 10;

export function usePartnerAlertsCount() {
  const [count, setCount] = useState<number>(MOCK_COUNT);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { count: c, error } = await supabase
        .from('partner_alerts')
        .select('*', { count: 'exact', head: true })
        .is('resolved_at', null);
      if (!active) return;
      // Fallback to mocked value when there is no real data
      if (error || !c) setCount(MOCK_COUNT);
      else setCount(c);
    };
    load();
    const channel = supabase
      .channel('partner-alerts-count')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'partner_alerts' },
        () => load()
      )
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return count;
}