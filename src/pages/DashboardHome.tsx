import { useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardStats from '@/components/dashboard/DashboardStats';
import DashboardCharts from '@/components/dashboard/DashboardCharts';

const DashboardHome = () => {
  const [stats] = useState({
    consultas: 1234,
    aprovadas: 856,
    recusadas: 298,
    rcsEnviados: 2451,
    emailsEnviados: 1872,
    ligacoesRealizadas: 943,
  });

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do sistema e resultados das suas consultas
          </p>
        </div>

        {/* Stats */}
        <DashboardStats stats={stats} />

        {/* Charts Section */}
        <div>
          <h2 className="mb-4 text-xl font-bold text-foreground">Análise de Desempenho</h2>
          <DashboardCharts />
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default DashboardHome;
