import { motion } from 'framer-motion';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ContractPipeline from '@/components/contratos/ContractPipeline';
import FloatingChatButton from '@/components/FloatingChatButton';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useContracts } from '@/hooks/useContracts';
import { Skeleton } from '@/components/ui/skeleton';

const Contratos = () => {
  const { contracts, loading, regenerateContract, fetchContracts } = useContracts();
  const isMobile = useIsMobile();

  const stats = {
    aguardando: contracts.filter((c) => c.contract_status === 'AGUARDANDO_ASSINATURA').length,
    pendencias: contracts.filter((c) => c.contract_status === 'PENDENCIAS_GERAIS').length,
    pagos: contracts.filter((c) => c.contract_status === 'PAGO').length,
    expirados: contracts.filter((c) => c.contract_status === 'EXPIRADO').length,
    cancelados: contracts.filter((c) => c.contract_status === 'CANCELADO').length,
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn('space-y-4 sm:space-y-6', isMobile && 'mt-14')}
      >
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Contratos</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Acompanhe o status de assinatura e pagamento dos contratos
          </p>
        </div>

        <div className={cn('grid gap-3', isMobile ? 'grid-cols-2' : 'grid-cols-5')}>
          {[
            { label: 'Aguardando', value: stats.aguardando, color: 'text-primary' },
            { label: 'Pendências', value: stats.pendencias, color: 'text-warning' },
            { label: 'Pagos', value: stats.pagos, color: 'text-success' },
            { label: 'Expirados', value: stats.expirados, color: 'text-muted-foreground' },
            { label: 'Cancelados', value: stats.cancelados, color: 'text-destructive' },
          ].map((s) => (
            <div key={s.label} className="glass-card rounded-xl p-3 sm:p-4 text-center">
              {loading ? (
                <Skeleton className="h-8 w-12 mx-auto mb-1" />
              ) : (
                <p className={cn('text-2xl sm:text-3xl font-bold', s.color)}>{s.value}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6">
          <h3 className="mb-3 sm:mb-4 text-lg sm:text-xl font-bold text-foreground">
            Pipeline de Contratos
          </h3>
          {loading ? (
            <div className="flex gap-4">
              {[1,2,3,4,5].map(i => (
                <Skeleton key={i} className="h-64 w-64 shrink-0 rounded-xl" />
              ))}
            </div>
          ) : (
            <ContractPipeline
              contracts={contracts}
              onRegenerate={regenerateContract}
              onRefresh={fetchContracts}
            />
          )}
        </div>

        <FloatingChatButton />
      </motion.div>
    </DashboardLayout>
  );
};

export default Contratos;
