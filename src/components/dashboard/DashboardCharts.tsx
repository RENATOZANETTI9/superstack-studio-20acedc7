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
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Calendar, TrendingUp } from 'lucide-react';

type PeriodFilter = 'hoje' | 'semana' | 'mes' | 'ano';

// Dados por período
const consultasDataByPeriod: Record<PeriodFilter, Array<{ name: string; consultas: number; aprovadas: number; recusadas: number }>> = {
  hoje: [
    { name: '08h', consultas: 12, aprovadas: 8, recusadas: 4 },
    { name: '10h', consultas: 25, aprovadas: 18, recusadas: 7 },
    { name: '12h', consultas: 35, aprovadas: 25, recusadas: 10 },
    { name: '14h', consultas: 42, aprovadas: 32, recusadas: 10 },
    { name: '16h', consultas: 38, aprovadas: 28, recusadas: 10 },
    { name: '18h', consultas: 28, aprovadas: 20, recusadas: 8 },
  ],
  semana: [
    { name: 'Seg', consultas: 120, aprovadas: 85, recusadas: 35 },
    { name: 'Ter', consultas: 150, aprovadas: 110, recusadas: 40 },
    { name: 'Qua', consultas: 180, aprovadas: 130, recusadas: 50 },
    { name: 'Qui', consultas: 200, aprovadas: 155, recusadas: 45 },
    { name: 'Sex', consultas: 240, aprovadas: 180, recusadas: 60 },
    { name: 'Sáb', consultas: 90, aprovadas: 70, recusadas: 20 },
    { name: 'Dom', consultas: 60, aprovadas: 45, recusadas: 15 },
  ],
  mes: [
    { name: 'Sem 1', consultas: 840, aprovadas: 620, recusadas: 220 },
    { name: 'Sem 2', consultas: 920, aprovadas: 710, recusadas: 210 },
    { name: 'Sem 3', consultas: 1050, aprovadas: 820, recusadas: 230 },
    { name: 'Sem 4', consultas: 1180, aprovadas: 940, recusadas: 240 },
  ],
  ano: [
    { name: 'Jan', consultas: 2400, aprovadas: 1800, recusadas: 600 },
    { name: 'Fev', consultas: 2800, aprovadas: 2100, recusadas: 700 },
    { name: 'Mar', consultas: 3200, aprovadas: 2500, recusadas: 700 },
    { name: 'Abr', consultas: 3600, aprovadas: 2800, recusadas: 800 },
    { name: 'Mai', consultas: 4100, aprovadas: 3200, recusadas: 900 },
    { name: 'Jun', consultas: 4500, aprovadas: 3500, recusadas: 1000 },
    { name: 'Jul', consultas: 5200, aprovadas: 4100, recusadas: 1100 },
    { name: 'Ago', consultas: 5800, aprovadas: 4600, recusadas: 1200 },
    { name: 'Set', consultas: 6100, aprovadas: 4900, recusadas: 1200 },
    { name: 'Out', consultas: 6800, aprovadas: 5500, recusadas: 1300 },
    { name: 'Nov', consultas: 7200, aprovadas: 5800, recusadas: 1400 },
    { name: 'Dez', consultas: 7800, aprovadas: 6300, recusadas: 1500 },
  ],
};

const marketingDataByPeriod: Record<PeriodFilter, Array<{ name: string; rcs: number; email: number; ligacoes: number }>> = {
  hoje: [
    { name: '08h', rcs: 15, email: 12, ligacoes: 5 },
    { name: '10h', rcs: 28, email: 22, ligacoes: 10 },
    { name: '12h', rcs: 35, email: 30, ligacoes: 15 },
    { name: '14h', rcs: 42, email: 38, ligacoes: 20 },
    { name: '16h', rcs: 38, email: 32, ligacoes: 18 },
    { name: '18h', rcs: 25, email: 20, ligacoes: 12 },
  ],
  semana: [
    { name: 'Seg', rcs: 80, email: 70, ligacoes: 35 },
    { name: 'Ter', rcs: 95, email: 82, ligacoes: 42 },
    { name: 'Qua', rcs: 110, email: 95, ligacoes: 50 },
    { name: 'Qui', rcs: 125, email: 108, ligacoes: 58 },
    { name: 'Sex', rcs: 140, email: 120, ligacoes: 65 },
    { name: 'Sáb', rcs: 50, email: 45, ligacoes: 20 },
    { name: 'Dom', rcs: 30, email: 25, ligacoes: 12 },
  ],
  mes: [
    { name: 'Sem 1', rcs: 320, email: 280, ligacoes: 150 },
    { name: 'Sem 2', rcs: 450, email: 390, ligacoes: 210 },
    { name: 'Sem 3', rcs: 520, email: 420, ligacoes: 280 },
    { name: 'Sem 4', rcs: 680, email: 550, ligacoes: 350 },
  ],
  ano: [
    { name: 'Jan', rcs: 1200, email: 1050, ligacoes: 560 },
    { name: 'Fev', rcs: 1400, email: 1220, ligacoes: 650 },
    { name: 'Mar', rcs: 1650, email: 1420, ligacoes: 760 },
    { name: 'Abr', rcs: 1900, email: 1640, ligacoes: 880 },
    { name: 'Mai', rcs: 2200, email: 1900, ligacoes: 1020 },
    { name: 'Jun', rcs: 2500, email: 2150, ligacoes: 1160 },
    { name: 'Jul', rcs: 2850, email: 2450, ligacoes: 1320 },
    { name: 'Ago', rcs: 3200, email: 2750, ligacoes: 1480 },
    { name: 'Set', rcs: 3500, email: 3000, ligacoes: 1620 },
    { name: 'Out', rcs: 3850, email: 3300, ligacoes: 1780 },
    { name: 'Nov', rcs: 4200, email: 3600, ligacoes: 1940 },
    { name: 'Dez', rcs: 4600, email: 3950, ligacoes: 2120 },
  ],
};

const conversaoDataByPeriod: Record<PeriodFilter, Array<{ name: string; value: number; color: string }>> = {
  hoje: [
    { name: 'Aprovadas', value: 62, color: 'hsl(142, 76%, 36%)' },
    { name: 'Recusadas', value: 28, color: 'hsl(0, 84%, 60%)' },
    { name: 'Erro', value: 10, color: 'hsl(38, 92%, 50%)' },
  ],
  semana: [
    { name: 'Aprovadas', value: 65, color: 'hsl(142, 76%, 36%)' },
    { name: 'Recusadas', value: 25, color: 'hsl(0, 84%, 60%)' },
    { name: 'Erro', value: 10, color: 'hsl(38, 92%, 50%)' },
  ],
  mes: [
    { name: 'Aprovadas', value: 68, color: 'hsl(142, 76%, 36%)' },
    { name: 'Recusadas', value: 24, color: 'hsl(0, 84%, 60%)' },
    { name: 'Erro', value: 8, color: 'hsl(38, 92%, 50%)' },
  ],
  ano: [
    { name: 'Aprovadas', value: 72, color: 'hsl(142, 76%, 36%)' },
    { name: 'Recusadas', value: 22, color: 'hsl(0, 84%, 60%)' },
    { name: 'Erro', value: 6, color: 'hsl(38, 92%, 50%)' },
  ],
};

const tendenciaDataByPeriod: Record<PeriodFilter, Array<{ name: string; consultas: number; conversao: number }>> = {
  hoje: [
    { name: '08h', consultas: 12, conversao: 58 },
    { name: '10h', consultas: 25, conversao: 62 },
    { name: '12h', consultas: 35, conversao: 65 },
    { name: '14h', consultas: 42, conversao: 68 },
    { name: '16h', consultas: 38, conversao: 70 },
    { name: '18h', consultas: 28, conversao: 72 },
  ],
  semana: [
    { name: 'Seg', consultas: 120, conversao: 62 },
    { name: 'Ter', consultas: 150, conversao: 65 },
    { name: 'Qua', consultas: 180, conversao: 68 },
    { name: 'Qui', consultas: 200, conversao: 64 },
    { name: 'Sex', consultas: 240, conversao: 70 },
    { name: 'Sáb', consultas: 90, conversao: 72 },
    { name: 'Dom', consultas: 60, conversao: 75 },
  ],
  mes: [
    { name: 'Sem 1', consultas: 840, conversao: 65 },
    { name: 'Sem 2', consultas: 920, conversao: 68 },
    { name: 'Sem 3', consultas: 1050, conversao: 70 },
    { name: 'Sem 4', consultas: 1180, conversao: 72 },
  ],
  ano: [
    { name: 'Jan', consultas: 2400, conversao: 62 },
    { name: 'Fev', consultas: 2800, conversao: 65 },
    { name: 'Mar', consultas: 3200, conversao: 68 },
    { name: 'Abr', consultas: 3600, conversao: 64 },
    { name: 'Mai', consultas: 4100, conversao: 70 },
    { name: 'Jun', consultas: 4500, conversao: 72 },
    { name: 'Jul', consultas: 5200, conversao: 75 },
    { name: 'Ago', consultas: 5800, conversao: 73 },
    { name: 'Set', consultas: 6100, conversao: 76 },
    { name: 'Out', consultas: 6800, conversao: 78 },
    { name: 'Nov', consultas: 7200, conversao: 80 },
    { name: 'Dez', consultas: 7800, conversao: 82 },
  ],
};

const periodLabels: Record<PeriodFilter, string> = {
  hoje: 'Hoje',
  semana: 'Semana',
  mes: 'Mês',
  ano: 'Ano',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card rounded-lg border border-border/50 p-3 shadow-lg">
        <p className="mb-2 font-semibold text-foreground">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value.toLocaleString('pt-BR')}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

interface PeriodFilterButtonsProps {
  selected: PeriodFilter;
  onChange: (period: PeriodFilter) => void;
}

const PeriodFilterButtons = ({ selected, onChange }: PeriodFilterButtonsProps) => (
  <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
    {(Object.keys(periodLabels) as PeriodFilter[]).map((period) => (
      <Button
        key={period}
        variant={selected === period ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onChange(period)}
        className={`h-7 px-3 text-xs transition-all ${
          selected === period
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        {periodLabels[period]}
      </Button>
    ))}
  </div>
);

interface ChartHeaderProps {
  title: string;
  icon?: React.ReactNode;
  period: PeriodFilter;
  onPeriodChange: (period: PeriodFilter) => void;
}

const ChartHeader = ({ title, icon, period, onPeriodChange }: ChartHeaderProps) => (
  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-center gap-2">
      {icon}
      <h3 className="text-lg font-bold text-foreground">{title}</h3>
    </div>
    <PeriodFilterButtons selected={period} onChange={onPeriodChange} />
  </div>
);

interface ConsultasChartProps {
  period: PeriodFilter;
  onPeriodChange: (period: PeriodFilter) => void;
}

const ConsultasChart = ({ period, onPeriodChange }: ConsultasChartProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 }}
    className="glass-card rounded-2xl p-6"
  >
    <ChartHeader
      title="Consultas"
      icon={<TrendingUp className="h-5 w-5 text-primary" />}
      period={period}
      onPeriodChange={onPeriodChange}
    />
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={consultasDataByPeriod[period]}>
          <defs>
            <linearGradient id="colorConsultas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(259, 51%, 56%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(259, 51%, 56%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorAprovadas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Area
            type="monotone"
            dataKey="consultas"
            name="Total"
            stroke="hsl(259, 51%, 56%)"
            fillOpacity={1}
            fill="url(#colorConsultas)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="aprovadas"
            name="Aprovadas"
            stroke="hsl(142, 76%, 36%)"
            fillOpacity={1}
            fill="url(#colorAprovadas)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </motion.div>
);

interface MarketingChartProps {
  period: PeriodFilter;
  onPeriodChange: (period: PeriodFilter) => void;
}

const MarketingChart = ({ period, onPeriodChange }: MarketingChartProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 }}
    className="glass-card rounded-2xl p-6"
  >
    <ChartHeader
      title="Ações de Marketing"
      icon={<Calendar className="h-5 w-5 text-primary" />}
      period={period}
      onPeriodChange={onPeriodChange}
    />
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={marketingDataByPeriod[period]}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="rcs" name="RCS" fill="hsl(168, 76%, 40%)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="email" name="Email" fill="hsl(259, 51%, 56%)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="ligacoes" name="Ligações IA" fill="hsl(270, 50%, 60%)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </motion.div>
);

interface ConversaoChartProps {
  period: PeriodFilter;
  onPeriodChange: (period: PeriodFilter) => void;
}

const ConversaoChart = ({ period, onPeriodChange }: ConversaoChartProps) => {
  const data = conversaoDataByPeriod[period];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card rounded-2xl p-6"
    >
      <ChartHeader
        title="Taxa de Conversão"
        period={period}
        onPeriodChange={onPeriodChange}
      />
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => [`${value}%`, 'Porcentagem']} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex justify-center gap-6">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-sm text-muted-foreground">{item.name}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

interface TendenciaChartProps {
  period: PeriodFilter;
  onPeriodChange: (period: PeriodFilter) => void;
}

const TendenciaChart = ({ period, onPeriodChange }: TendenciaChartProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.4 }}
    className="glass-card rounded-2xl p-6"
  >
    <ChartHeader
      title="Tendência"
      icon={<TrendingUp className="h-5 w-5 text-primary" />}
      period={period}
      onPeriodChange={onPeriodChange}
    />
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={tendenciaDataByPeriod[period]}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <YAxis
            yAxisId="left"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="consultas"
            name="Consultas"
            stroke="hsl(259, 51%, 56%)"
            strokeWidth={3}
            dot={{ fill: 'hsl(259, 51%, 56%)', strokeWidth: 2 }}
            activeDot={{ r: 8 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="conversao"
            name="Conversão %"
            stroke="hsl(142, 76%, 36%)"
            strokeWidth={3}
            dot={{ fill: 'hsl(142, 76%, 36%)', strokeWidth: 2 }}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </motion.div>
);

const DashboardCharts = () => {
  const [consultasPeriod, setConsultasPeriod] = useState<PeriodFilter>('semana');
  const [marketingPeriod, setMarketingPeriod] = useState<PeriodFilter>('mes');
  const [conversaoPeriod, setConversaoPeriod] = useState<PeriodFilter>('semana');
  const [tendenciaPeriod, setTendenciaPeriod] = useState<PeriodFilter>('ano');

  return (
    <div className="space-y-6">
      {/* Row 1: Consultas e Marketing */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ConsultasChart period={consultasPeriod} onPeriodChange={setConsultasPeriod} />
        <MarketingChart period={marketingPeriod} onPeriodChange={setMarketingPeriod} />
      </div>

      {/* Row 2: Conversão e Tendência */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ConversaoChart period={conversaoPeriod} onPeriodChange={setConversaoPeriod} />
        <TendenciaChart period={tendenciaPeriod} onPeriodChange={setTendenciaPeriod} />
      </div>
    </div>
  );
};

export default DashboardCharts;
