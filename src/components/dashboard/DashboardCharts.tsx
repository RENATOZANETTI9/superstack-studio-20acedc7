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

// Dados de consultas ao longo do tempo
const consultasData = [
  { name: 'Seg', consultas: 120, aprovadas: 85, recusadas: 35 },
  { name: 'Ter', consultas: 150, aprovadas: 110, recusadas: 40 },
  { name: 'Qua', consultas: 180, aprovadas: 130, recusadas: 50 },
  { name: 'Qui', consultas: 200, aprovadas: 155, recusadas: 45 },
  { name: 'Sex', consultas: 240, aprovadas: 180, recusadas: 60 },
  { name: 'Sáb', consultas: 90, aprovadas: 70, recusadas: 20 },
  { name: 'Dom', consultas: 60, aprovadas: 45, recusadas: 15 },
];

// Dados de marketing ao longo do tempo
const marketingData = [
  { name: 'Sem 1', rcs: 320, email: 280, ligacoes: 150 },
  { name: 'Sem 2', rcs: 450, email: 390, ligacoes: 210 },
  { name: 'Sem 3', rcs: 520, email: 420, ligacoes: 280 },
  { name: 'Sem 4', rcs: 680, email: 550, ligacoes: 350 },
];

// Dados de conversão
const conversaoData = [
  { name: 'Aprovadas', value: 65, color: 'hsl(142, 76%, 36%)' },
  { name: 'Recusadas', value: 25, color: 'hsl(0, 84%, 60%)' },
  { name: 'Erro', value: 10, color: 'hsl(38, 92%, 50%)' },
];

// Dados de tendência mensal
const tendenciaData = [
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
];

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

const ConsultasChart = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 }}
    className="glass-card rounded-2xl p-6"
  >
    <h3 className="mb-4 text-lg font-bold text-foreground">Consultas da Semana</h3>
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={consultasData}>
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
          <XAxis 
            dataKey="name" 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={12}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={12}
          />
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

const MarketingChart = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 }}
    className="glass-card rounded-2xl p-6"
  >
    <h3 className="mb-4 text-lg font-bold text-foreground">Ações de Marketing</h3>
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={marketingData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="name" 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={12}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={12}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="rcs" 
            name="RCS" 
            fill="hsl(168, 76%, 40%)" 
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            dataKey="email" 
            name="Email" 
            fill="hsl(259, 51%, 56%)" 
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            dataKey="ligacoes" 
            name="Ligações IA" 
            fill="hsl(270, 50%, 60%)" 
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </motion.div>
);

const ConversaoChart = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3 }}
    className="glass-card rounded-2xl p-6"
  >
    <h3 className="mb-4 text-lg font-bold text-foreground">Taxa de Conversão</h3>
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={conversaoData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {conversaoData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => [`${value}%`, 'Porcentagem']}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
    <div className="mt-4 flex justify-center gap-6">
      {conversaoData.map((item) => (
        <div key={item.name} className="flex items-center gap-2">
          <div 
            className="h-3 w-3 rounded-full" 
            style={{ backgroundColor: item.color }}
          />
          <span className="text-sm text-muted-foreground">{item.name}</span>
        </div>
      ))}
    </div>
  </motion.div>
);

const TendenciaChart = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.4 }}
    className="glass-card rounded-2xl p-6"
  >
    <h3 className="mb-4 text-lg font-bold text-foreground">Tendência Anual</h3>
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={tendenciaData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="name" 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={12}
          />
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
  return (
    <div className="space-y-6">
      {/* Row 1: Consultas e Marketing */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ConsultasChart />
        <MarketingChart />
      </div>

      {/* Row 2: Conversão e Tendência */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ConversaoChart />
        <TendenciaChart />
      </div>
    </div>
  );
};

export default DashboardCharts;
