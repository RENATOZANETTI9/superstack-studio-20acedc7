import { motion } from 'framer-motion';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardStats from '@/components/dashboard/DashboardStats';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import FloatingChatButton from '@/components/FloatingChatButton';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

const DashboardHome = () => {
  const { stats, contractsByMonth, pipelineDistribution, marketingDistribution, loading, refresh } = useDashboardStats();
  const isMobile = useIsMobile();

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("space-y-6 sm:space-y-8", isMobile && "mt-14")}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Visão geral de Buscar Crédito, Créditos Aprovados e Gatilhos de Marketing
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={loading}
            className="shrink-0"
          >
            <RefreshCw className={cn("h-4 w-4 mr-1.5", loading && "animate-spin")} />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
        </div>

        {/* Stats */}
        <DashboardStats stats={stats} loading={loading} />

        {/* Charts Section */}
        <div>
          <h2 className="mb-4 text-lg sm:text-xl font-bold text-foreground">Análise de Desempenho</h2>
          <DashboardCharts
            contractsByMonth={contractsByMonth}
            pipelineDistribution={pipelineDistribution}
            marketingDistribution={marketingDistribution}
            loading={loading}
          />
        </div>

        <FloatingChatButton />
      </motion.div>
    </DashboardLayout>
  );
};

export default DashboardHome;
