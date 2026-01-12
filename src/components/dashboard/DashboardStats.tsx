import { motion } from 'framer-motion';
import { 
  FileSearch, 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  Mail, 
  Phone,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
  delay?: number;
}

const StatCard = ({ title, value, change, icon, color, delay = 0 }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ scale: 1.02 }}
    className="glass-card cursor-pointer rounded-2xl p-6 transition-all hover:border-primary/50"
  >
    <div className="flex items-center gap-4">
      <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', color)}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>
    </div>
    {change !== undefined && (
      <div className="mt-4 flex items-center gap-2">
        {change >= 0 ? (
          <TrendingUp className="h-4 w-4 text-success" />
        ) : (
          <TrendingDown className="h-4 w-4 text-destructive" />
        )}
        <span className={cn(
          'text-sm font-medium',
          change >= 0 ? 'text-success' : 'text-destructive'
        )}>
          {change >= 0 ? '+' : ''}{change}%
        </span>
        <span className="text-xs text-muted-foreground">vs período anterior</span>
      </div>
    )}
  </motion.div>
);

interface DashboardStatsProps {
  stats: {
    consultas: number;
    aprovadas: number;
    recusadas: number;
    rcsEnviados: number;
    emailsEnviados: number;
    ligacoesRealizadas: number;
  };
}

const DashboardStats = ({ stats }: DashboardStatsProps) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard
        title="Consultas Hoje"
        value={stats.consultas.toLocaleString('pt-BR')}
        change={12}
        icon={<FileSearch className="h-6 w-6 text-white" />}
        color="bg-gradient-to-br from-primary to-primary/50"
        delay={0}
      />
      <StatCard
        title="Aprovadas"
        value={stats.aprovadas.toLocaleString('pt-BR')}
        change={8}
        icon={<CheckCircle className="h-6 w-6 text-white" />}
        color="bg-gradient-to-br from-success to-success/50"
        delay={0.1}
      />
      <StatCard
        title="Recusadas"
        value={stats.recusadas.toLocaleString('pt-BR')}
        change={-5}
        icon={<XCircle className="h-6 w-6 text-white" />}
        color="bg-gradient-to-br from-destructive to-destructive/50"
        delay={0.2}
      />
      <StatCard
        title="RCS Enviados"
        value={stats.rcsEnviados.toLocaleString('pt-BR')}
        change={24}
        icon={<MessageSquare className="h-6 w-6 text-white" />}
        color="bg-gradient-to-br from-secondary to-secondary/50"
        delay={0.3}
      />
      <StatCard
        title="Emails Enviados"
        value={stats.emailsEnviados.toLocaleString('pt-BR')}
        change={18}
        icon={<Mail className="h-6 w-6 text-white" />}
        color="bg-gradient-to-br from-orange-500 to-orange-500/50"
        delay={0.4}
      />
      <StatCard
        title="Ligações IA"
        value={stats.ligacoesRealizadas.toLocaleString('pt-BR')}
        change={32}
        icon={<Phone className="h-6 w-6 text-white" />}
        color="bg-gradient-to-br from-purple-500 to-purple-500/50"
        delay={0.5}
      />
    </div>
  );
};

export default DashboardStats;
