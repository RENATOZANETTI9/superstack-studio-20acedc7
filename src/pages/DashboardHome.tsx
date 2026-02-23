import { useCallback } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardStats from '@/components/dashboard/DashboardStats';
import DashboardCharts from '@/components/dashboard/DashboardCharts';

import { useDashboardStats, PeriodFilter } from '@/hooks/useDashboardStats';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import PullToRefreshIndicator from '@/components/dashboard/PullToRefreshIndicator';

const periodLabels: Record<PeriodFilter, string> = {
  hoje: 'Hoje',
  semana: 'Semana',
  mes: 'Mês',
  ano: 'Ano',
  total: 'Total',
};

const DashboardHome = () => {
  const { stats, contractsByMonth, pipelineDistribution, marketingDistribution, loading, refresh, period, setPeriod } = useDashboardStats();
  const isMobile = useIsMobile();

  const handleRefresh = useCallback(async () => {
    await refresh();
  }, [refresh]);

  const { containerRef, isRefreshing, pullIndicator, touchHandlers } = usePullToRefresh({
    onRefresh: handleRefresh,
    enabled: isMobile,
  });

  return (
    <DashboardLayout>
      <div ref={containerRef} {...touchHandlers}>
        {isMobile && <PullToRefreshIndicator pullIndicator={pullIndicator} isRefreshing={isRefreshing} />}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn("space-y-6 sm:space-y-8", isMobile && "mt-14")}
        >
        {/* Header */}
        <div className="space-y-3">
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
              className="shrink-0 h-8 w-8 p-0 sm:h-7 sm:w-auto sm:px-3"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            </Button>
          </div>
          {/* Period Filter - scrollable on mobile */}
          <div className="flex gap-1 rounded-lg bg-muted/50 p-1 overflow-x-auto scrollbar-hide -mx-1 px-1">
            {(Object.keys(periodLabels) as PeriodFilter[]).map((p) => (
              <Button
                key={p}
                variant={period === p ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPeriod(p)}
                className={cn(
                  'h-8 px-3 text-xs transition-all shrink-0 touch-target',
                  period === p
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {periodLabels[p]}
              </Button>
            ))}
          </div>
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

        
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardHome;

