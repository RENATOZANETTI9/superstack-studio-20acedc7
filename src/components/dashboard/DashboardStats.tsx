import { motion } from 'framer-motion';
import { 
  FileSearch, 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  Mail, 
  Phone,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  AlertTriangle,
  Ban,
  Percent,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DashboardStats as DashboardStatsType } from '@/hooks/useDashboardStats';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  delay?: number;
}

const StatCard = ({ title, value, subtitle, icon, color, delay = 0 }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ scale: 1.02 }}
    className="glass-card cursor-pointer rounded-2xl p-4 sm:p-5 transition-all hover:border-primary/50"
  >
    <div className="flex items-center gap-3">
      <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl shrink-0', color)}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xl sm:text-2xl font-bold text-foreground truncate">{value}</p>
        <p className="text-xs sm:text-sm text-muted-foreground truncate">{title}</p>
      </div>
    </div>
    {subtitle && (
      <p className="mt-2 text-xs text-muted-foreground">{subtitle}</p>
    )}
  </motion.div>
);

interface DashboardStatsProps {
  stats: DashboardStatsType;
  loading?: boolean;
}

const DashboardStats = ({ stats, loading }: DashboardStatsProps) => {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const formatCurrency = (v: number) => 
    `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`;

  return (
    <div className="space-y-6">
      {/* Buscar Crédito - Consultas */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <FileSearch className="h-4 w-4" />
          Buscar Crédito
        </h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            title="Total Consultas"
            value={stats.totalConsultas.toLocaleString('pt-BR')}
            icon={<FileSearch className="h-5 w-5 text-primary-foreground" />}
            color="bg-gradient-to-br from-primary to-primary/60"
            delay={0}
          />
          <StatCard
            title="Aprovadas"
            value={stats.aprovadas.toLocaleString('pt-BR')}
            icon={<CheckCircle className="h-5 w-5 text-success-foreground" />}
            color="bg-gradient-to-br from-success to-success/60"
            delay={0.05}
          />
          <StatCard
            title="Recusadas"
            value={stats.recusadas.toLocaleString('pt-BR')}
            icon={<XCircle className="h-5 w-5 text-destructive-foreground" />}
            color="bg-gradient-to-br from-destructive to-destructive/60"
            delay={0.1}
          />
          <StatCard
            title="Taxa de Conversão"
            value={`${stats.taxaConversao}%`}
            icon={<Percent className="h-5 w-5 text-secondary-foreground" />}
            color="bg-gradient-to-br from-secondary to-secondary/60"
            delay={0.15}
          />
        </div>
      </div>

      {/* Créditos Aprovados - Pipeline */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Créditos Aprovados
        </h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <StatCard
            title="Aguardando Assinatura"
            value={stats.aguardandoAssinatura}
            icon={<Clock className="h-5 w-5 text-primary-foreground" />}
            color="bg-gradient-to-br from-primary to-primary/60"
            delay={0.2}
          />
          <StatCard
            title="Pendências"
            value={stats.pendenciasGerais}
            icon={<AlertTriangle className="h-5 w-5 text-warning-foreground" />}
            color="bg-gradient-to-br from-warning to-warning/60"
            delay={0.25}
          />
          <StatCard
            title="Pagos"
            value={stats.creditosPagos}
            subtitle={formatCurrency(stats.valorTotalPago)}
            icon={<CheckCircle className="h-5 w-5 text-success-foreground" />}
            color="bg-gradient-to-br from-success to-success/60"
            delay={0.3}
          />
          <StatCard
            title="Expirados"
            value={stats.creditosExpirados}
            icon={<Clock className="h-5 w-5 text-foreground" />}
            color="bg-gradient-to-br from-muted-foreground to-muted-foreground/60"
            delay={0.35}
          />
          <StatCard
            title="Cancelados"
            value={stats.creditosCancelados}
            icon={<Ban className="h-5 w-5 text-destructive-foreground" />}
            color="bg-gradient-to-br from-destructive to-destructive/60"
            delay={0.4}
          />
        </div>
      </div>

      {/* Gatilhos de Marketing */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Gatilhos de Marketing
        </h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            title="RCS Enviados"
            value={stats.rcsEnviados.toLocaleString('pt-BR')}
            icon={<MessageSquare className="h-5 w-5 text-secondary-foreground" />}
            color="bg-gradient-to-br from-secondary to-secondary/60"
            delay={0.45}
          />
          <StatCard
            title="Emails Enviados"
            value={stats.emailsEnviados.toLocaleString('pt-BR')}
            icon={<Mail className="h-5 w-5 text-primary-foreground" />}
            color="bg-gradient-to-br from-primary to-primary/60"
            delay={0.5}
          />
          <StatCard
            title="Ligações IA"
            value={stats.ligacoesIA.toLocaleString('pt-BR')}
            icon={<Phone className="h-5 w-5 text-primary-foreground" />}
            color="bg-gradient-to-br from-[hsl(270,50%,60%)] to-[hsl(270,50%,40%)]"
            delay={0.55}
          />
          <StatCard
            title="Gatilhos Restantes"
            value={stats.gatilhosRestantes.toLocaleString('pt-BR')}
            subtitle={`${stats.totalGatilhos} usados de 50`}
            icon={<Zap className="h-5 w-5 text-warning-foreground" />}
            color="bg-gradient-to-br from-warning to-warning/60"
            delay={0.6}
          />
        </div>
      </div>

      {/* Valores */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="glass-card rounded-2xl p-5 text-center"
        >
          <p className="text-xs text-muted-foreground mb-1">Valor Total Liberado</p>
          <p className="text-2xl font-bold gradient-text">{formatCurrency(stats.valorTotalLiberado)}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass-card rounded-2xl p-5 text-center"
        >
          <p className="text-xs text-muted-foreground mb-1">Valor Total Pago</p>
          <p className="text-2xl font-bold text-success">{formatCurrency(stats.valorTotalPago)}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          className="glass-card rounded-2xl p-5 text-center"
        >
          <p className="text-xs text-muted-foreground mb-1">Ticket Médio</p>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.ticketMedio)}</p>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardStats;
