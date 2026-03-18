import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ClinicSimulationAnalysis from '@/components/clinics/ClinicSimulationAnalysis';

const Clinicas = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clínicas</h1>
          <p className="text-muted-foreground">Monitoramento de volume de simulações e tendências das clínicas</p>
        </div>
        <ClinicSimulationAnalysis />
      </div>
    </DashboardLayout>
  );
};

export default Clinicas;
