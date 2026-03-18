import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ClinicSimulationAnalysis from '@/components/clinics/ClinicSimulationAnalysis';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const PartnersClinicSimulations = () => {
  const { user, role } = useAuth();
  const [partnerId, setPartnerId] = useState<string | undefined>();
  const [isMaster, setIsMaster] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data } = await supabase.from('partners').select('id, type').eq('user_id', user.id).maybeSingle();
      if (data) {
        setPartnerId(data.id);
        setIsMaster(data.type === 'MASTER');
      }
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Simulações Clínicas</h1>
          <p className="text-muted-foreground">Acompanhe o volume e tendência de simulações das suas clínicas</p>
        </div>
        <ClinicSimulationAnalysis
          partnerId={!isMaster ? partnerId : undefined}
          masterPartnerId={isMaster ? partnerId : undefined}
        />
      </div>
    </DashboardLayout>
  );
};

export default PartnersClinicSimulations;
