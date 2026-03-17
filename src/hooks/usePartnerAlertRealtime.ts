import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function usePartnerAlertRealtime() {
  useEffect(() => {
    const channel = supabase
      .channel('partner-alerts-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'partner_alerts' },
        (payload) => {
          const alert = payload.new as { title: string; severity: string; description?: string };
          const severity = alert.severity;
          const msg = alert.title;

          if (severity === 'CRITICAL') {
            toast.error(`🚨 ${msg}`, { description: alert.description || undefined, duration: 10000 });
          } else if (severity === 'HIGH') {
            toast.warning(`⚠️ ${msg}`, { description: alert.description || undefined, duration: 7000 });
          } else {
            toast.info(`ℹ️ ${msg}`, { description: alert.description || undefined, duration: 5000 });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}
