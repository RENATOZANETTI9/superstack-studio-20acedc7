import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { TrendingUp, Zap, PieChartIcon } from 'lucide-react';
import type { ContractsByMonth } from '@/hooks/useDashboardStats';
import { Skeleton } from '@/components/ui/skeleton';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card rounded-lg border border-border/50 p-3 shadow-lg">
        <p className="mb-2 font-semibold text-foreground">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString('pt-BR') : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

interface DashboardChartsProps {
  contractsByMonth: ContractsByMonth[];
  pipelineDistribution: Array<{ name: string; value: number; color: string }>;
  marketingDistribution: Array<{ name: string; value: number; color: string }>;
  loading?: boolean;
}

const DashboardCharts = ({ contractsByMonth, pipelineDistribution, marketingDistribution, loading }: DashboardChartsProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-80 rounded-2xl" />
        ))}
      </div>
    );
  }

  const hasContractData = contractsByMonth.length > 0;
  const hasPipelineData = pipelineDistribution.length > 0;
  const hasMarketingData = marketingDistribution.some(d => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Créditos por Mês */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-6"
        >
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold text-foreground">Créditos por Período</h3>
          </div>
          <div className="h-72">
            {hasContractData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={contractsByMonth}>
                  <defs>
                    <linearGradient id="colorAprovados" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(259, 51%, 56%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(259, 51%, 56%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorPagos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area type="monotone" dataKey="aprovados" name="Aprovados" stroke="hsl(259, 51%, 56%)" fillOpacity={1} fill="url(#colorAprovados)" strokeWidth={2} />
                  <Area type="monotone" dataKey="pagos" name="Pagos" stroke="hsl(142, 76%, 36%)" fillOpacity={1} fill="url(#colorPagos)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">Sem dados de créditos ainda</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Pipeline Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-6"
        >
          <div className="mb-4 flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold text-foreground">Distribuição do Pipeline</h3>
          </div>
          <div className="h-72">
            {hasPipelineData ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pipelineDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, value }) => `${name} (${value})`}
                    labelLine={false}
                  >
                    {pipelineDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [value, 'Quantidade']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">Sem contratos no pipeline</p>
              </div>
            )}
          </div>
          {hasPipelineData && (
            <div className="mt-2 flex flex-wrap justify-center gap-4">
              {pipelineDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Marketing Triggers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-2xl p-6"
        >
          <div className="mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-secondary" />
            <h3 className="text-lg font-bold text-foreground">Gatilhos de Marketing</h3>
          </div>
          <div className="h-72">
            {hasMarketingData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={marketingDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Enviados" radius={[0, 6, 6, 0]}>
                    {marketingDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <Zap className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum gatilho disparado ainda</p>
                  <p className="text-xs text-muted-foreground mt-1">Consulte CPFs em "Buscar Crédito" para gerar gatilhos automáticos</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Marketing Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-2xl p-6"
        >
          <div className="mb-4 flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-secondary" />
            <h3 className="text-lg font-bold text-foreground">Mix de Marketing</h3>
          </div>
          <div className="h-72">
            {hasMarketingData ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={marketingDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {marketingDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [value, 'Disparos']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">Dados insuficientes</p>
              </div>
            )}
          </div>
          {hasMarketingData && (
            <div className="mt-2 flex flex-wrap justify-center gap-4">
              {marketingDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardCharts;
