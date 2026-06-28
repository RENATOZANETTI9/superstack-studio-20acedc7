import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MOCK_ALERTS } from '@/lib/mock-data';

export function usePartnerAlertsCount() {
  const [count, setCount] = useState<number>(MOCK_ALERTS.length);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { count: c, error } = await supabase
        .from('partner_alerts')
        .select('*', { count: 'exact', head: true })
        .is('resolved_at', null);
      if (!active) return;
      if (error || !c) {
        setCount(MOCK_ALERTS.length);
      } else {
        setCount(c);
      }
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